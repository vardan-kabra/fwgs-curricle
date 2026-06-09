# Parent Hub — Spec (Draft v0.1)

> Working spec for `parent-hub/index.html`. Iterate here BEFORE building. Items
> tagged `[?]` need a decision; `[NEEDED]` means data the user will supply.

## Design principle

**Single source of truth.** Each topic has exactly one home section.
Cross-references are anchor links that scroll to that home — never duplicated content.

## Sections (top → bottom, single scrollable page)

### 0 · Hero / Welcome
- School name: **Fountainhead Wockhardt Global School**
- Eyebrow: "AY 2026–27 · Parent Hub"
- Welcome line (short, warm)
- Background: drone aerial (`assets/images/DJI_20260305154203_0152_D.jpg`)
- **[?]** Keep the original sample's 3 hero quick-link cards (When does school start / What to wear / How to stay in touch) or drop them now that the topic tile grid is right below the hero?

### 1 · Topic tiles (2×2 grid)
Four anchor targets, each its own section.

| Tile | PDFs available | Content needed |
|---|---|---|
| **Uniform** | `uniform-policy`, `where-to-buy-uniform` | 1–2 line summary above embeds |
| **Food** | `food-policy` | 1–2 line summary above embed |
| **Bus / Transport** | `bus-rules` | 1–2 line summary; routes [NEEDED later] |
| **Who to Contact** | none | Escalation map (homeroom → programme lead → front office → emergencies) |

- **[?]** Tile behaviour: **expand inline** (accordion — summary visible, PDFs reveal below on tap) OR **jump** to a fuller section further down the page?

### 2 · Academic Calendars
Three programme calendars, embedded full-width with mobile fallback to text links (existing pattern from `test-embed.html`).
- PYP — **[NEEDED]** Drive link
- MYP — **[NEEDED]** Drive link
- DP — **[NEEDED]** Drive link

### 3 · IT Systems
How we communicate. Three platforms + one tagging convention.
- **Nucleus** — admin: announcements, fees, transport, reports, forms
- **Google Classroom** — academic: homework, materials, daily highlights
- **Email** — 1:1 with teachers; parent email convention `p.firstname.lastname@fwgs.in`
- **Must Know / Good to Know** — tags on every Nucleus & Classroom announcement (critical vs. optional)
- Carry over from sample: the **"enter your own age" alert** when first logging in (gold-standard specific advice)

### 4 · Get Involved
- **PTA** — Parent Teacher Association, nomination form when available
- **Feedback** — formal (PTI, surveys, grievances) + informal (email, comment to teacher)
- **Events Through the Year** — **[?]** scope: Saturday parent sessions? PTI dates? Sports day, house events? Whole-year parent-facing calendar?

### 5 · IB Policies
Five IB framework documents: Language · Learning Diversity · Academic Integrity · Admission · Assessment.
- **[NEEDED]** Drive links × 5

## Dropped from original sample (and why)

- **"Year ahead" / Key dates table** — dynamic content; may return as a live "Upcoming Dates" strip if we add a Google Sheet route (separate workstream).
- **"New for AY 2026-27" strip** — redundant: each new feature already lives in its own section.
- **"Your child's day" 11-card omnibus** — split into the 4 topic tiles. Smaller items (I-Card, Stationery, Attendance, School visits, Birthdays, Personal belongings, Safety drills, Lost & Found) currently dropped — **[?] permanently, or return later as more tiles?**
- **Learning section** (PYP/MYP/DP curriculum content, programme leads, kickoff week) — currently dropped — **[?] dropped from the hub, or moved to a different surface?**
- **General Policies list** — replaced. Topic policies live in their tiles (Uniform, Food, Bus); IB-framework policies in their own section.
- **FAQ ("Questions parents ask")** — strikethrough on wireframe → dropping. **[?] confirm.**
- **WhatsApp strip + Inbox advisory** — dropped. Brief mention in IT Systems if needed.

## Open questions (numbered for reference)

1. Hero quick-links: keep, drop, or repurpose?
2. Tile behaviour: expand inline (accordion) or jump to a section?
3. Smaller "day" items (Birthdays, Stationery, etc.): dropped permanently or come back?
4. Learning section: dropped from the hub?
5. FAQ: dropped permanently?
6. "Events Through the Year": scope = ?

## Data the user will supply

- 3 academic calendar Drive links (PYP / MYP / DP)
- 5 IB policy Drive links (Language / Learning Diversity / Academic Integrity / Admission / Assessment)
- "How we communicate" content variants (or confirm sample text is usable as-is)
- "Who to Contact" content (escalation map text + actual contact details — currently TBC)
- Final contact info: general email, admissions email, front office number, official WhatsApp, emergency line
- Routes PDF for the Bus tile (separate from Bus Rules)
