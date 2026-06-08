/**
 * gen-meal-tab.mjs — build the clean, machine-readable meal tab from the
 * verified fixture, so the school can paste ONE tidy tab into the meal
 * spreadsheet and the endpoint reads that instead of the ambiguous poster.
 *
 *   node tools/gen-meal-tab.mjs   ->   out/meal-dashboard-tab.csv
 *
 * Columns (one row per grade/role × meal): Group, Grade/Role, Service, Time,
 * Location, Note, Sort. The endpoint (buildMeals_) maps these straight to the
 * dashboard shape — see tools/validate-meals.mjs for the round-trip proof.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const m = JSON.parse(readFileSync(join(root, 'fixtures', 'meals.json'), 'utf8'));

const SVC = { morning: 'Morning Pantry', lunch: 'Lunch', pantry: 'Lunch Pantry', exit: 'Exit Pantry' };
const header = ['Group', 'Grade/Role', 'Service', 'Time', 'Location', 'Note', 'Sort'];
const rows = [header];

m.groups.forEach((g) => {
  m.data.filter((e) => e.group === g).forEach((e) => {
    e.events.slice().sort((a, b) => a.sort - b.sort).forEach((ev) => {
      rows.push([g, e.label, SVC[ev.service] || ev.service, ev.time, ev.location, ev.sub || '', String(ev.sort)]);
    });
  });
});

const csvCell = (v) => /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

mkdirSync(join(root, 'out'), { recursive: true });
const outPath = join(root, 'out', 'meal-dashboard-tab.csv');
writeFileSync(outPath, csv, 'utf8');

console.log(`wrote ${outPath}`);
console.log(`${rows.length - 1} data rows across ${m.groups.length} groups, ${m.data.length} grades/roles`);
console.log('\npreview (first 8 rows):');
rows.slice(0, 9).forEach((r) => console.log('  ' + r.join(' | ')));
