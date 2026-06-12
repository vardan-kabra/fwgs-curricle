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
 */
window.FWGS_RESOURCES = {
  "uniform-policy": {
    title: "Uniform Policy",
    type: "drive-pdf",
    driveId: "1T0QXx8AVNS7bZ5pgNxMPhFLHHGdV8iQA"
  },

  "where-to-buy-uniform": {
    title: "Where to Buy the Uniform",
    type: "drive-pdf",
    driveId: "12Ttx0zMTL0Isiq9KqqAjgElFPr1pSjyt"
  },

  "food-policy": {
    title: "Food Policy",
    type: "drive-pdf",
    driveId: "1RUeblWu1XnSOso-I19xZMS2Hzt4UXRRn"
  },

  "bus-rules": {
    title: "Bus Rules",
    type: "drive-pdf",
    driveId: "1KZDKqsfwTwuKzsJWiN-IIbP5yvtoFm_a"
  },

  "bus-routes": {
    title: "Bus Routes & Stops",
    type: "url",
    url: "https://docs.google.com/spreadsheets/d/1hDdP67GUblLHpb9hHMH9i8vqFd6ZuNUhTJd4G2WZtpw/edit?gid=683768151#gid=683768151"
  },

  "pyp-academic-calendar": {
    title: "PYP Academic Calendar",
    type: "drive-pdf",
    driveId: "1w3BNKq-Mb5tzy3GCwb43irk01LdW68ON"
  },

  "myp-academic-calendar": {
    title: "MYP Academic Calendar",
    type: "drive-pdf",
    driveId: "1B1AdgbR9EIfSU6ECsvwvHVcEEZDJkDCy"
  },

  "dp-academic-calendar": {
    title: "DP Academic Calendar",
    type: "drive-pdf",
    driveId: "13bsdhY7v3J1OTsRQ4ZJhmseCqp9-hA1b"
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

  function url(key) {
    var r = R[key];
    if (!r) return null;
    if (r.type === "drive-pdf" || r.type === "drive-image") {
      return "https://drive.google.com/file/d/" + r.driveId + "/view";
    }
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
