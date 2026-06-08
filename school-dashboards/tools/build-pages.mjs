/**
 * build-pages.mjs — generate the live dashboards from the original standalone files.
 *
 * The originals (in Downloads) stay untouched. This applies a handful of small,
 * exact, asserted edits and writes meals.html / buses.html. Re-run whenever an
 * original changes:   node tools/build-pages.mjs
 *
 * What it changes (and nothing else):
 *   - injects assets/config.js + assets/live-data.js in <head>
 *   - inserts <div id="liveStatus"> after </header>
 *   - replaces the giant inline `const DATA`/`const GROUPS` literals with empty
 *     `let` declarations (data now comes from the endpoint / fixtures)
 *   - makes the select handlers accept a skipScroll flag (so a background
 *     refresh can re-render without yanking the page around)
 *   - replaces the bootstrap call with FWGSLiveData.init(...) wiring
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = {
  meal: 'C:/Users/Vardan Kabra/Downloads/Fountainhead Meal Break Finder.html',
  bus:  'C:/Users/Vardan Kabra/Downloads/Fountainhead Bus Stop Finder.html',
};

const HEAD_TAGS =
  '<script src="assets/config.js"></script>\n' +
  '<script src="assets/live-data.js"></script>\n' +
  '</head>';

const STATUS_DIV = '  </header>\n  <div id="liveStatus"></div>';

/** Replace exactly one occurrence; throw if found 0 or >1 times. */
function sub(src, find, repl, label) {
  const first = src.indexOf(find);
  if (first < 0) throw new Error(`[${label}] anchor not found`);
  if (src.indexOf(find, first + find.length) >= 0) throw new Error(`[${label}] anchor not unique`);
  return src.slice(0, first) + repl + src.slice(first + find.length);
}

/** Replace `const <var> = [ ... ];` (balanced, string-aware) with `replacement`. */
function spliceConst(src, varName, replacement) {
  const marker = 'const ' + varName + ' =';
  const i = src.indexOf(marker);
  if (i < 0) throw new Error(`[${varName}] const not found`);
  const start = src.indexOf('[', i);
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let k = start; k < src.length; k++) {
    const c = src[k];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = k + 1; break; } }
  }
  if (end < 0) throw new Error(`[${varName}] unbalanced brackets`);
  let semi = end;
  while (semi < src.length && /\s/.test(src[semi])) semi++;
  if (src[semi] === ';') semi++;
  return src.slice(0, i) + replacement + src.slice(semi);
}

// ---------------------------------------------------------------- MEALS
function buildMeals() {
  let s = readFileSync(SRC.meal, 'utf8');
  s = sub(s, '</head>', HEAD_TAGS, 'meal head');
  s = sub(s, '  </header>', STATUS_DIV, 'meal status');
  s = spliceConst(s, 'DATA', 'let DATA = [];');
  s = spliceConst(s, 'GROUPS', 'let GROUPS = [];');
  s = sub(s, 'const byId = Object.fromEntries(DATA.map(e=>[e.id,e]));', 'let byId = {};', 'meal byId');
  s = sub(s, 'function select(id){', 'function select(id, skipScroll){', 'meal select sig');
  s = sub(s,
    "  step2.scrollIntoView({behavior:'smooth', block:'start'});",
    "  if(!skipScroll) step2.scrollIntoView({behavior:'smooth', block:'start'});",
    'meal select scroll');
  const init = [
    '// ----- Live data wiring (hosted version) -----',
    'function applyMealData(payload){',
    '  DATA = (payload && payload.data) || [];',
    '  GROUPS = (payload && payload.groups) || [];',
    '  byId = Object.fromEntries(DATA.map(e=>[e.id,e]));',
    "  groupsEl.innerHTML = '';",
    '  build();',
    '  if(current && byId[current]) select(current, true);',
    '}',
    "FWGSLiveData.init({ sheet:'meals', statusMount:document.getElementById('liveStatus'), onData:applyMealData });",
    '</script>',
  ].join('\n');
  s = sub(s, 'build();\n</script>', init, 'meal bootstrap');
  return s;
}

// ---------------------------------------------------------------- BUSES
function buildBuses() {
  let s = readFileSync(SRC.bus, 'utf8');
  s = sub(s, '</head>', HEAD_TAGS, 'bus head');
  s = sub(s, '  </header>', STATUS_DIV, 'bus status');
  s = spliceConst(s, 'DATA', 'let DATA = [];');
  s = sub(s, 'function selectTrip(i){', 'function selectTrip(i, skipScroll){', 'bus selectTrip sig');
  s = sub(s,
    "  searchSection.scrollIntoView({behavior:'smooth', block:'start'});\n  setTimeout(()=>q.focus({preventScroll:true}), 350);",
    "  if(!skipScroll){\n    searchSection.scrollIntoView({behavior:'smooth', block:'start'});\n    setTimeout(()=>q.focus({preventScroll:true}), 350);\n  }",
    'bus selectTrip scroll');
  const init = [
    '// ----- Live data wiring (hosted version) -----',
    'function applyBusData(payload){',
    '  DATA = Array.isArray(payload) ? payload : ((payload && payload.data) || []);',
    "  trips.innerHTML = '';",
    '  buildTrips();',
    '  if(current !== null && DATA[current]) selectTrip(current, true);',
    '}',
    "FWGSLiveData.init({ sheet:'buses', statusMount:document.getElementById('liveStatus'), onData:applyBusData });",
    '</script>',
  ].join('\n');
  s = sub(s, 'buildTrips();\n</script>', init, 'bus bootstrap');
  return s;
}

function write(rel, content) {
  const out = resolve(root, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content, 'utf8');
  return content.length;
}

const mealLen = write('meals.html', buildMeals());
const busLen = write('buses.html', buildBuses());
console.log(`meals.html  ${mealLen.toLocaleString()} bytes`);
console.log(`buses.html  ${busLen.toLocaleString()} bytes`);
console.log('OK — all anchors matched.');
