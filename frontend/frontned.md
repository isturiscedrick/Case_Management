# Frontend — CMI Case Management

Next.js 16 (App Router) frontend for tracking labor cases through SEnA → Labor
Arbiter → NLRC → Court of Appeals → Supreme Court.

## Stack

- **Next.js** 16.2.12 (App Router), **React** 19.2.4
- **TypeScript** 5, **Tailwind CSS** 4
- **lucide-react** for icons
- Package manager: **bun** (see `bun.lock`); npm/yarn/pnpm also work

## Getting Started

```bash
cd frontend
bun install        # or npm install / yarn / pnpm install
bun dev             # or npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are
redirected to `/login`; authenticated users (via a `session` cookie) land on
`/cases` → `/system/dashboard`.

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
│   │   ├── login/page.tsx           # Sign-in screen
│   │   ├── page.tsx                 # Root redirect (session cookie check)
│   │   ├── system/
│   │   │   ├── layout.tsx           # Sidebar + CasesProvider wrapper
│   │   │   ├── page.tsx             # Redirects to /system/dashboard
│   │   │   ├── dashboard/page.tsx   # Main case table + filters + modals
│   │   │   ├── analytics/page.tsx   # Charts: status/stage/company/personnel
│   │   │   ├── archive/page.tsx     # Archived cases (read-only, restorable)
│   │   │   └── history/page.tsx     # Audit log of create/update/archive/restore
│   │   └── globals.css
│   ├── components/
│   │   ├── dashboard/                # Header, filters, table, modals
│   │   │   └── form/                 # Multi-step CaseForm + per-stage sections
│   │   ├── shared/                    # Modal, ConfirmDialog, Sidebar, badges, etc.
│   │   └── cases/                     # Field, CurrencyField/JudgmentAwardField
│   ├── context/CasesContext.tsx       # In-memory cases + history store (React Context)
│   ├── data/                          # initialCases.ts, historyEvents.ts (seed/mock data)
│   ├── lib/                           # caseHelpers.ts, caseValidation.ts
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
means the case is resolved at that stage).

`totalPaid` reflects the **latest** stage's judgment award (SC → CA → NLRC →
LA), not a sum — see `getTotalJudgmentAward()` in `lib/caseHelpers.ts`.

A case can be **closed** (`closed: true`, sole lock mechanism — see
`CaseForm.tsx`'s "Close Case" button) and separately **archived**
(soft-hidden from the dashboard, visible under `/system/archive`).

Validation rules for what's required/optional per stage live in
`lib/caseValidation.ts` (`getStageGates`, `getCaseDraftErrors`).

## State Management

All case + history data currently lives in **`CasesContext`**
(`src/context/CasesContext.tsx`), seeded from `data/initialCases.ts` and
`data/historyEvents.ts`. This is in-memory/local-only — there is **no API
wiring yet** between this frontend and the `backend/` FastAPI service (see
`backend/app/router/case_router.py`, `auth_router.py`, `history_router.py`
for the intended endpoints). Connecting the two is the main outstanding
integration work.

## Notable Conventions

- Tailwind utility classes throughout; a shared `inputCls` constant
  (`components/cases/CurrencyField.tsx`) is reused across form inputs.
- Color-coded stages: SEnA = yellow, LA = sky, NLRC = violet, CA = green,
  SC = pink, Total Paid = emerald (see `STAGE_STYLES` in
  `components/dashboard/form/shared/SectionHeader.tsx`).
- `frontend/AGENTS.md` / `CLAUDE.md` flag that this Next.js version may
  differ from an AI agent's training data — check `node_modules/next/dist/docs/`
  before relying on assumed APIs.
- `middleware.ts` is currently a no-op (empty matcher) — auth gating happens
  via a cookie check in `app/page.tsx`, not real middleware-based redirects yet.

## TODO / Known Gaps

- Wire `CasesContext` up to the backend REST API instead of local mock data.
- Real authentication (login currently just pushes to `/system/dashboard`
  without validating credentials).
- `CURRENT_USER` in `constants/caseOptions.ts` is a hardcoded placeholder.