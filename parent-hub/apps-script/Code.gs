/**
 * FWGS — "My Bus" (parent-specific bus & route lookup).
 *
 * A logged-in parent opens this web app; it reads their signed-in Google
 * identity, finds their child in the roster BY EMAIL, and shows that child's
 * bus + route (and their specific stop, once the roster has it). Each parent
 * only ever sees their own child's row — no search, no enumeration.
 *
 * The parser is HEADER-DRIVEN and TAB-AUTO-DETECTING (it finds the roster by an
 * "Email"+"Name" header and reads columns by name), so column/tab reshuffles in
 * the sheet don't break it.
 *
 * ── DEPLOY (Web app) ──────────────────────────────────────────────────────
 *   Execute as:      Me (the owner)         ← reads the PRIVATE sheet; parents
 *                                             never get sheet access, yet
 *                                             getActiveUser() returns the CALLER.
 *   Who has access:  your school domain
 *   After editing this code, redeploy: Deploy → Manage deployments → (edit) →
 *   Version: New version → Deploy. The /exec URL stays the same.
 *
 * ⚠ getActiveUser().getEmail() returns an email only for callers in the SAME
 *   Workspace domain as the deployer (verified working for the deployer's domain).
 *
 * ── ENDPOINTS ─────────────────────────────────────────────────────────────
 *   GET /exec                              → the personalised "My Bus" HTML page
 *   GET /exec?mode=whoami&callback=fn       → JSONP { ok, studentName }
 */

var SHEET_ID = '1S7sMnnwmcNuwhNYouwoddSGojW5PYv0oXGjKEAzKR-w';

// ───────────────────────────────────────────────────────────── entry point
function doGet(e) {
  var mode = (e && e.parameter && e.parameter.mode) || '';
  var email = activeEmail_();

  if (mode === 'whoami') {
    var cb = ((e.parameter.callback || '').replace(/[^\w$]/g, '').slice(0, 64)) || 'callback';
    var who = email ? lookupChild_(email) : null;
    var payload = who ? { ok: true, studentName: who.name } : { ok: false };
    return ContentService
      .createTextOutput(cb + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  if (mode === 'debug') return debug_(email);

  if (!email) return html_(pageShell_('We couldn’t confirm your sign-in',
    '<p>Please open this page while signed in to your school account (the same one ' +
    'you use for the Parent Hub), then refresh.</p>'));

  var child = lookupChild_(email);
  if (!child) return html_(pageShell_('We couldn’t find your details yet',
    '<p>We didn’t find a bus record for <code>' + esc_(email) + '</code>. ' +
    'If your child uses school transport, please write to ' +
    '<a href="mailto:info@fwgs.in">info@fwgs.in</a> and we’ll sort it out.</p>'));

  return html_(renderMyBus_(child, getRoute_(child.busNo)));
}

// ───────────────────────────────────────────────────────────── identity
function activeEmail_() {
  try { return (Session.getActiveUser().getEmail() || '').trim().toLowerCase(); }
  catch (err) { return ''; }
}

// ───────────────────────────────────────────────────────────── diagnostics
/** GET /exec?mode=debug — what the script actually sees. Returns the running
 *  code version, the caller's resolved identity, which tab it picked as the
 *  roster + its detected columns, and where (if anywhere) the caller's email
 *  appears. Does NOT dump other people's data. */
function debug_(email) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var t = tabs_();
  var rosters = t.rosters.map(function (tab) {
    var foundCol = -1;
    if (email) {
      for (var i = 0; i < tab.vals.length && foundCol < 0; i++) {
        for (var c = 0; c < tab.vals[i].length; c++) {
          if (String(tab.vals[i][c] == null ? '' : tab.vals[i][c]).trim().toLowerCase() === email) { foundCol = c; break; }
        }
      }
    }
    return { tab: tab.name, columns: tab.cols, rows: tab.vals.length, yourEmailFoundInColumnIndex: foundCol };
  });
  var ch = email ? lookupChild_(email) : null;
  return ContentService.createTextOutput(JSON.stringify({
    codeVersion: 'v3-multi-roster',
    activeEmail: email || '(blank — identity not available)',
    tabNames: ss.getSheets().map(function (s) { return s.getName(); }),
    routesTab: t.routes ? t.routes.name : null,
    rosterCandidates: rosters,
    matched: ch ? { name: ch.name, busNo: ch.busNo, stop: ch.stop } : null
  }, null, 2)).setMimeType(ContentService.MimeType.JSON);
}

// ───────────────────────────────────────────────────── tab + header detection
/** Read every tab once; classify the roster (header has Email + Name) and the
 *  routes tab (header has Landmark + Pick-up, no Email). Cached per execution. */
var _tabs;
function tabs_() {
  if (_tabs) return _tabs;
  var sheets = SpreadsheetApp.openById(SHEET_ID).getSheets();
  var rosters = [], routes = null;
  for (var i = 0; i < sheets.length; i++) {
    var vals = sheets[i].getDataRange().getDisplayValues();
    var hdr = findHeader_(vals);
    if (!hdr) continue;
    var tab = { name: sheets[i].getName(), vals: vals, cols: hdr.cols };
    if (tab.cols.email != null && tab.cols.name != null) {
      rosters.push(tab);
    } else if (tab.cols.landmark != null && tab.cols.pick != null && tab.cols.email == null) {
      // prefer a dedicated routes tab (no Name column) over a name-only roster
      if (!routes || (routes.cols.name != null && tab.cols.name == null)) routes = tab;
    }
  }
  // richest rosters first: those carrying the bus-stop mapping, and "Parent" tabs
  rosters.sort(function (a, b) { return rosterScore_(b) - rosterScore_(a); });
  _tabs = { rosters: rosters, routes: routes };
  return _tabs;
}

function rosterScore_(tab) {
  var c = tab.cols, s = 0;
  if (c.landmark != null) s += 2;          // has the bus-stop mapping
  if (c.klass != null) s += 1;
  if (/parent/i.test(tab.name)) s += 1;
  return s;
}

/** Find a header row in the first rows of a tab; map known columns by header text. */
function findHeader_(vals) {
  for (var i = 0; i < Math.min(vals.length, 30); i++) {
    var cols = {};
    for (var c = 0; c < vals[i].length; c++) {
      var h = String(vals[i][c] || '').trim().toLowerCase();
      if (!h) continue;
      if (/^name$/.test(h)) cols.name = c;
      else if (/e-?mail/.test(h)) cols.email = c;
      else if (/^class$/.test(h)) cols.klass = c;
      else if (/pick/.test(h)) cols.pick = c;
      else if (/drop/.test(h)) cols.drop = c;
      else if (/landmark|stop/.test(h)) cols.landmark = c;
      else if (/map/.test(h)) cols.map = c;     // optional: a future map-link column
    }
    if ((cols.landmark != null && cols.pick != null) || (cols.email != null && cols.name != null)) {
      return { rowIndex: i, cols: cols };
    }
  }
  return null;
}

// ───────────────────────────────────────────────────────────── roster lookup
/** Find the child whose EMAIL matches `email`. Returns
 *  { name, klass, busNo, stop, pickup, drop } or null. */
function lookupChild_(email) {
  var rosters = tabs_().rosters, fallback = null;
  for (var t = 0; t < rosters.length; t++) {
    var col = rosters[t].cols, vals = rosters[t].vals, busNo = '';
    for (var i = 0; i < vals.length; i++) {
      var r = vals[i];
      var b = busBannerNo_(r);
      if (b) { busNo = b; continue; }
      if (String(r[col.email] == null ? '' : r[col.email]).trim().toLowerCase() !== email) continue;
      var hit = {
        name: String(r[col.name] || '').trim() || 'your child',
        klass: col.klass != null ? String(r[col.klass] || '').trim() : '',
        busNo: busNo,
        stop: col.landmark != null ? cleanStop_(r[col.landmark]) : '',
        pickup: col.pick != null ? fmtTime_(r[col.pick], 'am') : '',
        drop: col.drop != null ? fmtTime_(r[col.drop], 'pm') : ''
      };
      if (hit.busNo) return hit;        // ideal: a match that resolves to a bus
      if (!fallback) fallback = hit;    // else keep a bus-less match as a fallback
    }
  }
  return fallback;
}

// ───────────────────────────────────────────────────────────── route lookup
/** Stops for one bus: prefer the dedicated routes tab; fall back to building it
 *  from that bus's students in the roster (covers buses missing from routes). */
function getRoute_(busNo) {
  var t = tabs_();
  var stops = collectStops_(t.routes, busNo);
  for (var i = 0; i < t.rosters.length && !stops.length; i++) {
    if (t.rosters[i].cols.landmark != null) stops = collectStops_(t.rosters[i], busNo);
  }
  return { busNo: busNo, stops: dedupeStops_(stops) };
}

function collectStops_(tab, busNo) {
  if (!tab || !busNo) return [];
  var col = tab.cols, inBus = false, out = [];
  for (var i = 0; i < tab.vals.length; i++) {
    var r = tab.vals[i];
    var b = busBannerNo_(r);
    if (b) { inBus = (b === busNo); continue; }
    if (!inBus) continue;
    var name = cleanStop_(r[col.landmark]);
    if (!name) continue;
    var lname = name.toLowerCase();
    if (lname === 'landmark' || lname === 'stop') continue;   // skip the per-bus header row
    out.push({
      name: name,
      pickup: col.pick != null ? fmtTime_(r[col.pick], 'am') : '',
      drop: col.drop != null ? fmtTime_(r[col.drop], 'pm') : '',
      map: col.map != null ? String(r[col.map] || '').trim() : ''
    });
  }
  return out;
}

function dedupeStops_(stops) {
  var seen = {}, out = [];
  for (var i = 0; i < stops.length; i++) {
    var k = stops[i].name.toLowerCase();
    if (seen[k]) continue;
    seen[k] = true; out.push(stops[i]);
  }
  return out;
}

// ───────────────────────────────────────────────────────────── helpers
/** Bus number if column 0 is a "BUS NO n …" banner (any case), else ''. */
function busBannerNo_(r) {
  var m = String(r[0] || '').match(/bus\s*no\.?\s*(\d+)/i);
  return m ? m[1] : '';
}

function cleanStop_(s) {
  var t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (/fountain\s*head?d?\s*wock?h?ardt/i.test(t)) return 'Fountainhead Wockhardt Global School';
  return t.replace(/\s+([,.;:])/g, '$1');
}

/** "7" / "7.05" → "7:05 AM"; "3.50" → "3:50 PM". ap = 'am' (pickup) | 'pm' (drop). */
function fmtTime_(v, ap) {
  var s = String(v == null ? '' : v).trim();
  if (!s) return '';
  var m = s.match(/^(\d{1,2})(?:[.:](\d{1,2}))?/);
  if (!m) return s;
  var h = +m[1], mm = m[2] ? (m[2].length === 1 ? m[2] + '0' : m[2]) : '00';
  return h + ':' + mm + ' ' + (ap === 'pm' ? 'PM' : 'AM');
}

function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function html_(body) {
  return HtmlService.createHtmlOutput(body)
    .setTitle('My Bus · FWGS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ───────────────────────────────────────────────────────────── rendering
function pageShell_(heading, inner) {
  return STYLE_ + '<div class="wrap"><div class="card"><h1>' + esc_(heading) + '</h1>' +
    inner + '<p class="back"><a href="https://fwgs-curricle.pages.dev/parent-hub/">← Back to the Parent Hub</a></p>' +
    '</div></div>';
}

function renderMyBus_(child, route) {
  var hasStop = !!child.stop;
  var rowsHtml = route.stops.map(function (s) {
    var isSchool = /global school/i.test(s.name);
    var mine = hasStop && s.name.toLowerCase() === child.stop.toLowerCase();
    var pin = (s.map && /^https?:/i.test(s.map))
      ? ' <a class="pin" href="' + esc_(s.map) + '" target="_blank" rel="noopener" title="Open in Maps">📍</a>' : '';
    return '<tr class="' + (isSchool ? 'school' : '') + (mine ? ' mine' : '') + '">' +
      '<td class="stop">' + esc_(s.name) + pin + '</td>' +
      '<td class="t">' + esc_(s.pickup) + '</td>' +
      '<td class="t">' + esc_(s.drop) + '</td>' +
    '</tr>';
  }).join('');

  var klass = child.klass ? ' <span class="klass">' + esc_(child.klass) + '</span>' : '';
  var busLabel = route.busNo ? 'Bus ' + esc_(route.busNo) : 'your bus';

  var stopBlock = hasStop
    ? '<div class="mystop"><div class="lbl">Your stop</div><div class="nm">' + esc_(child.stop) + '</div>' +
      '<div class="tm">Pick-up ' + esc_(child.pickup || '—') + ' · Drop ' + esc_(child.drop || '—') + '</div></div>'
    : '<p class="note2">Your child’s specific stop isn’t marked yet — find it in the route below, or write to ' +
      '<a href="mailto:info@fwgs.in">info@fwgs.in</a>.</p>';

  return STYLE_ +
    '<div class="wrap">' +
      '<div class="hello">Welcome, parent of <strong>' + esc_(child.name) + '</strong>' + klass + '</div>' +
      '<div class="card">' +
        '<div class="bus">' + busLabel + '</div>' +
        '<p class="note">Bus allocation may change for operational reasons.</p>' +
        stopBlock +
        (route.stops.length
          ? '<table class="route"><thead><tr><th>Stop</th><th>Pick-up</th><th>Drop</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>'
          : '<p>Route details for this bus aren’t available yet — please write to <a href="mailto:info@fwgs.in">info@fwgs.in</a>.</p>') +
        '<p class="hint">Pick-up times are morning (to school); drop times are afternoon (home).</p>' +
      '</div>' +
      '<p class="back"><a href="https://fwgs-curricle.pages.dev/parent-hub/">← Back to the Parent Hub</a></p>' +
    '</div>';
}

var STYLE_ =
  '<style>' +
  ':root{--bg:#FAF7F0;--card:#fff;--ink:#14201B;--soft:#4F5C56;--faint:#8A9189;--rule:#E2DCC9;--accent:#1A4D3E;--accentSoft:#DEEAE3;--gold:#A07A2C;--goldSoft:#EFE3C5;--orange:#C2613A;}' +
  '*{box-sizing:border-box}body{margin:0}' +
  '.wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--ink);' +
  'min-height:100vh;padding:28px 16px 60px;max-width:680px;margin:0 auto}' +
  '.hello{font-size:20px;margin:6px 0 18px}.hello .klass{color:var(--soft);font-size:15px}' +
  '.card{background:var(--card);border:1px solid var(--rule);border-radius:16px;padding:22px 22px 20px;box-shadow:0 10px 30px -20px rgba(20,32,27,.4)}' +
  '.card h1{font-size:22px;margin:0 0 10px}' +
  '.bus{display:inline-block;font-weight:700;color:var(--accent);background:var(--accentSoft);border-radius:999px;padding:6px 16px;font-size:15px}' +
  '.note{color:var(--faint);font-size:13px;font-style:italic;margin:12px 0 4px}' +
  '.note2{color:var(--soft);font-size:14px;margin:14px 0 0}' +
  '.mystop{margin:14px 0 6px;border:1px solid #d8c79a;background:var(--goldSoft);border-radius:12px;padding:14px 16px}' +
  '.mystop .lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}' +
  '.mystop .nm{font-size:18px;font-weight:700;margin:3px 0}' +
  '.mystop .tm{font-size:13.5px;color:var(--soft)}' +
  '.route{width:100%;border-collapse:collapse;margin:16px 0 6px;font-size:14.5px}' +
  '.route th{text-align:left;color:var(--soft);font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--rule);padding:8px 10px}' +
  '.route td{padding:11px 10px;border-bottom:1px solid var(--rule);vertical-align:top;transition:background .16s ease,box-shadow .16s ease}' +
  '.route td.t{color:var(--soft);white-space:nowrap;width:84px}' +
  '.route tbody tr:hover td{background:var(--accentSoft)}' +
  '.route tbody tr:hover td.stop{box-shadow:inset 3px 0 0 var(--accent)}' +
  '.route tr.school td{font-weight:700;color:var(--accent)}' +
  '.route tr.mine td{background:var(--goldSoft);font-weight:700}' +
  '.route tr.mine:hover td{background:#ecdcb0}' +
  '.pin{text-decoration:none;font-size:13px;margin-left:4px}' +
  '.hint{color:var(--soft);font-size:13px;margin:12px 0 0}' +
  '.back{margin-top:20px}.back a{color:var(--accent);text-decoration:none;font-weight:600}' +
  'a{color:var(--accent)}code{background:rgba(26,77,62,.09);padding:1px 5px;border-radius:4px}' +
  '</style>';

// Optional: run once to grant the Sheets + identity authorization prompt.
function ping() { return lookupChild_(activeEmail_()); }
