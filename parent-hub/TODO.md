# Parent Hub — To-Be-Built / Backlog

> Live backlog for `parent-hub/` (primarily `index.html`). This is the **single source of
> truth** for what's still pending and what's planned. Canonical *structure* lives in
> `parent-hub/SPEC.md`; the original build handoff is `parent-hub/BUILD-PLAN.md`.
>
> **Working agreement:** the enhancements in §2 are **not built piecemeal**. Collect team
> feedback first, then build them together in one pass.
>
> _Last updated: 2026-06-09_

## Legend
- ⏳ **Pending data** — UI is already built and hidden; just needs content, then remove `data-status="pending"`.
- 🔭 **Planned** — needs design/build; deferred until team feedback is in.
- ✅ **Done**

---

## 1 · Pending data (scaffolded & hidden — enable when data lands)

| Item | Where | Action when ready |
|---|---|---|
| ⏳ PTA nomination form URL | Get Involved (`#involved`) — hidden placeholder link | Add URL (ideally a `resources.js` `url` entry) + remove `data-status="pending"` on the link |
| ⏳ 8 topic tiles | Essentials (`#essentials`) — hidden `<details>` tiles | Add body content + a fitting icon (currently generic `#ic-tag`), remove `data-status` |
| ⏳ FAQ questions | FAQ band (`#faq`) — hidden, example scaffold | Replace the example Q&As with real ones, remove `data-status` on the `#faq` band |
| ⏳ "Last updated" footer date | Footer | Update the placeholder ("June 2026") |

**The 8 hidden tiles:** I-Card & Bearer Card · Stationery · Attendance & Leave · School Visits · Birthdays · Personal Belongings · Safety & Wellbeing · Lost & Found.

---

## 2 · Planned enhancements (build together, after team feedback)

### 2.1 — Link the communication apps & email  *(relatively easy)*
Add `resources.js` `url`-type entries, then surface as buttons/links in the relevant pillars:
- 🔭 **Google Classroom** — connect and link out (Pillar 2 · How we reach you).
- 🔭 **Nucleus** — link to the app / web login (Pillar 2).
- 🔭 **School email** — a "Sign in to your school email" link in **Pillar 1**. Rationale: parents
  already access the site using their school email ID, so a direct Google/Gmail login link is
  simple and useful. *(Confirm the exact target URL.)*

### 2.2 — "Who to contact" → organogram  *(Pillar 4 redesign)*
- 🔭 Replace / augment the current **escalation-ladder table + full directory table** with an
  **organogram (org chart)** — the two tables currently repeat the same people, and a chart
  removes that repetition while showing reporting lines at a glance.
- 🔭 Add **Directors** at the top of the chart.
  Director email: **directors@fountainheadschools.org**
  ⚠️ Domain is **fountainheadschools.org**, *not* `fwgs.in` like the rest of the staff — keep it as written.

---

## 3 · Future separate page — `parent-hub/academics.html`
Academic content (separate build; see `SPEC.md`). Registry slugs already reserved:
`pyp-brochure`, `myp-brochure`, `dp-brochure`. Still needs:
- 3 Google-Site programme-page URLs (PYP / MYP / DP)
- 5 IB policy Drive links (Language · Learning Diversity · Academic Integrity · Admission · Assessment)
- Programme curriculum/info + programme-lead contacts (if not already covered by the Comms directory)

---

## ✅ Done
- **Bus routes** → linked to the live finder (`fsk-apps.pages.dev/buses`) via the `bus-routes` registry entry.
- **Student-email grade boundary** → confirmed **Grade 6 and above** (was TBC, 5-or-6).
- **`index.html` full build** (hero · tiles · calendars · communication · get involved · hidden FAQ) — shipped 2026-06-09, commit `62682ed`.
