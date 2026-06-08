/**
 * validate-buses.mjs — prove the bus transform reads the real workbook correctly.
 *
 * Parses each trip tab (dumped CSV) into the dashboard's stop list and compares
 * the STRUCTURE (route count, per-route stop count, stop codes, stop times)
 * against fixtures/buses.json. Stop *names* are reported separately because the
 * original HTML hand-polished them, so they are expected to differ from the raw
 * sheet text.
 *
 *   node tools/validate-buses.mjs ["<dump-dir>"]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dumpDir = process.argv[2] || join(process.env.LOCALAPPDATA || process.env.TMP || '.', 'Temp', 'fwgs_busdump');
const fixture = JSON.parse(readFileSync(join(root, 'fixtures', 'buses.json'), 'utf8'));

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c === '\r') { /* skip */ }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const intStr = (v) => { const n = parseFloat(v); return isFinite(n) ? String(Math.round(n)) : String(v || '').trim(); };

function toTime(v, badge) {
  const s = String(v == null ? '' : v).trim();
  if (s === '') return '';
  const f = Number(s);
  if (!isFinite(f) || f < 0 || f >= 1) return s; // already a formatted string (e.g. GAS getDisplayValues)
  const mins = Math.round(f * 1440);
  let h = Math.floor(mins / 60) % 24, m = mins % 60;
  // Each tab is entirely one half of the day; trust the trip's badge for the
  // meridian (the afternoon cells store an AM-range serial displayed as PM).
  const ap = badge === 'Afternoon' ? 'PM' : 'AM';
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

function parseTrip(rows, badge) {
  const routes = [];
  let cur = null;
  for (const r of rows) {
    const a = (r[0] || '').trim();
    const b = (r[1] || '').trim();
    if (/^route\b/i.test(a)) { cur = { name: a.replace(/^route\s+/i, '').trim(), stops: [] }; routes.push(cur); continue; }
    if (/^sr\.?\s*no/i.test(a)) continue;          // column header
    if (/^fountainhead/i.test(b)) continue;        // school node (added by the UI)
    if (cur && /^\d/.test(a) && b) cur.stops.push({ name: b, code: intStr(r[2]), time: toTime(r[4], badge) });
  }
  return routes;
}

const files = readdirSync(dumpDir).filter((f) => /^\d+_.*\.csv$/.test(f) && !/^0_/.test(f)).sort();
let totalStops = 0, codeBad = 0, timeBad = 0, nameDiff = 0, routeCountBad = 0, stopCountBad = 0;
const samples = [];

files.forEach((file, ti) => {
  const exp = fixture[ti];
  const got = parseTrip(parseCSV(readFileSync(join(dumpDir, file), 'utf8')), exp.badge);
  const tag = `${exp.id} (${file})`;
  if (got.length !== exp.routes.length) { routeCountBad++; console.log(`✗ ${tag}: routes ${got.length} != ${exp.routes.length}`); }
  exp.routes.forEach((er, ri) => {
    const gr = got[ri];
    if (!gr) { stopCountBad++; return; }
    if (gr.stops.length !== er.stops.length) { stopCountBad++; console.log(`  ✗ ${tag} route ${er.name}: stops ${gr.stops.length} != ${er.stops.length}`); }
    er.stops.forEach((es, si) => {
      const gs = gr.stops[si]; if (!gs) return;
      totalStops++;
      if (gs.code !== es.code) { codeBad++; if (samples.length < 6) samples.push(`code ${tag} ${er.name}#${si}: "${gs.code}" vs "${es.code}"`); }
      if (gs.time !== es.time) { timeBad++; if (samples.length < 6) samples.push(`time ${tag} ${er.name}#${si}: "${gs.time}" vs "${es.time}"`); }
      if (gs.name !== es.name) nameDiff++;
    });
  });
});

console.log('\n=== Bus structural validation vs fixtures/buses.json ===');
console.log(`trips checked     : ${files.length}`);
console.log(`stops compared    : ${totalStops}`);
console.log(`route-count diffs : ${routeCountBad}`);
console.log(`stop-count diffs  : ${stopCountBad}`);
console.log(`CODE mismatches   : ${codeBad}`);
console.log(`TIME mismatches   : ${timeBad}`);
console.log(`name diffs        : ${nameDiff}  (expected — HTML hand-polished the raw sheet names)`);
if (samples.length) console.log('samples:\n - ' + samples.join('\n - '));
console.log(codeBad === 0 && timeBad === 0 && routeCountBad === 0 && stopCountBad === 0
  ? '\n✓ STRUCTURE MATCHES — the workbook parses cleanly into the dashboard shape.'
  : '\n✗ structural mismatches found (see above).');
