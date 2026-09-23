# Frontend — CMI Case Management

Next.js 16 (App Router) frontend for tracking labor cases through SEnA →
Labor Arbiter → NLRC → Court of Appeals → Supreme Court.

## Stack

- **Next.js** 16.2.12 (App Router), **React** 19.2.4
- **TypeScript** 5, **Tailwind CSS** 4
- **lucide-react** ^1.27.0 for icons
- Package manager: **bun** (see `bun.lock`); npm/yarn/pnpm also work

> `AGENTS.md` / `CLAUDE.md` at the project root flag that this Next.js
> version may differ from an AI agent's training data — check
> `node_modules/next/dist/docs/` before relying on assumed APIs, and heed
> deprecation notices.

## Getting Started

```bash
cd frontend
bun install        # or npm install / yarn / pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to the backend origin
bun dev             # or npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `NEXT_PUBLIC_API_URL`
is baked in at build time (not read at runtime) — set it before `bun run
build` and rebuild if it changes. Unauthenticated users are redirected to
`/login`; authenticated users (via a non-httpOnly `session` cookie holding
the JWT access token) land on `/cases` → `/system/dashboard`.

## Scripts

| Command       | Description                  |
|---------------|-------------------------------|
| `dev`         | Start dev server               |
| `build`       | Production build                |
| `start`       | Start production server         |
| `lint`        | Run ESLint                       |

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── login/page.tsx           # Sign-in screen (real auth against /api/auth/login)
│   │   ├── page.tsx                 # Root redirect (session cookie check)
│   │   ├── middleware.ts            # Currently a no-op (empty matcher)
│   │   └── system/
│   │       ├── layout.tsx           # Sidebar + CasesProvider wrapper
│   │       ├── page.tsx             # Redirects to /system/dashboard
│   │       ├── dashboard/page.tsx   # Main case table + filters + modals + edit-lock heartbeat
│   │       ├── mycases/page.tsx     # Cases the current user created or saved
│   │       ├── analytics/page.tsx   # Charts: status/stage/company/personnel/category
│   │       ├── archive/page.tsx     # Archived cases (read-only, restorable)
│   │       ├── history/page.tsx     # Audit log of create/update/archive/restore
│   │       ├── activity/page.tsx    # Current user's own case actions + password-reset decisions
│   │       ├── notifications/page.tsx # Password resets, case-update alerts, lockout alerts
│   │       ├── users/page.tsx       # Admin-only user management (create, role, reset, delete)
│   │       └── profile/page.tsx     # Own profile (name, username, password, picture)
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/                # Header, filters, table, card list, modals
│   │   │   └── form/                 # Multi-step CaseForm + per-stage sections + shared UI
│   │   ├── shared/                    # Modal, ConfirmDialog, Sidebar, badges, DetailRow,
│   │   │                              # ViewCaseContent, caseTableHelpers, etc.
│   │   └── cases/                     # Field, CurrencyField/JudgmentAwardField
│   ├── context/CasesContext.tsx       # Fetches cases + history from the API on mount; exposes
│   │                                  # addCase/updateCase/toggleArchive/setCaseClosed as API calls
│   ├── data/                          # initialCases.ts, historyEvents.ts (fallback/reference data)
│   ├── lib/                           # api.ts (HTTP client), caseMapper.ts (API <-> CaseItem),
│   │                                  # caseHelpers.ts, caseValidation.ts, savedCases.ts (localStorage)
│   ├── constants/caseOptions.ts       # Dropdown options, styles, EMPTY_CASE
│   └── types/case.ts                  # CaseItem / CaseDraft / stage types
└── public/                            # Static assets (svgs)
```

## Domain Model

A **case** moves through five stages, each optional except SEnA:

1. **SEnA** (Single Entry Approach) — base case info (company, complainants,
   venue, cause, filing date, handling personnel, remarks).
2. **LA** (Labor Arbiter)
3. **NLRC** (National Labor Relations Commission)
4. **CA** (Court of Appeals)
5. **SC** (Supreme Court)

Each of LA/NLRC/CA/SC has: `date`, `status`, `judgmentAward` (amount or "To
be computed"), `remarks`, and a separate `caseProgress` entry (`Settled` /
`Not Settled` / `Others`). A stage only unlocks once the previous stage is
filled **and** its progress is `Not Settled` or `Others` (marking `Settled`
means the case is resolved at that stage). `Motion for Reconsideration` is
selectable as a Remarks option on NLRC/CA/SC only — not on LA.

`totalPaid` reflects the **latest** stage's judgment award (SC → CA → NLRC →
LA), not a sum — see `getTotalJudgmentAward()` in `lib/caseHelpers.ts`.

A case can be **closed** (`closed: true` — see `CaseForm.tsx`'s "Close Case"
button, hitting `POST /api/cases/{id}/close`) and separately **archived**
(soft-hidden from the dashboard, visible under `/system/archive`). Admins
can still edit and unclose a closed case; everyone else is locked out once
closed (enforced both client-side in `CaseForm.tsx`/`CaseTableRow.tsx` and
server-side in `case_service.py`).

Validation rules for what's required/optional per stage live in
`lib/caseValidation.ts` (`getStageGates`, `getCaseDraftErrors`), mirrored
server-side in `backend/app/service/case_validation_service.py`.

## State Management

`CasesContext` (`src/context/CasesContext.tsx`) loads cases and history from
the backend on mount via `lib/api.ts` (`fetchCases`, `fetchHistory`) and
exposes `addCase` / `updateCase` / `toggleArchive` / `setCaseClosed`, each of
which performs the matching mutation (`POST /api/cases`, `PUT
/api/cases/{id}`, `POST /api/cases/{id}/toggle-archive`, `POST
/api/cases/{id}/close|unclose`) and merges the server's response back into
state via `caseMapper.ts::mapCaseOutToCaseItem`. There is no more
local-only mock store for the running app — `data/initialCases.ts` and
`data/historyEvents.ts` now serve only as a fallback companies list source
and reference/sample shapes.

A 401 from any authenticated call throws `UnauthorizedError`, which
`CasesContext` and each page catch to redirect to `/login`.

## Case editing: concurrent-lock + auto-save-guard

`dashboard/page.tsx` and `mycases/page.tsx` both implement the same flow
around `openEdit`:
1. `acquireCaseLock(caseId)` — on `409` (someone else holds it), the case
   opens read-only in `ViewCaseModal` with a "locked by X" banner instead of
   the edit form.
2. On success, a ~20s heartbeat (`heartbeatCaseLock`) keeps the lock alive
   while the modal is open; a lost/reclaimed lock kicks the user back out
   with an alert.
3. `releaseCaseLock` fires on Cancel/Save/unmount; `releaseCaseLockOnUnload`
   is a best-effort `keepalive` fetch for tab close / navigation away.

See `backend.md`'s "Concurrent edit locking" section for the server side.

## Notable Conventions

- Tailwind utility classes throughout; a shared `inputCls` constant
  (`components/cases/CurrencyField.tsx`) is reused across form inputs.
- Color-coded stages: SEnA = yellow, LA = sky, NLRC = violet, CA = green,
  SC = pink, Total Paid = emerald (see `STAGE_STYLES` in
  `components/dashboard/form/shared/SectionHeader.tsx`).
- Role-aware UI: `isAdmin` (from `fetchCurrentUser().role === "admin"`)
  bypasses the closed-case lock and the per-stage field locks in
  `CaseForm.tsx`/`CaseTableRow.tsx`, matching the backend's admin exemptions.
- "Saved" cases (`/system/mycases`) are tracked client-side only, per
  username, in `localStorage` via `lib/savedCases.ts` — not persisted on the
  backend.
- `middleware.ts` is currently a no-op (empty matcher) — auth gating happens
  via a cookie check in `app/page.tsx`, not real middleware-based redirects
  yet.

## TODO / Known Gaps

- `middleware.ts` still doesn't do real redirect-based auth gating; a user
  who manually navigates to a `/system/*` route without a valid cookie
  relies on the page's own `fetchCurrentUser()` 401 handling, not middleware.
- `CURRENT_USER` in `constants/caseOptions.ts` is a stale placeholder — no
  longer read by the create/update flow, which relies on the backend's
  authenticated user for `createdBy`/`updatedBy`. Safe to remove once
  confirmed unused elsewhere.
- "Saved to My Cases" is local-only (see above); it doesn't sync across
  devices or survive a cleared browser profile.