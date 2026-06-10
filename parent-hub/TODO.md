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
| ✅ Updated **DP calendar** (de-duplicated) | `resources.js` → `dp-academic-calendar` | **Swapped** `driveId` → `13bsdhY7v3J1OTsRQ4ZJhmseCqp9-hA1b` (corrected 2-page→clean PDF, 2026-06-10). ⚠ Verify the new file is shared "Anyone with the link" so the embed renders. |
| ✅ **School timings** data received | new tile in Essentials (`#essentials`) | **8:00 AM – 3:00 PM, Mon–Fri.** Select Saturdays are working (marked in calendar / see key-dates). Closed on public holidays. Build the "School Timings" tile in the batch. |

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
- 🔭 **Getting-started checklist** (Rashida, 2026-06-09) — a numbered "first week" setup block:
  (1) sign in to the school parent email, (2) install Nucleus, (3) join Google Classroom,
  (4) save the school WhatsApp number. Natural home: top of the Communication section or
  Pillar 1; reuses the app links above. Build with this batch.

### 2.2 — "Who to contact" → openable per-programme ladders  *(Pillar 4 redesign)*
**Decided 2026-06-10:** replace the two repeating tables (escalation ladder + full directory) with a
**collapsed, openable "Who to contact"** that expands to **programme/area groups** (PYP EY, PYP 1–3,
PYP 4–5, MYP, DP, CBSE, Sports & PE, Admin). Each group shows its escalation path as **photo cards**
(teacher → TL → Coordinator → HoS) with role + `mailto:`. Single-source: each person appears in the
group(s) they serve — no repeated directory table.
- 📷 Photos **committed** → `parent-hub/assets/images/Leadership Team Photos/` (11 files, name-based).
  ⚠ Filenames `AbhijitDave.jpg`, `AnishLaw.jpg` differ from directory spellings "Abhijit **Dive**",
  "**Anisha** Law" — confirm correct display spelling; map name→file in code.
- ✅ Public exposure confirmed OK (faces + names + emails on the public URL).
- 🔭 **Directors** at the top. Email **directors@fountainheadschools.org**
  ⚠️ domain is **fountainheadschools.org**, *not* `fwgs.in`. ❓ Need Director name(s) + placement.
- ❓ Ladders inferred from Pillar 4's existing table; confirm reporting structure + Directors placement.

---

## 3 · Future separate page — `parent-hub/academics.html`
Academic content (separate build; see `SPEC.md`). Registry slugs already reserved:
`pyp-brochure`, `myp-brochure`, `dp-brochure`. Still needs:
- 3 Google-Site programme-page URLs (PYP / MYP / DP)
- 5 IB policy Drive links (Language · Learning Diversity · Academic Integrity · Admission · Assessment)
- Programme curriculum/info + programme-lead contacts (if not already covered by the Comms directory)

---

## 4 · Code-review follow-ups (`/code-review` pass, 2026-06-09)

> None blocking; the page shipped fine. Line numbers are approximate (as of commit `62682ed`)
> and will drift — the selector/section locators are the durable reference.

**🔲 Decision needed**
- **Staff directory sits on a public URL.** Pillar 4 (`#pillar-contacts`) lists 11 names + emails,
  the WhatsApp number, and the admissions number. GitHub Pages is publicly readable, and
  `noindex` only stops *search indexing* — not direct access. Confirm this public exposure is
  intended, or keep the directory only inside the access-gated Google Site.

**🔭 Polish / fixes (low-risk — can be batched in one pass)**

| Fix | Where | Category |
|---|---|---|
| External WhatsApp links open in the **same tab** — add `target="_blank" rel="noopener noreferrer"` (the `data-resource` links already get this from `resources.js` `wire()`); matters most when embedded in the Google Site iframe | the 3 `wa.me` links (~L693, 716, 791) | Correctness / UX |
| **Optimize photos for web** — hero + 4 section banners are full-res drone/camera JPEGs; resize/compress, and consider `<link rel="preload" as="image">` for the hero background (it's the LCP) | `.hero-bg` (~L62) + `.sec-media img` | Performance |
| **`--ink-faint` (#8A9189) fails WCAG AA** (~2.9:1 on cream) — darken (~#6A716B) or use `--ink-soft` for the footer text and the `.lead` labels | token ~L16; used L184, 213 | Accessibility |
| Add `scope="col"` to the `.tbl` `<th>`s (optional: a visually-hidden `<caption>`) | ladder + directory tables (~L754, 771) | Accessibility |
| Remove the dead empty `.band{ }` rule | ~L87 | Cleanup |
| If old Safari (<12.1) matters, add `xlink:href` alongside `href` on `<use>` — else skip | sprite uses (~L361+) | Compatibility (low) |

*(The review's note on the PTA `href="#"` placeholder is already covered by the "PTA nomination form URL" item in §1.)*

---

## 5 · Team feedback log — 2026-06-09

Raw comments from the review thread + where each is tracked (this is an index, not a second backlog).

**Quick correctness fixes (confirmed — apply in next edit pass):**
- ✅-to-do **Email format mismatch.** Overview card (Pillar 1, ~L614) shows `p.firstname@fwgs.in`;
  detail (~L643) shows `p.firstname.lastname@fwgs.in`. Kiran confirmed: it should be
  **`p.firstname.lastname@fwgs.in`** everywhere. Fix the card.

**Decisions (resolved 2026-06-09):**
- ✅ **Number format** (Zainab) → display **digits only** (`9657662888`, `9274770453`) as one unbroken block. Keep the full international form in the hrefs (`tel:+9196…`, `wa.me/9196…`). Apply in next edit pass.
- ⏳ **Key dates** (Suparna) → parent-facing dates **extracted** from the FWGS Student's Calendar → `parent-hub/key-dates.md` (review/trim; see its open questions). Presentation (static list vs live sheet-backed strip) still pending user comments. (A key-dates table was dropped earlier as "too dynamic" — team now wants it back.)
- ✅ **School timings** (Rashida) → **new tile in Essentials** (see §1). Needs the actual reporting/dispersal times.
- ✅ **School Values / mission** (Suparna) → **keep OUT of this admin hub** — belongs on the academics page or the main school site.

**Routed to existing backlog items:**
- Enrollment steps (Rashida) → §2.1 *Getting-started checklist*.
- DP calendar duplicate page (Honey) → §1 *Updated DP calendar* (pending corrected Drive link).
- "Who to contact" repetition → already §2.2 *organogram* (Leadership photos now received).

**Clarified / no action now:**
- **Transport shows "Fountainhead School Surat"** (Honey) — that text is in the *linked bus finder*
  (`fsk-apps.pages.dev/buses`, the school-dashboards app), **not** `index.html`. Cross-app branding
  fix; track in school-dashboards. Surat **stops are intentional** for now — CSN routes not final;
  Kiran to confirm when finalized (user, 2026-06-09).
- **Timetable** (Honey) — deferred; "add once ready" (user). Already referenced under Pillar 4 *Where each thing lives* (ASC Timetable).
- **"PYP is not clickable"** (Kiran) — in the built page the PYP *calendar* tile is clickable with
  content. ❓ Awaiting clarification whether Kiran meant the not-yet-built PYP *programme page*
  (`academics.html`) or something else.
- **Homework / attendance / celebration policy** (Suparna) — attendance & birthdays(celebration) are
  already among the 8 hidden tiles (await content); *homework* would be a new tile/topic.

---

## ✅ Done
- **Batch build (2026-06-10)** — verified on preview, **pending commit**:
  - Quick fixes: email card → `p.firstname.lastname@fwgs.in`; phone display digits-only (`9657662888` / `9274770453`, `tel:`/`wa.me` hrefs keep `+91`).
  - **School Timings** tile (8–3 Mon–Fri, working Saturdays, holidays).
  - **Getting-started** checklist + app links: `nucleus`, `google-classroom`, `asc-timetable` (registry `url` entries); school-email = Google sign-in.
  - **Who-to-contact** rebuilt as openable per-programme ladders with 21 photo cards (Directors + HoS apex). Tables removed.
  - **Key dates** in Calendars: collapsible months (`<details>`), **weekday shown + Saturdays highlighted**, 2-months-at-a-time reveal, `📅 Sat` tags dropped, legend split.
  - **"Where each thing lives"** → moved to top of Communication as linked **"Where to find what"** router; bottom copy removed.
- **Bus routes** → linked to the live finder (`fsk-apps.pages.dev/buses`) via the `bus-routes` registry entry.
- **Student-email grade boundary** → confirmed **Grade 6 and above** (was TBC, 5-or-6).
- **`index.html` full build** (hero · tiles · calendars · communication · get involved · hidden FAQ) — shipped 2026-06-09, commit `62682ed`.
