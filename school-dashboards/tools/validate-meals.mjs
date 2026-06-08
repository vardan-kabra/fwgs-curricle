/**
 * validate-meals.mjs — prove the meal endpoint logic reproduces the verified
 * data exactly. Reads the generated clean tab (out/meal-dashboard-tab.csv),
 * runs the SAME transform buildMeals_ uses, and deep-compares to
 * fixtures/meals.json (ignoring the internal `id`, which the endpoint derives).
 *
 *   node tools/validate-meals.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c === '\r') { /* skip */ }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ---- transform: identical logic to apps-script/Code.gs buildMeals_ ----
function buildMeals(tabRows) {
  const head = tabRows[0].map((h) => h.trim());
  const recs = tabRows.slice(1).filter((r) => r.some((c) => c !== '')).map((r) => {
    const o = {}; head.forEach((h, i) => (o[h] = (r[i] || '').trim())); return o;
  });
  const SERVICE = { 'morning pantry': 'morning', lunch: 'lunch', 'lunch pantry': 'pantry', 'exit pantry': 'exit' };
  const groups = [], gSeen = {}, byId = {}, order = [];
  for (const r of recs) {
    const group = r['Group'], label = r['Grade/Role'];
    if (!group || !label) continue;
    if (!gSeen[group]) { gSeen[group] = true; groups.push(group); }
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!byId[id]) { byId[id] = { id, label, group, events: [] }; order.push(id); }
    const svc = SERVICE[(r['Service'] || '').toLowerCase()];
    if (!svc) continue;
    const ev = { service: svc, time: r['Time'], sort: Number(r['Sort']) || 0, location: r['Location'] };
    if (r['Note']) ev.sub = r['Note'];
    byId[id].events.push(ev);
  }
  const data = order.map((id) => { const e = byId[id]; e.events.sort((a, b) => a.sort - b.sort); return e; });
  return { groups, data };
}

// ---- compare (ignore id) ----
const got = buildMeals(parseCSV(readFileSync(join(root, 'out', 'meal-dashboard-tab.csv'), 'utf8')));
const exp = JSON.parse(readFileSync(join(root, 'fixtures', 'meals.json'), 'utf8'));
const diffs = [];

if (JSON.stringify(got.groups) !== JSON.stringify(exp.groups)) diffs.push(`groups order: [${got.groups}] vs [${exp.groups}]`);
if (got.data.length !== exp.data.length) diffs.push(`entry count: ${got.data.length} vs ${exp.data.length}`);

const key = (e) => e.group + '|' + e.label;
const gotBy = Object.fromEntries(got.data.map((e) => [key(e), e]));
for (const ee of exp.data) {
  const ge = gotBy[key(ee)];
  if (!ge) { diffs.push(`missing entry: ${key(ee)}`); continue; }
  const strip = (e) => e.events.map((v) => ({ service: v.service, time: v.time, sort: v.sort, location: v.location, sub: v.sub || '' }));
  if (JSON.stringify(strip(ge)) !== JSON.stringify(strip(ee))) {
    diffs.push(`events differ for ${key(ee)}:\n   got: ${JSON.stringify(strip(ge))}\n   exp: ${JSON.stringify(strip(ee))}`);
  }
}

console.log('=== Meal round-trip validation (clean tab -> endpoint logic -> vs fixture) ===');
console.log(`groups: ${got.data.length} entries, ${got.data.reduce((n, e) => n + e.events.length, 0)} events`);
if (diffs.length) { console.log('\n✗ DIFFS:\n - ' + diffs.join('\n - ')); process.exit(1); }
console.log('\n✓ EXACT MATCH — the clean tab reproduces the verified meal data perfectly.');
