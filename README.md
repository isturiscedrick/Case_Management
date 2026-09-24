# CMI Case Management

Internal system for tracking Philippine labor dispute cases through every stage:

**SEnA → Labor Arbiter (LA) → NLRC → Court of Appeals (CA) → Supreme Court (SC)**

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, lucide-react, Bun |
| Backend  | FastAPI, SQLAlchemy, Alembic, Pydantic, JWT (python-jose), bcrypt |
| Database | MySQL (`case_management`) via PyMySQL |

## Repository layout

```
CMI_Case_Management/
├── frontend/            # Next.js app (see frontend/frontned.md)
├── backend/             # FastAPI app (see backend/backend.md)
├── database-diagram.md  # ERD + enum sets + design notes
└── README.md
```

## Features

- Case creation and update through a step-by-step form (SEnA, LA, NLRC, CA, SC)
- Stage gating: a stage unlocks only after the previous one is filled and its progress is `Not Settled` or `Others`
- Judgment awards (amount or "To be computed"), progress tracking, and a case-level Total Judgment Award
- Close Case (lock) and Archive / Restore
- Role-based access: `admin`, `handling_personnel`, `viewer` (read-only)
- Concurrent-edit locking (one editor per case, 20s heartbeat, 60s timeout)
- Notifications: password-reset requests, case-update alerts, account-lockout alerts
- Login lockout: 3 failed attempts locks the account (5 min, then 1 hour, then 24 hours)
- Dashboard, My Cases (created or saved), Analytics, History, Activity, Archive, User Management, Profile

## Getting started

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # then fill in values (JWT_SECRET_KEY is required)
alembic upgrade head
python seed.py                   # default admin user
python seed_companies.py         # companies from seed_data/company_list.csv
uvicorn app.main:app --reload
```

Health check: `GET http://localhost:8000/api/health`

Default admin from `seed.py`: username `admin`, password `change-me-immediately`. **Change it right away.**

### 2. Frontend

```bash
cd frontend
bun install
cp .env.example .env.local       # set NEXT_PUBLIC_API_URL to the backend origin
bun dev
```

Open http://localhost:3000. Logged-out users are sent to `/login`; logged-in users are sent to `/system/dashboard`. `NEXT_PUBLIC_API_URL` is baked in at build time, so rebuild if it changes.

## Environment variables

**backend/.env**

| Variable | Default | Notes |
|----------|---------|-------|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `3306` / `root` / empty / `case_management` | MySQL connection |
| `JWT_SECRET_KEY` | none | Required. Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Must match the deployed frontend origin exactly (CORS allows only this one) |

**frontend/.env.local**

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Backend origin, e.g. `http://localhost:8000` |

## Roles

| Role | Can do |
|------|--------|
| `admin` | Everything, including user management, unclosing cases, and editing closed cases or locked stage fields |
| `handling_personnel` | Create, update, close, and archive cases |
| `viewer` | Read-only |

## Behavior notes

- **Deleting a user keeps their cases.** `created_by_user_id` / `updated_by_user_id` are set to `NULL`, and history entries keep their snapshot usernames. Only that user's own notifications are removed.
- **Route guard.** `frontend/src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) redirects any `/system/*` request without a `session` cookie to `/login`. It only checks that the cookie exists; the backend still decides whether the token is valid, and each page's 401 handling covers expired tokens.
- **Closed cases** cannot be edited by non-admins, on both the frontend and the backend.
- **Total Judgment Award** is the latest stage's award (SC, then CA, NLRC, LA), not a sum.
- **Saved cases** (My Cases) are stored per username in the browser's `localStorage`, not on the server.

## Deployment utilities

These are deliberate, one-time tools. Do not run them against a live database without a backup.

- `backend/cleanup_data.sql` truncates all case-related tables. It does not touch `users` or `companies_reference`.
- `backend/reset_all_passwords.py` issues a new random password for every user and writes them to `backend/credentials_output.csv` (git-ignored). Distribute the passwords securely, then delete the file.

## Documentation

- [`backend/backend.md`](backend/backend.md): architecture, endpoints, locking, login lockout
- [`frontend/frontned.md`](frontend/frontned.md): structure, domain model, state management
- [`database-diagram.md`](database-diagram.md): ERD, enum sets, design notes

## Known gaps

- JWT is stored in a non-httpOnly cookie until a backend-for-frontend proxy exists.
- The frontend loads at most 500 active and 500 archived cases (`page_size=500` in `lib/api.ts`), so Analytics and the dashboard would miss cases beyond that.