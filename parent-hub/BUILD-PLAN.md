# Parent Hub — Build Plan (handoff)

> **Purpose.** This is a self-contained action plan for building `parent-hub/index.html`
> (the admin/logistical parent hub). It is written so a **fresh Claude Code session
> with no prior context** can pick up and build. Read this, then `parent-hub/SPEC.md`
> (canonical structure), then `CLAUDE.md` (repo conventions).
>
> **Status as of handoff:** SPEC locked at v0.3. `index.html` does **not exist yet** —
> this is a greenfield build. The embed pattern is proven in `parent-hub/test-embed.html`.

---

## 0 · How to use this doc

1. Skim **§3 Locked decisions** so you don't re-open settled questions.
2. Confirm the **§2 Open decisions** with the user before writing code (only 1–2 left).
3. Build **§5 section-by-section**, one git commit per section, previewing on
   `http://localhost:4322/index.html` between each. Pause for the user to eyeball.
4. Use **§6 content** as the source of truth for what goes in each section.
5. Honor **§7 gotchas** and **§8 verification** throughout.

---

## 1 · Current repo state (snapshot)

```
parent-hub/
  SPEC.md                 ← canonical structure spec (v0.3) — READ FIRST
  BUILD-PLAN.md           ← this file
  test-embed.html         ← proven embed sandbox; copy its patterns, don't ship it
  tools/serve.mjs         ← static server, port 4322
  assets/
    resources.js          ← slug→Drive registry (10 entries) + auto-wire helpers
    config.js, live-data.js  ← copies from school-dashboards; UNUSED here (live-data only)
    brand/FWGS - SVG Logo.svg
    images/               ← 12 photos. Hero uses DJI_20260305154203_0152_D.jpg (drone aerial)
```

- Preview: `node parent-hub/tools/serve.mjs` → http://localhost:4322 (or `preview_start "parent-hub"`).
- Live URL once pushed: `https://vardan-kabra.github.io/fwgs-curricle/parent-hub/index.html`
  (GitHub Pages, `main` branch root, rebuilds ~1 min after push).
- **`index.html` becomes the default** — live URL `…/parent-hub/` will serve it.

### Registry slugs already present (`assets/resources.js`)

| Slug | Used by this hub? |
|---|---|
| `uniform-policy` | ✅ Uniform tile |
| `where-to-buy-uniform` | ✅ Uniform tile |
| `food-policy` | ✅ Food tile |
| `bus-rules` | ✅ Transport tile |
| `pyp-academic-calendar` | ✅ Academic Calendars |
| `myp-academic-calendar` | ✅ Academic Calendars |
| `dp-academic-calendar` | ✅ Academic Calendars |
| `pyp-brochure` | ❌ reserved for future `academics.html` |
| `myp-brochure` | ❌ reserved for future `academics.html` |
| `dp-brochure` | ❌ reserved for future `academics.html` |

**Embed pattern** (from `test-embed.html`, copy verbatim):
```html
<a   data-resource="food-policy">Food Policy</a>                 <!-- auto-sets href -->
<iframe data-resource="food-policy" data-mode="embed"            <!-- auto-sets src  -->
        loading="lazy" title="Food Policy PDF"></iframe>
<script src="assets/resources.js"></script>                      <!-- wires on DOMContentLoaded -->
```

---

## 2 · Open decisions — confirm with user BEFORE building

1. **Design system.** Recommendation: **carry forward** the original sample's editorial
   look (Fraunces display + Manrope body, cream/deep-green palette — tokens in §4). It's
   polished, on-brand-adjacent, mobile-tested. *Awaiting explicit confirm.* If the user
   wants fresh, get direction first.
2. **Logo in hero.** The brand SVG (`assets/brand/FWGS - SVG Logo.svg`) reads
   "fountainhead WOCKHARDT GLOBAL SCHOOL". Decide: logo in the top nav, in the hero, or both.

Everything else is locked — see §3.

---

## 3 · Locked decisions (do NOT re-litigate)

- **Scope:** this page is **admin/logistical only**. Academic content (IB policies,
  brochures, programme curriculum/leads, Google-Site programme pages) goes on a **future
  separate page** `parent-hub/academics.html`. **Exception: Academic Calendars STAY here**
  (they're logistical — dates/vacations/PTI).
- **School name:** **Fountainhead Wockhardt Global School** (confirmed spelling).
- **Single source of truth:** each topic has exactly one home; cross-refs are anchor
  links, never duplicated content.
- **Build-now-hide-now:** ship pending sections/tiles in the HTML wrapped in
  `data-status="pending"` + global CSS `[data-status="pending"]{display:none}`. Enable
  later by deleting the attribute. No restructuring needed.
- **Mobile (≤768px):** hide inline PDF iframe embeds (too tall); keep summaries + link-outs.
  (Pattern from `test-embed.html`: wrap embeds, `@media(max-width:768px){#id{display:none}}`.)
- **Hero:** drone aerial background, no quick-link cards (tile grid sits right below).
- **Dropped from the original sample:** Year-ahead/key-dates table; "New for AY26-27"
  strip; the 11-card "your child's day" omnibus (→ split into tiles); original Learning
  section (→ academics page); general Policies list; "Events through the year" (→ covered
  by Academic Calendars); standalone WhatsApp strip + inbox advisory (→ folded into
  Communication Pillar 2); FAQ (→ built hidden).
- **CBSE:** the school has a CBSE stream. Do **not** call it out as a separate stream in
  hero/welcome. **Do** retain it in staff designations and as one escalation-ladder row
  (CBSE parents need a contact path).
- **Add** `<meta name="robots" content="noindex,nofollow">` (Google Sites is the real
  entry point; this URL shouldn't rank).

---

## 4 · Design system tokens (if carrying the sample forward)

```css
:root{
  --bg:#FAF7F0; --bg-card:#FFFFFF; --bg-soft:#F1ECDF; --bg-warm:#F4E9D8;
  --ink:#14201B; --ink-soft:#4F5C56; --ink-faint:#8A9189; --rule:#E2DCC9;
  --accent:#1A4D3E; --accent-soft:#DEEAE3;     /* deep green */
  --warn:#B8341B; --warn-soft:#F4DDD5;          /* the "enter your age" alert */
  --info:#2D6A8E; --info-soft:#DAE7EE;          /* Must Know/Good to Know callouts */
  --gold:#A07A2C; --gold-soft:#EFE3C5;          /* "pending/TBC" tags */
  --display:"Fraunces",Georgia,serif;
  --body:"Manrope",-apple-system,sans-serif;
  --mono:"JetBrains Mono","Courier New",monospace;
}
```
Fonts via Google Fonts: `Fraunces` (opsz 9..144, wght 400–700), `Manrope` (400–800),
`JetBrains Mono` (500–600). Full reference markup lives in the sample file
`FWGS Parent Information Packet Sample (1) (1).html` (user's Downloads, not in repo).

---

## 5 · Build sequence (one commit per section)

| # | Section | Commit message prefix | Notes |
|---|---|---|---|
| 1 | Page shell + hero + top nav | `parent-hub: hero + shell` | Establishes design system; nav anchors to all sections |
| 2 | Topic tiles (accordion) | `parent-hub: topic tiles` | Uniform / Food / Transport active; 8 hidden tiles |
| 3 | Academic Calendars | `parent-hub: academic calendars` | 3 inline embeds + mobile fallback |
| 4 | Communication System | `parent-hub: communication` | The big one — 4 pillars; see §6 |
| 5 | Get Involved | `parent-hub: get involved` | PTA + Feedback |
| 6 | FAQ (hidden) | `parent-hub: faq scaffold` | `data-status="pending"` |

After §6: full-page mobile pass, then a final `parent-hub: polish` commit. Do **not**
delete `test-embed.html` until the user confirms `index.html` fully replaces it.

---

## 6 · Section content

### §1 Hero
- Eyebrow: `AY 2026–27 · Parent Hub`
- Headline + short warm welcome line addressing **all** FWGS parents (no IB-vs-CBSE split).
- Background: `assets/images/DJI_20260305154203_0152_D.jpg`.
- Top nav with anchor links to each section.

### §2 Topic tiles — accordion grid
Each tile: title + 1–2 line summary always visible; tap to expand → PDFs/content reveal
below the summary, same tile; multiple tiles open at once.

**Active tiles** (write a 1–2 line summary above each embed; pull a line or two from the PDF):
- **Uniform** `#uniform` → embeds `uniform-policy` + `where-to-buy-uniform`.
- **Food** `#food` → embeds `food-policy`. (Veg only from kitchen; lunchbox: no junk/packed/processed.)
- **Transport** `#transport` → embeds `bus-rules`. (Routes PDF pending — leave a `data-status="pending"` slot.)

**Hidden tiles** (`data-status="pending"`, same grid, no content yet): I-Card & Bearer Card ·
Stationery · Attendance & leave · School visits · Birthdays · Personal belongings ·
Safety & wellbeing · Lost and found.

### §3 Academic Calendars
One block per programme, each: small heading + inline embed. Mobile: hide embeds, keep
link-outs. Slugs: `pyp-academic-calendar`, `myp-academic-calendar`, `dp-academic-calendar`.
(No brochures/programme-page links here — those are on the academics page.)

### §4 Communication System  ← richest section
**Layout:** 4 brief overview cards on top (1 per pillar, one-line summary), each card is an
**anchor link** that jumps to its detailed pillar section below (no popup modals). The 4
detailed sections are the canonical reference.

**Technical requirements (MUST):**
- All emails → `mailto:` links. All phone numbers → `tel:` links.
- WhatsApp → `https://wa.me/919657662888`.
- **No browser-storage APIs** on this page.

**⚠ DO NOT RENDER** (internal/operational — keep OUT of the HTML): `info@fwgs.in` must
appear to parents as a plain clean address **only**. There is an internal note about how
that mailbox is handled/routed behind the scenes — it must **not** appear anywhere in the
page, and is deliberately omitted from this doc too. If you need the detail, ask the user;
do not infer or invent it.

**Pillar 1 — Your school email ID**
- Parent address format: `p.firstname.lastname@fwgs.in` (`p.`=parent · `firstname.lastname`=child's name · `fwgs.in`=domain).
- Students **Grade 5 onwards** also get a school email with an `s.` prefix instead of `p.`
  *(grade boundary 5-or-6 — PENDING confirm; mark as TBC).*
- **Prominent warning** (most consequential item on the page): heading *"Enter your own
  age, not your child's."* Body: when Google asks your age at first login, enter **your**
  age — Google auto-deactivates under-13 accounts and reactivation takes 45 days.

**Pillar 2 — How we reach you (outbound)** — two parallel hubs:
- **Google Classroom** (academic): guardian summaries — academic updates & unit overviews,
  homework/assignments, period & daily highlights, materials/resources/curriculum.
- **Nucleus** (admin app, iOS/Android/web): newsletters/PTC & term-end reports;
  events/field trips/opportunities; fees/transport/attendance; LC applications/grievances/forms.
- **Two flags in Nucleus' Bulletin:** **Must Know** = critical/time-sensitive/compulsory;
  **Good to Know** = optional/informational.
- **Official WhatsApp broadcast** (whole-school + grade-wise, school-owned) for short
  nudges linking back here or to Nucleus. Note: parent-created WhatsApp groups are **not**
  official channels.
- **Inbox advisory:** Primary inbox = Must Know + 1:1 teacher/leader emails; Promotions =
  Good to Know; Classroom category = academic notifications; treat personal 1:1 as priority
  (reply within a working day).

**Pillar 3 — How you reach us (inbound)** — two streams, each an ordered preference list:
- **Stream A — Admin** (transport, food, I-Card, uniform, fees logistics):
  1. **Primary:** email `info@fwgs.in` (actively encouraged).
  2. **Second:** WhatsApp `9657662888` — text preferred; **voice notes won't be addressed**.
  3. **Last resort:** phone `9657662888` — not for routine queries; emergencies only.
  - Escalate: email **Kiran Kante** (Admin Operations Manager) or **Abhijit Dive** (Head of Admin).
  - Structured requests (LC, grievances, fees) → Nucleus forms as modules come online.
- **Stream B — Academic** (learning, child's progress, classroom):
  1. **Primary:** email your child's teacher directly (`firstname.lastname@fwgs.in`; also
     reachable via Google Classroom).
  2. **Escalation:** Team Leader → Coordinator → Head of School (directory below).
  3. **Confidential:** write directly to the TL, Coordinator, or HoS.

**Pillar 4 — Who to contact (directory & escalation)**

Academic escalation ladders (teacher-first, then climb):

| Programme / Area | Ladder |
|---|---|
| PYP · Early Years & Single Subjects | Anjali Bindra (TL) → Hetal Ahivasi (Coord.) → Pradeep Sharma (HoS) |
| PYP · Grade 1–3 | Anisha Law (TL) → Hetal Ahivasi (Coord.) → Pradeep Sharma (HoS) |
| PYP · Grade 4–5 | Zarina Khan (TL) → Hetal Ahivasi (Coord.) → Pradeep Sharma (HoS) |
| MYP | Vichitra Parmal (Coord.) → Pradeep Sharma (HoS) |
| DP | Bhavana Goraksha (Coord.) → Pradeep Sharma (HoS) |
| CBSE | Farhat Khan (Coord.) → Abhijit Dive (CBSE Principal) → Pradeep Sharma (HoS) |
| Sports & PE (whole school) | Shailendra Law (TL) → Pradeep Sharma (HoS) |

Admin escalation: Kiran Kante (Admin Operations Manager); Abhijit Dive (Head of Admin).

Full directory (all emails `mailto:`):

| Name | Role | Email |
|---|---|---|
| Pradeep Sharma | Head of School | pradeep.sharma@fwgs.in |
| Abhijit Dive | Head of Admin & CBSE Principal | abhijit.dive@fwgs.in |
| Kiran Kante | Admin Operations Manager | kiran.kante@fwgs.in |
| Hetal Ahivasi | PYP Coordinator | hetal.ahivasi@fwgs.in |
| Anjali Bindra | TL — Early Years & Single Subjects (PYP) | anjali.bindra@fwgs.in |
| Anisha Law | PYP TL — Grade 1–3 | anisha.law@fwgs.in |
| Zarina Khan | PYP TL — Grade 4–5 | zarina.khan@fwgs.in |
| Vichitra Parmal | MYP Coordinator | vichitra.parmal@fwgs.in |
| Bhavana Goraksha | DP Coordinator | bhavana.goraksha@fwgs.in |
| Farhat Khan | CBSE & IB Processes Coordinator | farhat.khan@fwgs.in |
| Shailendra Law | Whole School Sports & PE TL | shailendra.law@fwgs.in |

Quick reference: Admin → `info@fwgs.in` · WhatsApp/calls → `9657662888` (text preferred ·
no voice notes · calls = emergencies only) · Admissions & Inquiries → `9274770453`.
Admissions referral note: *"Know someone interested in FWGS? Share our Admissions &
Inquiries number — 9274770453 — with friends and family."*
Where each thing lives: Homework/materials → Google Classroom · Announcements/fees/forms →
Nucleus · Daily timetable → ASC Timetable · 1:1 with a teacher → school email · Admin → info@fwgs.in.

### §5 Get Involved
- **PTA** — Parent Teacher Association; nomination form link when available (`data-status="pending"`).
- **Feedback** — formal (PTI, surveys, grievances) + informal (email, comment to teacher).

### §6 FAQ — hidden scaffold
Build the structure wrapped in `data-status="pending"`; enable when real questions curated.

---

## 7 · Pending data (user will supply)

| Item | Blocks | Interim |
|---|---|---|
| Routes info for Transport tile | Transport tile completeness | `data-status="pending"` slot |
| Student-email grade boundary (5 or 6) | Pillar 1 exact wording | render as "Grade 5 onwards *(TBC)*" |
| "Last updated" footer date | Footer | placeholder |
| Design-system confirm | Section 1 start | recommend carry-forward (§4) |
| Data for 8 hidden day-item tiles | enabling those tiles | stay hidden |
| FAQ questions | enabling FAQ | stay hidden |
| **For future `academics.html`:** 3 Google-Site programme URLs; 5 IB policy Drive links | the academics page (separate build) | n/a here |

---

## 8 · Gotchas & conventions

- **Drive embeds need "Anyone with the link can view"** sharing, else the iframe shows a
  Drive sign-in wall. The 7 hub PDFs were verified shareable during the embed test.
- **`resources.js` auto-wires on `DOMContentLoaded`** — put `<script src="assets/resources.js">`
  at the end of `<body>`. `data-resource` sets href (links) or src (iframes w/ `data-mode="embed"`).
- **Filenames with spaces are fine** in HTML (browser URL-encodes). Don't rename assets.
- **Auto-commit hook is active:** commits tagged `auto: session end` can push to the public
  repo without an explicit gate. Survey `git status` each turn; never `git add -A` blindly
  (the photos folder is ~120 MB). Stage explicit paths.
- **Pause for explicit user confirmation before every `git commit`/`git push`.**
- **Apps Script `/exec` URL is public-by-design** if you see one in school-dashboards/config.js — not a leak.
- **LF→CRLF warnings on Windows commits are expected/harmless.**

---

## 9 · Verification workflow (per section)

1. `preview_start "parent-hub"` (port 4322), navigate to `/index.html`.
2. **Screenshot tool may time out** on this preview (seen during the embed test — pages
   with Drive iframes hang the renderer). Fall back to `preview_eval` DOM inspection:
   check `readyState`, that `data-resource` href/src are populated, images `complete`,
   `getComputedStyle().display` for hidden vs shown, and the 768px mobile rule via
   `preview_resize` → `mobile`.
3. Cross-origin Drive PDFs are invisible to tooling — ask the user to eyeball that embeds
   actually render.
4. Commit the section, push, let the user verify on the live URL / inside Google Sites.

---

## 10 · Definition of done (v1)

- [ ] Hero, tiles (3 active + 8 hidden), Academic Calendars, Communication (4 pillars),
      Get Involved, FAQ (hidden) all present.
- [ ] Single-source-of-truth respected — no duplicated topic content; cross-refs are anchors.
- [ ] All emails `mailto:`, phones `tel:`, WhatsApp `wa.me/919657662888`; no storage APIs.
- [ ] Internal `info@fwgs.in` routing note is NOT in the HTML.
- [ ] Mobile pass: inline embeds hidden ≤768px, link-outs remain, single column reflow.
- [ ] `robots noindex,nofollow` present.
- [ ] Verified on live GitHub Pages URL and embedded in the Google Site.
```
