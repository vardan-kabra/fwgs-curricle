/* FWGS Curricle — resource registry.
 *
 * Central map of every external/Drive-hosted resource the site links to
 * (policy PDFs, posters, infographics, third-party URLs). One place to edit
 * when a link changes — every page reads from the same source.
 *
 * Each entry is keyed by a stable slug. Pages reference the slug, not the
 * URL, so swapping a Drive file or changing platforms is a one-line edit.
 *
 * Why store driveId (not the full URL): Drive URL schemes have changed
 * before. Centralising URL-building (see helpers below) keeps pages stable
 * if Google ever changes the format again — only this file updates.
 *
 * Entry shape:
 *   "slug": { title: "...", type: "drive-pdf",   driveId: "ABC..." }
 *   "slug": { title: "...", type: "drive-image", driveId: "ABC..." }
 *   "slug": { title: "...", type: "url",         url: "https://..." }
 *   "slug": { title: "...", type: "gcal",        calendarId: "...@group.calendar.google.com" }
 */
window.FWGS_RESOURCES = {
  "uniform-policy": {
    title: "Uniform Policy",
    type: "drive-pdf",
    driveId: "133ZbMLSer8cU9Ax3SStnfDO5zjFhAu1y"
  },

  "where-to-buy-uniform": {
    title: "Where to Buy the Uniform",
    type: "drive-pdf",
    driveId: "12Ttx0zMTL0Isiq9KqqAjgElFPr1pSjyt"
  },

  "food-policy": {
    title: "Food Policy",
    type: "drive-pdf",
    driveId: "14bDtpD3DpWAGG0m7LNM0N9nDo7EUEtlD"
  },

  // Monthly food menu. To update each month: swap driveId below and change the
  // visible month label in the Food tile (index.html). Source: "Menu of the Month"
  // Drive folder (owner khushbu.thakur@fountainheadschools.org).
  // Shared to the fountainheadschools.org Workspace org, which spans all its
  // domain aliases (fwgs.in, fsksurat.in, ...) — so parent fwgs.in logins can
  // view it; no "Anyone with the link" change is needed.
  "food-menu": {
    title: "Menu of the Month — September 2026",
    type: "drive-pdf",
    driveId: "1_IyWGQwi5LMRWy9p8o2PS7NnA6oTng78"
  },

  "bus-rules": {
    title: "Bus Rules",
    type: "drive-pdf",
    driveId: "1KDdNxMA9USVvFMBMd9sTRDDc8QlYIhXj"
  },

  "bus-routes": {
    title: "Bus Routes & Stops",
    type: "url",
    url: "https://docs.google.com/spreadsheets/d/1hDdP67GUblLHpb9hHMH9i8vqFd6ZuNUhTJd4G2WZtpw/edit?gid=683768151#gid=683768151"
  },

  // Live school calendar (Google Calendar). Replaced the PYP / MYP / DP PDF calendars
  // on 24-Sep-2026 — they had gone out of date. Dates are edited in the calendar
  // itself, never here. The calendar is NOT public: a parent sees events only if it
  // is shared with their school account.
  "school-calendar": {
    title: "FWGS Student's Calendar",
    type: "gcal",
    calendarId: "c_820b78760e344b6102add1e9cd7651cd07acec2c8263f6bd077bfc97df450b91@group.calendar.google.com"
  },

  "pyp-brochure": {
    title: "PYP Brochure",
    type: "drive-pdf",
    driveId: "1l9PXBjKaSUWXbGu0HQ0qYwWKM7yKqbbt"
  },

  "myp-brochure": {
    title: "MYP Brochure",
    type: "drive-pdf",
    driveId: "1f7jJxmuO2MKkWlZQ0uL-76cqWbRQ578I"
  },

  "dp-brochure": {
    title: "DP Brochure",
    type: "drive-pdf",
    driveId: "1g5pytFKguLR--i-tk3oQhbFZ58HQFnVl"
  },

  // — communication apps (Pillar 2 / getting-started checklist) —
  "nucleus": {
    title: "Nucleus — Parent Login",
    type: "url",
    url: "https://fwgsparents.nucleusedu.in/login"
  },

  "google-classroom": {
    title: "Google Classroom",
    type: "url",
    url: "https://classroom.google.com/"
  },

  "asc-timetable": {
    title: "ASC Timetable",
    type: "url",
    url: "https://fwgs.edupage.org/timetable/"
  },

  // "My Bus" Apps Script web app (parent-specific bus/route).
  // ← paste the deployed /exec URL here (see parent-hub/apps-script/README.md),
  //   then remove data-status="pending" on the button in index.html.
  "my-bus": {
    title: "My Bus",
    type: "url",
    url: "https://script.google.com/a/macros/fountainheadschools.org/s/AKfycbw9zppWb-t6mgudkFBflbtAFLzmgvbjkpRItSdzO7b4pXaal02ZBbf5tzuPuzEMM5Jt/exec"
  },

  // — more entries added as links are shared —
};

/* Helpers — resolve a slug to a usable URL.
 *
 * Manual use from your own script:
 *   FWGSResources.url("uniform-policy")    → view link (opens Drive viewer)
 *   FWGSResources.embed("uniform-policy")  → embeddable preview URL (iframes)
 *   FWGSResources.title("uniform-policy")  → display title
 *
 * Auto-wire (runs on DOMContentLoaded — no script needed in your HTML):
 *   <a   data-resource="uniform-policy">View policy</a>
 *      → href set to the view URL, opens in new tab
 *   <iframe data-resource="uniform-policy" data-mode="embed"></iframe>
 *      → src set to the embed URL (inline PDF preview)
 *   <img data-resource="some-poster" data-mode="embed">
 *      → src set to the direct image URL
 */
(function () {
  "use strict";
  var R = window.FWGS_RESOURCES || {};

  // Google Calendar embed URL. Month grid on wide screens, agenda list on phones
  // (a month grid is unreadable at 375px).
  function gcal(r, mode) {
    return "https://calendar.google.com/calendar/embed?src=" + encodeURIComponent(r.calendarId) +
      "&ctz=Asia%2FKolkata&wkst=2&showTitle=0&showPrint=0&showCalendars=0&showTz=0&mode=" + mode;
  }
  function narrow() {
    return !!(window.matchMedia && window.matchMedia("(max-width:768px)").matches);
  }

  function url(key) {
    var r = R[key];
    if (!r) return null;
    if (r.type === "drive-pdf" || r.type === "drive-image") {
      return "https://drive.google.com/file/d/" + r.driveId + "/view";
    }
    if (r.type === "gcal") return gcal(r, "AGENDA");
    if (r.type === "url") return r.url;
    return null;
  }

  function embed(key) {
    var r = R[key];
    if (!r) return null;
    if (r.type === "drive-pdf") {
      return "https://drive.google.com/file/d/" + r.driveId + "/preview";
    }
    if (r.type === "drive-image") {
      return "https://drive.google.com/uc?export=view&id=" + r.driveId;
    }
    if (r.type === "gcal") return gcal(r, narrow() ? "AGENDA" : "MONTH");
    if (r.type === "url") return r.url;
    return null;
  }

  function title(key) {
    var r = R[key];
    return r ? r.title : null;
  }

  function wire(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-resource]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute("data-resource");
      var mode = el.getAttribute("data-mode") || "view";
      var resolved = mode === "embed" ? embed(key) : url(key);
      if (!resolved) continue;
      if (el.tagName === "A") {
        el.href = resolved;
        if (!el.target) el.target = "_blank";
        if (!el.rel) el.rel = "noopener";
      } else if (el.tagName === "IFRAME" || el.tagName === "IMG") {
        el.src = resolved;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { wire(); });
  } else {
    wire();
  }

  window.FWGSResources = { url: url, embed: embed, title: title, wire: wire };
})();
