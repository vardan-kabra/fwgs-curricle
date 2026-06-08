/* FWGS Curricle — live data loader.
 *
 * Strategy: stale-while-revalidate.
 *   1. If a cached copy exists, paint it immediately (page feels instant).
 *   2. If the cache is missing or older than FRESH_MS, fetch a fresh copy
 *      in the background and re-render when it arrives.
 *   3. If the network fails but we have cached data, keep showing it with a
 *      quiet "showing saved copy · updated X ago" note + Retry.
 *   4. If the network fails and there is no cache at all, show a friendly
 *      error with "Try again".
 *
 * The page only has to: provide a status-mount element and an onData(payload)
 * callback that (re)renders. onData may be called twice — once from cache,
 * once from the network — so it must be idempotent.
 */
(function () {
  "use strict";

  var cfg = (window.FWGS_CONFIG = window.FWGS_CONFIG || {});
  var PREFIX = cfg.cachePrefix || "fwgs:v1:";
  var FRESH_MS = (cfg.freshMinutes != null ? cfg.freshMinutes : 10) * 60000;

  // ---- one-time styles (reuse the page's CSS variables, with fallbacks) ----
  if (!document.getElementById("fwgs-live-style")) {
    var st = document.createElement("style");
    st.id = "fwgs-live-style";
    st.textContent = [
      ".fwgs-live{display:flex;align-items:center;gap:9px;width:fit-content;max-width:100%;",
      "font-family:inherit;font-size:13.5px;font-weight:600;color:var(--muted,#5a6b7b);",
      "background:var(--panel,#fff);border:1px solid var(--line,#dde5ec);border-radius:999px;",
      "padding:7px 14px;margin:2px 2px 10px;box-shadow:0 1px 2px rgba(20,40,60,.04)}",
      ".fwgs-live .dot{width:9px;height:9px;border-radius:50%;background:var(--muted,#5a6b7b);flex:none}",
      ".fwgs-live.ok .dot{background:var(--brand,#1d6f5c);box-shadow:0 0 0 3px var(--brand-soft,#e4f1ec)}",
      ".fwgs-live.loading .dot{background:var(--gold,#d8a531);animation:fwgsPulse 1s ease-in-out infinite}",
      ".fwgs-live.stale .dot{background:var(--gold,#d8a531)}",
      ".fwgs-live .msg{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".fwgs-live .retry{font-family:inherit;font-weight:700;font-size:13px;color:var(--brand-ink,#0f4a3d);",
      "background:none;border:none;cursor:pointer;padding:2px 4px;text-decoration:underline;flex:none}",
      "@keyframes fwgsPulse{0%,100%{opacity:1}50%{opacity:.35}}",
      ".fwgs-live-error{text-align:center;color:var(--muted,#5a6b7b);padding:40px 20px;",
      "border:2px dashed var(--line,#dde5ec);border-radius:18px;background:rgba(255,255,255,.6);margin:8px 0}",
      ".fwgs-live-error .big{font-size:42px;margin-bottom:10px}",
      ".fwgs-live-error .retry{margin-top:14px;font-family:inherit;font-weight:700;font-size:15px;color:#fff;",
      "background:var(--brand,#1d6f5c);border:none;border-radius:12px;padding:11px 20px;cursor:pointer}",
    ].join("");
    document.head.appendChild(st);
  }

  function nowMs() { return Date.now(); }

  function buildUrl(sheet) {
    var ep = (cfg.endpoint || "").trim();
    if (!ep) return "fixtures/" + sheet + ".json";
    return ep + (ep.indexOf("?") >= 0 ? "&" : "?") + "sheet=" + encodeURIComponent(sheet);
  }

  function cacheGet(sheet) {
    try {
      var raw = localStorage.getItem(PREFIX + sheet);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && typeof o.fetchedAt === "number" ? o : null;
    } catch (_) { return null; }
  }
  function cacheSet(sheet, payload) {
    try {
      localStorage.setItem(PREFIX + sheet, JSON.stringify({ fetchedAt: nowMs(), payload: payload }));
    } catch (_) { /* private mode / quota — just skip caching */ }
  }

  function fetchSheet(sheet) {
    return fetch(buildUrl(sheet), { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function timeAgo(ts) {
    var s = Math.max(0, (nowMs() - ts) / 1000);
    if (s < 45) return "just now";
    if (s < 90) return "1 min ago";
    var m = Math.round(s / 60);
    if (m < 60) return m + " min ago";
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    var d = Math.round(h / 24);
    return d + (d === 1 ? " day ago" : " days ago");
  }

  function init(opts) {
    var sheet = opts.sheet;
    var mount = opts.statusMount;
    var onData = opts.onData || function () {};
    var lastFetched = 0;
    var hasData = false;
    var ticker = null;

    if (!mount) { // no status UI available — still load data
      var cachedOnly = cacheGet(sheet);
      if (cachedOnly) onData(cachedOnly.payload);
      fetchSheet(sheet).then(function (p) { cacheSet(sheet, p); onData(p); }).catch(function () {});
      return;
    }

    mount.innerHTML = "";
    var pill = document.createElement("div");
    pill.className = "fwgs-live loading";
    pill.innerHTML = '<span class="dot"></span><span class="msg">Loading…</span>';
    mount.appendChild(pill);
    var msg = pill.querySelector(".msg");

    function setPill(cls, text, withRetry) {
      pill.className = "fwgs-live " + cls;
      msg.textContent = text;
      var btn = pill.querySelector(".retry");
      if (withRetry && !btn) {
        btn = document.createElement("button");
        btn.className = "retry";
        btn.textContent = "Retry";
        btn.onclick = function () { doFetch(); };
        pill.appendChild(btn);
      } else if (!withRetry && btn) {
        btn.remove();
      }
    }

    function showLiveLabel() {
      if (!hasData) return;
      if (nowMs() - lastFetched > FRESH_MS) {
        setPill("stale", "Showing saved copy · updated " + timeAgo(lastFetched), true);
      } else {
        setPill("ok", "Up to date · " + timeAgo(lastFetched), false);
      }
    }

    function startTicker() {
      if (ticker) return;
      ticker = setInterval(function () {
        if (hasData && !pill.classList.contains("loading")) showLiveLabel();
      }, 30000);
    }

    function fatalError() {
      mount.innerHTML = "";
      var box = document.createElement("div");
      box.className = "fwgs-live-error";
      box.innerHTML =
        '<div class="big">⚠️</div>' +
        "<p>Couldn’t load the latest information.<br>Please check your connection.</p>";
      var b = document.createElement("button");
      b.className = "retry";
      b.textContent = "Try again";
      b.onclick = function () { mount.innerHTML = ""; mount.appendChild(pill); doFetch(); };
      box.appendChild(b);
      mount.appendChild(box);
    }

    function doFetch() {
      setPill("loading", hasData ? "Refreshing…" : "Loading…", false);
      fetchSheet(sheet).then(function (payload) {
        cacheSet(sheet, payload);
        lastFetched = nowMs();
        hasData = true;
        onData(payload);
        showLiveLabel();
        startTicker();
      }).catch(function () {
        if (hasData) showLiveLabel(); // keep cached data on screen, mark stale + Retry
        else fatalError();
      });
    }

    // 1) paint cache immediately
    var cached = cacheGet(sheet);
    if (cached) {
      lastFetched = cached.fetchedAt;
      hasData = true;
      try { onData(cached.payload); } catch (_) {}
      showLiveLabel();
      startTicker();
    }
    // 2) revalidate if missing or stale
    if (!cached || nowMs() - cached.fetchedAt > FRESH_MS) doFetch();
  }

  window.FWGSLiveData = { init: init, timeAgo: timeAgo };
})();
