/**
 * diff-live.mjs — compare the DEPLOYED endpoint's JSON against the verified
 * fixtures, proving the live Apps Script reproduces the validated data.
 *
 *   node tools/diff-live.mjs <live_meals.json> <live_buses.json>
 *
 * Meals: exact match expected (id ignored — the endpoint derives slug ids).
 * Buses: structure + codes + times + trip metadata must match; stop *names*
 * are expected to differ (raw sheet names, lightly normalized vs the old polish).
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^﻿/, ''));
const [, , liveMeals, liveBuses] = process.argv;

// ---------- MEALS ----------
const fM = rd(join(root, 'fixtures', 'meals.json'));
const lM = rd(liveMeals);
const md = [];
if (JSON.stringify(lM.groups) !== JSON.stringify(fM.groups)) md.push(`groups order: [${lM.groups}] vs [${fM.groups}]`);
if (lM.data.length !== fM.data.length) md.push(`entry count ${lM.data.length} vs ${fM.data.length}`);
const mkey = (e) => e.group + '|' + e.label;
const lBy = Object.fromEntries(lM.data.map((e) => [mkey(e), e]));
const strip = (e) => e.events.map((v) => ({ service: v.service, time: v.time, sort: v.sort, location: v.location, sub: v.sub || '' }));
for (const fe of fM.data) {
  const le = lBy[mkey(fe)];
  if (!le) { md.push('missing entry ' + mkey(fe)); continue; }
  if (JSON.stringify(strip(le)) !== JSON.stringify(strip(fe)))
    md.push(`events differ for ${mkey(fe)}\n     live: ${JSON.stringify(strip(le))}\n     exp : ${JSON.stringify(strip(fe))}`);
}
console.log('MEALS  live vs fixture: ' + (md.length ? '✗\n - ' + md.join('\n - ') : '✓ EXACT MATCH (groups + events; id ignored)'));

// ---------- BUSES ----------
const fB = rd(join(root, 'fixtures', 'buses.json'));
const lB = rd(liveBuses);
let tripBad = 0, metaBad = 0, routeBad = 0, stopBad = 0, codeBad = 0, timeBad = 0, nameDiff = 0, stops = 0;
const samples = [];
if (lB.length !== fB.length) { tripBad++; }
fB.forEach((ft, ti) => {
  const lt = lB[ti];
  if (!lt) { tripBad++; return; }
  ['id', 'badge', 'direction', 'who', 'schoolEvent', 'schoolTime', 'timeWord'].forEach((k) => {
    if (lt[k] !== ft[k]) { metaBad++; if (samples.length < 8) samples.push(`meta ${ft.id}.${k}: "${lt[k]}" vs "${ft[k]}"`); }
  });
  if ((lt.routes || []).length !== ft.routes.length) { routeBad++; samples.push(`${ft.id} routes ${lt.routes.length} vs ${ft.routes.length}`); }
  ft.routes.forEach((fr, ri) => {
    const lr = (lt.routes || [])[ri];
    if (!lr) { stopBad++; return; }
    if (lr.stops.length !== fr.stops.length) { stopBad++; }
    fr.stops.forEach((fs, si) => {
      const ls = lr.stops[si];
      if (!ls) return;
      stops++;
      if (ls.code !== fs.code) { codeBad++; if (samples.length < 8) samples.push(`code ${ft.id} ${fr.name}#${si} "${ls.code}" vs "${fs.code}"`); }
      if (ls.time !== fs.time) { timeBad++; if (samples.length < 8) samples.push(`time ${ft.id} ${fr.name}#${si} "${ls.time}" vs "${fs.time}"`); }
      if (ls.name !== fs.name) nameDiff++;
    });
  });
});
console.log(`BUSES  live vs fixture: trips=${lB.length} (bad ${tripBad}) | metaBad=${metaBad} routeCountBad=${routeBad} stopCountBad=${stopBad} | stopsChecked=${stops} CODE_bad=${codeBad} TIME_bad=${timeBad} | nameDiff=${nameDiff} (expected)`);
if (samples.length) console.log(' - ' + samples.join('\n - '));
const ok = tripBad + metaBad + routeBad + stopBad + codeBad + timeBad === 0 && md.length === 0;
console.log(ok ? '\n✓ LIVE ENDPOINT MATCHES the validated data (only raw bus names differ, as designed).' : '\n✗ differences found — see above.');
