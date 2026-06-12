# My Bus — parent-specific bus & route (Apps Script)

A logged-in parent opens this web app; it reads their signed-in Google identity,
finds their child in the roster **by parent email**, and shows that child's bus +
the full route (both directions). Each parent only ever sees their **own** child's
record — no search, no enumeration.

## Data source

Google Sheet `1S7sMnnwmcNuwhNYouwoddSGojW5PYv0oXGjKEAzKR-w`. The parser is **header-driven and
tab-auto-detecting** — it reads every tab once and classifies them by their header row, so you can
rename tabs, reorder columns, or add columns **without breaking it**. What it needs:

- A **roster** tab — a header row containing a **Name** column and an **Email** column (e.g. "Email ID"),
  plus optional **Class / Pick Up-Time / Drop-Time / Landmark**. Students are grouped under `BUS NO n …`
  banner rows in **column A** (any case — "BUS NO 1" or "Bus No 1"; merged banner cells are fine, Apps
  Script reads the top-left). The **Email** cell is the login key — the signed-in parent's email is
  matched against it (and *only* it), so one parent can never resolve to another family's row.
- A **routes** tab (optional) — a header row with **Pick Up-Time / Drop-Time / Landmark** and the same
  `BUS NO n` banners, giving the full clean route per bus. If a bus isn't found there, the route is
  built from that bus's students in the roster instead.

**Per-student stop:** if a student's row has a **Landmark** (+ Pick-up/Drop) filled, "My Bus" shows it
as a highlighted **"Your stop"** and stars it in the route. If blank (still being populated), it shows
the bus's full route and invites the parent to find their stop. **Teacher rows** have no parent login,
so they never match.

## Deploy

1. [script.google.com](https://script.google.com) → **New project** → paste `Code.gs` + `appsscript.json`
   (Project Settings → "Show appsscript.json manifest" to edit the manifest).
2. Run `ping` once to grant the Sheets + email authorization prompt.
3. **Deploy → New deployment → Web app:**
   - **Execute as:** *Me (owner)* — so the script reads the private sheet; parents never get sheet access,
     yet `getActiveUser()` still returns the **caller's** email (same Workspace domain).
   - **Who has access:** your school domain (restrict it — this returns personal data).
4. Copy the `/exec` URL into:
   - `parent-hub/assets/resources.js` → the `my-bus` entry `url`.
   - (optional) the hub hero greeting `<script src>` (same `/exec` URL, with `?mode=whoami`).

## Re-deploying after a code change

After you edit `Code.gs`, push the new version: **Deploy → Manage deployments → (pencil / edit the Web
app) → Version: New version → Deploy.** The `/exec` URL stays the same, so nothing else changes.

## ⚠ Cross-domain identity caveat

`getActiveUser().getEmail()` returns an email only for callers in the **same Workspace domain** as the
deployer. **Confirmed working** in testing — deployed under `fountainheadschools.org`, signed in with
the same domain, identity read correctly.

For real `@fwgs.in` parents: deploy under an `@fwgs.in` account so parents are same-domain. If you need
a single deployment to identify **both** `@fwgs.in` parents and `@fountainheadschools.org` testers, tell
me and we switch to **Google Sign-In (ID token)** — domain-agnostic, a bit more setup.

## Endpoints

- `GET /exec` → the personalised **My Bus** HTML page.
- `GET /exec?mode=whoami&callback=fn` → JSONP `fn({ ok, studentName })` for the hub's optional
  "Welcome, parent of X" hero greeting (best-effort; may be blocked inside the Google-Sites iframe).
