# Parent Hub — Spec (v0.3)

> Working spec for `parent-hub/index.html`. `[NEEDED]` = data the user will supply; `[hidden]` = built into HTML now but hidden until data lands.

## Scope: admin / logistical only

This hub covers the **admin/logistical** content parents need — uniform, food, transport, **academic calendars** (logistical: dates, vacations, PTI), communication, contacts. **Academic content** (IB policies, programme brochures, curriculum, programme leads) lives on a separate page at `parent-hub/academics.html` (future build).

## Design principles

- **Single source of truth.** Each topic has exactly one home section. Cross-references are anchor links — never duplicated content.
- **Build-now-hide-now.** Sections/tiles tagged `[hidden]` are in the HTML but hidden via `data-status="pending"` + CSS `display: none`. Enable later by removing the attribute — no structural change.

## Sections (top → bottom, single scrollable page)

### 0 · Hero / Welcome
- School name: **Fountainhead Wockhardt Global School** (confirmed)
- Eyebrow: "AY 2026–27 · Parent Hub"
- Welcome line (short, warm) — addresses all FWGS parents (does **not** call out IB vs CBSE as separate streams)
- Background: drone aerial (`assets/images/DJI_20260305154203_0152_D.jpg`)
- No quick-link cards (topic tile grid is right below)

### 1 · Topic tiles (accordion grid)

**Behaviour:** title + 1-2 line summary always visible. Tap to expand → PDFs/content reveal below summary, same tile. Multiple tiles can be open at once. On mobile (≤768px) inline PDFs hide; summary + link-out remain.

**Active tiles:**

| Tile | Anchor | Inline embeds |
|---|---|---|
| **Uniform** | `#uniform` | `uniform-policy` + `where-to-buy-uniform` |
| **Food** | `#food` | `food-policy` |
| **Bus / Transport** | `#transport` | `bus-rules` (routes [NEEDED later]) |

**Hidden tiles** (same grid, `data-status="pending"`, enable when data arrives):
- I-Card & Bearer Card
- Stationery
- Attendance & leave
- School visits
- Birthdays
- Personal belongings
- Safety & wellbeing
- Lost and found

### 2 · Academic Calendars

Three programme calendars, embedded inline (~3-5 MB each). Mobile fallback: hide embeds, keep link-outs.

| Programme | Slug |
|---|---|
| PYP | `pyp-academic-calendar` |
| MYP | `myp-academic-calendar` |
| DP | `dp-academic-calendar` |

(Brochures + programme-page links live on the future academics page, not here.)

### 3 · Communication System

**Source:** the user's separate Build Spec doc ("FWGS Parent Communication System - Build Spec.md") — canonical for content. Content goes straight into the rendered HTML; this section captures structure only.

**Layout:**
- 4 brief overview cards on top (one per pillar, 1-line summary each)
- Card click → anchor jump to the matching pillar section below
- 4 detailed pillar sections below as the canonical reference
- **No popup modals** (anchor jump preferred — simpler, accessible, JS-optional)

**4 pillars** (in order):
1. **Your school email ID** — parent address format `p.firstname.lastname@fwgs.in`. **Prominently display** the "enter YOUR age, not your child's" warning — the single most consequential item on this page.
2. **How we reach you (outbound)** — Google Classroom + Nucleus + Must Know / Good to Know flags + Official WhatsApp broadcast + inbox-management advisory.
3. **How you reach us (inbound)** — two streams:
   - **Admin** (transport/food/I-Card/uniform/fees logistics): email `info@fwgs.in` > WhatsApp text `9657662888` > phone `9657662888` (emergencies only)
   - **Academic** (learning, classroom matters): teacher email > escalation ladder
4. **Who to contact (directory & escalation)** — academic escalation ladders (PYP×3, MYP, DP, **CBSE**, Sports & PE) + admin escalation contacts (Kiran Kante, Abhijit Dive) + full staff directory with `mailto:` emails + quick-reference numbers + admissions referral note + "where each thing lives" cheat sheet.

**Technical requirements (from Build Spec):**
- All emails: `mailto:` clickable
- All phone numbers: `tel:` clickable
- WhatsApp link: `https://wa.me/919657662888`
- No browser storage APIs

**⚠ DO NOT RENDER:** the internal note about `info@fwgs.in` being a Google Group routed to internal owners. Parents see only the clean address. (This note is operational; not user-facing.)

**CBSE handling:**
- **NOT mentioned in hero/welcome** as a separate stream
- **Retained in staff designations** (e.g., "Head of Admin & CBSE Principal" for Abhijit Dive)
- **Retained in escalation ladder** as one row (Farhat Khan → Abhijit Dive → Pradeep Sharma) — CBSE parents need a contact path

### 4 · Get Involved

- **PTA** — Parent Teacher Association, nomination form when available
- **Feedback** — formal (PTI, surveys, grievances) + informal (email, teacher comment)

### 5 · FAQ `[hidden]`

Built into structure, hidden via `data-status="pending"`. Enable later when real parent questions are curated.

## Registry (`assets/resources.js`) — 10 entries

**Used by this hub (7):**
- `uniform-policy`, `where-to-buy-uniform`, `food-policy`, `bus-rules`
- `pyp-academic-calendar`, `myp-academic-calendar`, `dp-academic-calendar`

**Reserved for `parent-hub/academics.html` (3):**
- `pyp-brochure`, `myp-brochure`, `dp-brochure`

## Dropped from original sample

- Year ahead / Key dates table — may return as a Sheet-backed live strip (separate workstream)
- "New for AY 2026-27" strip — features live in their own sections now
- "Your child's day" 11-card omnibus → 3 active tiles + 8 hidden
- Original Learning section (PYP curriculum, programme leads, kickoff week) → moves to academics page
- General Policies list — topic policies in tiles; IB policies on academics page
- Events Through the Year — covered by Academic Calendars
- WhatsApp strip + Inbox advisory — absorbed into Communication Pillar 2
- Hero quick-link cards — dropped (tile grid is right below)
- Who to Contact tile — subsumed into Communication Pillar 4

## Data still pending

For this hub:
- Routes information for Bus tile (separate from Bus Rules)
- Eventually: data for 8 hidden day-item tiles; FAQ entries

For the future academics page:
- 3 Google Site URLs (PYP / MYP / DP programme pages)
- 5 IB policy Drive links (Language / Learning Diversity / Academic Integrity / Admission / Assessment)
- Programme leads contact info (if not covered by Comms directory)
