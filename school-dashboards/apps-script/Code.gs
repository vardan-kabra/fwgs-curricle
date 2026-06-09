/**
 * FWGS Curricle — live data endpoint (Google Apps Script, standalone project).
 *
 * Reads the two private spreadsheets and serves them as JSON to the static
 * dashboards. The sheets stay private — only this script can read them.
 *
 *   GET  ?sheet=meals  ->  { groups:[...], data:[...] }   (shape: fixtures/meals.json)
 *   GET  ?sheet=buses  ->  [ {trip}, ... ]                (shape: fixtures/buses.json)
 *
 * DEPLOY
 *   1. script.google.com -> New project -> paste Code.gs + appsscript.json.
 *   2. Run `doGet` once (or `ping`) to grant the Sheets authorization prompt.
 *   3. Deploy -> New deployment -> Web app:  Execute as: Me   Access: Anyone
 *   4. Copy the /exec URL into assets/config.js  ->  endpoint: "...".
 *
 * A plain browser GET works cross-origin (no preflight). Don't add custom
 * request headers on the client or it becomes a preflighted request.
 */

var SPREADSHEETS = {
  // ⚠ TEST COPIES (owned by you) — switch to the shared originals when ready to go live.
  meals: '1dmoD4HtEh9VlnWfPKypOhmEGtprnUD_hPAWzUwMP2x4', // "Copy of Meal Break Timings 2026-2027"
  buses: '1ctLuODdEoNEyybp3wA0QH7rnpmiK-wF8-0Nm7i0JE6s', // "Copy of Transport Route 2026-27"
};
var MEAL_TAB = 'Dashboard Data';   // the clean tab pasted from out/meal-dashboard-tab.csv
var CACHE_SECONDS = 600;           // server-side cache so we don't re-read sheets every hit
var VERSION = 'bus-fix-1';         // bump + redeploy to confirm a NEW version actually went live

// ----------------------------------------------------------------- plumbing

function doGet(e) {
  var sheet = (e && e.parameter && e.parameter.sheet) || '';
  try {
    return json_(getData_(sheet));
  } catch (err) {
    return json_({ error: String((err && err.message) || err) });
  }
}

function getData_(sheet) {
  if (sheet === '__debug') return debugInfo_();
  if (!SPREADSHEETS[sheet]) throw new Error('Unknown sheet "' + sheet + '"');
  var cache = CacheService.getScriptCache();
  var key = 'fwgs:v1:' + sheet;
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  var data = (sheet === 'meals') ? buildMeals_() : buildBuses_();
  cache.put(key, JSON.stringify(data), CACHE_SECONDS);
  return data;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** ?sheet=__debug — reports the live deployment's IDs + the tabs it actually sees,
 *  so a config/version mismatch is visible. Safe to leave in; remove later if you like. */
function debugInfo_() {
  var out = { version: VERSION, ids: SPREADSHEETS, tabs: {} };
  ['meals', 'buses'].forEach(function (k) {
    try {
      out.tabs[k] = SpreadsheetApp.openById(SPREADSHEETS[k]).getSheets().map(function (s) { return s.getName(); });
    } catch (e) { out.tabs[k] = 'ERROR: ' + e.message; }
  });
  return out;
}

/** Read a tab as { header: value } row objects. getDisplayValues keeps the
 *  formatted text ("8:40 am", "3703") the dashboards print verbatim. */
function rows_(ssId, tabName) {
  var sh = SpreadsheetApp.openById(ssId).getSheetByName(tabName);
  if (!sh) throw new Error('Tab "' + tabName + '" not found');
  var values = sh.getDataRange().getDisplayValues();
  var head = values.shift().map(function (h) { return String(h).trim(); });
  return values.map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = String(r[i] == null ? '' : r[i]).trim(); });
    return o;
  });
}

// ------------------------------------------------------------------- meals

function buildMeals_() {
  var rs = rows_(SPREADSHEETS.meals, MEAL_TAB);
  var SERVICE = { 'morning pantry': 'morning', 'lunch': 'lunch', 'lunch pantry': 'pantry', 'exit pantry': 'exit' };
  var groups = [], gSeen = {}, byId = {}, order = [];
  rs.forEach(function (r) {
    var group = r['Group'], label = r['Grade/Role'];
    if (!group || !label) return;
    if (!gSeen[group]) { gSeen[group] = true; groups.push(group); }
    var id = slug_(label);
    if (!byId[id]) { byId[id] = { id: id, label: label, group: group, events: [] }; order.push(id); }
    var svc = SERVICE[(r['Service'] || '').toLowerCase()];
    if (!svc) return;
    var ev = { service: svc, time: r['Time'], sort: Number(r['Sort']) || 0, location: r['Location'] };
    if (r['Note']) ev.sub = r['Note'];
    byId[id].events.push(ev);
  });
  var data = order.map(function (id) {
    var e = byId[id];
    e.events.sort(function (a, b) { return a.sort - b.sort; });
    return e;
  });
  return { groups: groups, data: data };
}

// ------------------------------------------------------------------- buses

// One tab per trip; trip-level facts live here (the tabs hold only stops).
var BUS_TRIPS = {
  am740:  { id: 'am740',  badge: 'Morning',   direction: 'To School', who: 'Teachers + Grades 1–6',     schoolEvent: 'Reaches school', schoolTime: '7:40 AM',  timeWord: 'Pick-up' },
  am905:  { id: 'am905',  badge: 'Morning',   direction: 'To School', who: 'EY + Grades 7–12',          schoolEvent: 'Reaches school', schoolTime: '9:05 AM',  timeWord: 'Pick-up' },
  pm1210: { id: 'pm1210', badge: 'Afternoon', direction: 'Going Home', who: 'Jr. Kg + Sr. Kg + Grade 1', schoolEvent: 'Leaves school',  schoolTime: '12:10 PM', timeWord: 'Drop-off' },
  pm210:  { id: 'pm210',  badge: 'Afternoon', direction: 'Going Home', who: 'EY + Grades 1–6',           schoolEvent: 'Leaves school',  schoolTime: '2:10 PM',  timeWord: 'Drop-off' },
  pm345:  { id: 'pm345',  badge: 'Afternoon', direction: 'Going Home', who: 'Teachers + Grades 7–12',    schoolEvent: 'Leaves school',  schoolTime: '3:45 PM',  timeWord: 'Drop-off' },
};
var BUS_ORDER = ['am740', 'am905', 'pm1210', 'pm210', 'pm345'];

/** Identify a trip from its tab name by the time token (robust to reordering
 *  and to the notice tab, which matches nothing). Check 1210 before 210. */
function tripMetaForTab_(name) {
  var n = String(name || '').replace(/:/g, '').replace(/\s+/g, ' ').trim(); // strip ':' so "7:40"/"12:10" match 740/1210
  if (/(^|\D)740(\D|$)/.test(n)) return BUS_TRIPS.am740;
  if (/(^|\D)905(\D|$)/.test(n)) return BUS_TRIPS.am905;
  if (/1210/.test(n)) return BUS_TRIPS.pm1210;
  if (/(^|\D)210(\D|$)/.test(n)) return BUS_TRIPS.pm210;
  if (/(^|\D)345(\D|$)/.test(n)) return BUS_TRIPS.pm345;
  return null;
}

function buildBuses_() {
  var sheets = SpreadsheetApp.openById(SPREADSHEETS.buses).getSheets();
  var found = {};
  sheets.forEach(function (sh) {
    var meta = tripMetaForTab_(sh.getName());
    if (meta && !found[meta.id]) found[meta.id] = parseBusTab_(sh, meta);
  });
  var out = [];
  BUS_ORDER.forEach(function (id) { if (found[id]) out.push(found[id]); });
  if (out.length !== BUS_ORDER.length) {
    throw new Error('Bus tabs: expected ' + BUS_ORDER.length + ' trips, found ' + out.length);
  }
  return out;
}

/** Columns: A Sr.No | B Stop Name | C Stop Code | D (gap) | E clock time | ... */
function parseBusTab_(sh, meta) {
  var vals = sh.getDataRange().getDisplayValues();
  var routes = [], cur = null;
  for (var i = 0; i < vals.length; i++) {
    var a = String(vals[i][0] || '').trim();
    var b = String(vals[i][1] || '').trim();
    if (/^route\b/i.test(a)) { cur = { name: a.replace(/^route\s+/i, '').trim(), stops: [] }; routes.push(cur); continue; }
    if (/^sr\.?\s*no/i.test(a)) continue;          // column header row
    if (/^fountainhead/i.test(b)) continue;        // school node — the UI adds it
    if (cur && /^\d/.test(a) && b) {
      cur.stops.push({ name: cleanName_(b), code: intStr_(vals[i][2]), time: toTime_(vals[i][4], meta.badge) });
    }
  }
  return {
    id: meta.id, badge: meta.badge, direction: meta.direction, who: meta.who,
    schoolEvent: meta.schoolEvent, schoolTime: meta.schoolTime, timeWord: meta.timeWord, routes: routes,
  };
}

// ------------------------------------------------------------------- helpers

function slug_(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

function intStr_(v) { var n = parseFloat(v); return isFinite(n) ? String(Math.round(n)) : String(v || '').trim(); }

/** Light normalization of raw stop names (per project decision). */
function cleanName_(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*:-\s*/g, '.')      // "No :-1" -> "No.1"
    .replace(/\s+([,.;:])/g, '$1')  // tidy space before punctuation
    .replace(/\.+\s*$/, '')         // drop trailing period(s)
    .trim();
}

/** Format a stop time as "h:mm AM/PM". Accepts "6:53 AM", "6:53", or an Excel
 *  serial; the meridian is taken from the trip badge (each tab is one half-day,
 *  and afternoon cells can store an AM-range serial displayed as PM). */
function toTime_(v, badge) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  var h, m, mt = s.match(/^(\d{1,2}):(\d{2})/);
  if (mt) {
    h = +mt[1]; m = +mt[2];
    if (/pm/i.test(s) && h < 12) h += 12;
    if (/am/i.test(s) && h === 12) h = 0;
  } else {
    var f = Number(s);
    if (!isFinite(f)) return s;
    var mins = Math.round(f * 1440); h = Math.floor(mins / 60) % 24; m = mins % 60;
  }
  var ap = (badge === 'Afternoon') ? 'PM' : 'AM';
  var h12 = h % 12; if (h12 === 0) h12 = 12;
  return h12 + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
}

// Optional: run manually to trigger the auth prompt before deploying.
function ping() { return getData_('meals'); }
