/**
 * One-off + regression extractor.
 *
 * Pulls the hand-built `const DATA`/`const GROUPS` literals out of the two
 * original standalone dashboards and writes them to fixtures/*.json.
 *
 * These fixtures are the source of truth for the JSON *contract*:
 *   - local dev mock (so the pages render with no Apps Script deployed)
 *   - the exact shape the Apps Script transform must reproduce from the sheets
 *   - a dated snapshot of the data as it stood when we went "live"
 *
 * Re-run any time the originals change:  node tools/extract-fixtures.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SRC = {
  meal: 'C:/Users/Vardan Kabra/Downloads/Fountainhead Meal Break Finder.html',
  bus:  'C:/Users/Vardan Kabra/Downloads/Fountainhead Bus Stop Finder.html',
};

/** Extract a JS array literal assigned to `const <varName> =`, respecting
 *  nested brackets and double-quoted strings, then JSON.parse it. */
function extractArray(src, varName) {
  const marker = `const ${varName} =`;
  const i = src.indexOf(marker);
  if (i < 0) throw new Error(`${varName}: marker not found`);
  const start = src.indexOf('[', i);
  if (start < 0) throw new Error(`${varName}: '[' not found`);

  let depth = 0, inStr = false, esc = false, end = -1;
  for (let k = start; k < src.length; k++) {
    const c = src[k];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = k + 1; break; } }
  }
  if (end < 0) throw new Error(`${varName}: unbalanced brackets`);
  return JSON.parse(src.slice(start, end));
}

function writeJson(relPath, obj) {
  const out = resolve(root, relPath);
  mkdirSync(dirname(out), { recursive: true });
  writeJson_(out, obj);
  return out;
}
function writeJson_(abs, obj) {
  writeFileSync(abs, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

// --- Meals: two consts (GROUPS + DATA) -> { groups, data } ---
const mealSrc = readFileSync(SRC.meal, 'utf8');
const meals = {
  groups: extractArray(mealSrc, 'GROUPS'),
  data: extractArray(mealSrc, 'DATA'),
};

// --- Buses: one const (DATA = array of trips) ---
const busSrc = readFileSync(SRC.bus, 'utf8');
const buses = extractArray(busSrc, 'DATA');

writeJson('fixtures/meals.json', meals);
writeJson('fixtures/buses.json', buses);

// --- Evidence ---
const mealServices = new Set();
let mealEvents = 0;
for (const g of meals.data) for (const e of g.events) { mealServices.add(e.service); mealEvents++; }

let routes = 0, stops = 0;
const busBadges = new Set();
for (const t of buses) {
  busBadges.add(`${t.badge}/${t.direction}`);
  for (const r of t.routes) { routes++; stops += r.stops.length; }
}

console.log('MEALS  → fixtures/meals.json');
console.log(`  groups : ${meals.groups.length}  [${meals.groups.join(', ')}]`);
console.log(`  entries: ${meals.data.length} (grades/roles)`);
console.log(`  events : ${mealEvents}  services: [${[...mealServices].join(', ')}]`);
console.log('');
console.log('BUSES  → fixtures/buses.json');
console.log(`  trips  : ${buses.length}  [${[...busBadges].join(', ')}]`);
console.log(`  routes : ${routes}`);
console.log(`  stops  : ${stops}`);
