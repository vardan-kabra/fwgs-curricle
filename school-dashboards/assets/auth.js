/* FWGS Curricle — Google sign-in gate (used by the bus app only).
 *
 * Shows a full-page "Sign in with Google" overlay; nothing behind it loads
 * until the user signs in with any Google account. The resulting ID token
 * (a short-lived JWT) is handed to the data layer, which passes it to the
 * endpoint — and the endpoint verifies it before returning bus data. So this
 * is a real gate, not just a hidden page.
 *
 * Token lives in sessionStorage (cleared when the tab closes). On expiry the
 * endpoint replies auth_required and the page re-prompts.
 */
(function () {
  "use strict";

  var cfg = window.FWGS_CONFIG || {};
  var TKEY = (cfg.cachePrefix || "fwgs:v1:") + "idtoken";

  function nowSec() { return Math.floor(Date.now() / 1000); }

  function decodeJwt(t) {
    try {
      var p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (_) { return null; }
  }
  function saveToken(t) {
    var p = decodeJwt(t) || {};
    try { sessionStorage.setItem(TKEY, JSON.stringify({ t: t, exp: p.exp || 0, email: p.email || "" })); } catch (_) {}
  }
  function readToken() {
    try {
      var raw = sessionStorage.getItem(TKEY); if (!raw) return null;
      var o = JSON.parse(raw); if (!o || !o.t) return null;
      if (o.exp && o.exp < nowSec() + 30) { sessionStorage.removeItem(TKEY); return null; } // expired/about to
      return o.t;
    } catch (_) { return null; }
  }
  function clearToken() { try { sessionStorage.removeItem(TKEY); } catch (_) {} }

  if (!document.getElementById("fwgs-auth-style")) {
    var st = document.createElement("style");
    st.id = "fwgs-auth-style";
    st.textContent = [
      ".fwgs-auth{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;",
      "background:radial-gradient(1200px 500px at 80% -10%,#f7faf8 0,transparent 60%),radial-gradient(900px 500px at -10% 0,#f3f7fb 0,transparent 55%),var(--bg,#eef2f6)}",
      ".fwgs-auth-card{background:var(--panel,#fff);border:1px solid var(--line,#dde5ec);border-radius:18px;",
      "box-shadow:0 1px 2px rgba(20,40,60,.05),0 10px 30px rgba(20,40,60,.07);padding:34px 30px;max-width:420px;width:100%;text-align:center;",
      "font-family:var(--sans,system-ui,-apple-system,'Segoe UI',sans-serif)}",
      ".fwgs-auth-card .kicker{display:inline-flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;",
      "font-size:12px;color:var(--brand-ink,#0f4a3d);background:var(--brand-soft,#e4f1ec);border:1px solid #cfe6dd;padding:6px 12px;border-radius:999px}",
      ".fwgs-auth-card h2{font-family:var(--serif,Georgia,serif);font-weight:600;font-size:26px;margin:16px 0 8px;color:var(--ink,#16202b)}",
      ".fwgs-auth-card p{color:var(--muted,#5a6b7b);font-size:15.5px;line-height:1.5;margin:0 0 18px}",
      ".fwgs-auth-btn{display:flex;justify-content:center;min-height:44px}",
      ".fwgs-auth-note{font-size:13px;color:var(--muted,#5a6b7b);margin-top:18px}",
    ].join("");
    document.head.appendChild(st);
  }

  var overlayEl = null, onAuthCb = null;
  function removeOverlay() { if (overlayEl) { overlayEl.remove(); overlayEl = null; } }

  function loadGis(cb, onErr) {
    if (window.google && google.accounts && google.accounts.id) { cb(); return; }
    var s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = cb;
    s.onerror = function () { onErr && onErr(); };
    document.head.appendChild(s);
  }

  function onCredential(resp) {
    if (!resp || !resp.credential) return;
    saveToken(resp.credential);
    removeOverlay();
    if (onAuthCb) onAuthCb(resp.credential);
  }

  function showGate() {
    var ov = document.createElement("div");
    ov.className = "fwgs-auth";
    ov.innerHTML =
      '<div class="fwgs-auth-card">' +
        '<span class="kicker">Fountainhead School</span>' +
        "<h2>Bus Stop Finder</h2>" +
        "<p>Please sign in with a Google account to view bus routes and stop times.</p>" +
        '<div class="fwgs-auth-btn" id="fwgsGoogleBtn"></div>' +
        '<p class="fwgs-auth-note"></p>' +
      "</div>";
    document.body.appendChild(ov);
    overlayEl = ov;
    var note = ov.querySelector(".fwgs-auth-note");
    if (!cfg.googleClientId) { note.textContent = "Sign-in isn’t configured yet (no Google client ID set)."; return; }
    loadGis(function () {
      try {
        google.accounts.id.initialize({
          client_id: cfg.googleClientId,
          callback: onCredential,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        google.accounts.id.renderButton(ov.querySelector("#fwgsGoogleBtn"), {
          theme: "filled_blue", size: "large", text: "signin_with", shape: "pill",
        });
      } catch (e) { note.textContent = "Sign-in error: " + ((e && e.message) || e); }
    }, function () { note.textContent = "Couldn’t load Google sign-in. Check your connection."; });
  }

  function gate(opts) {
    onAuthCb = (opts && opts.onAuth) || function () {};
    var tok = readToken();
    if (tok) { onAuthCb(tok); return; }   // already signed in this session
    if (document.body) showGate();
    else document.addEventListener("DOMContentLoaded", showGate);
  }

  window.FWGSAuth = {
    gate: gate,
    getToken: readToken,
    clear: clearToken,
    signOut: function () { clearToken(); location.reload(); },
  };
})();
