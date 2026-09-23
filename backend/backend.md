# Backend — Case Management API

FastAPI + SQLAlchemy backend for the CMI Case Management system (labor cases
tracked through SEnA → LA → NLRC → CA → SC).

## Stack

- **FastAPI** (routers, dependency injection)
- **SQLAlchemy** ORM, **MySQL** (via `pymysql`) — see `core/config.py`
- **Pydantic** / `pydantic-settings` for schemas & env config
- **python-jose** for JWT, **passlib[bcrypt]** for password hashing
- **Alembic** for migrations (see `alembic/versions/`)

## Getting Started

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file (see `core/config.py` for all fields — template at
`.env.example`):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=case_management
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_ORIGIN=http://localhost:3000
```

Run migrations, then seed reference data and the default admin:

```bash
alembic upgrade head
python seed.py             # default admin user
python seed_companies.py   # companies_reference from seed_data/company_list.csv
```

Run the dev server:

```bash
uvicorn app.main:app --reload
```

Health check: `GET /api/health`

## Project Structure (layered architecture)

```
backend/app/
├── main.py                # FastAPI app, CORS, router registration
├── core/
│   ├── config.py           # Settings (env-driven)
│   ├── database.py         # Engine, SessionLocal, get_db dependency
│   └── security.py         # JWT encode/decode, password hashing
├── models/                 # SQLAlchemy ORM models
│   ├── user.py             # includes login-lockout fields, profile_picture
│   ├── case.py             # Case, CaseComplainant, CaseCause
│   ├── decision.py         # Decision (one row per case per stage: LA/NLRC/CA/SC)
│   ├── history.py          # CaseHistory (audit log)
│   ├── reference.py        # CompanyReference, Complainant, CauseOfAction
│   ├── case_lock.py        # CaseLock — one row per case, concurrent-edit lock
│   ├── notification.py     # Notification (password resets, case updates, lockouts)
│   └── enums.py            # CaseStatus, StageProgress, DecisionLevel, UserRole, etc.
├── schemas/                # Pydantic request/response models
│   ├── auth.py, case.py, decision.py, history.py, company.py
│   ├── case_lock.py, notification.py
├── crud/                   # Raw DB access (no business logic)
│   ├── user.py, case.py, decision.py, reference.py, history.py
│   ├── case_lock.py, notification.py
├── manager/                 # Orchestration across multiple CRUD calls
│   ├── auth_manager.py       # login, JWT issuance, login-lockout tiers
│   ├── case_workflow_manager.py  # create/update/archive/close case + history
│   └── history_manager.py
├── service/                 # Business logic + HTTP error handling
│   ├── auth_service.py, case_service.py, company_service.py, history_service.py
│   ├── case_validation_service.py  # Mirrors frontend's caseValidation.ts
│   ├── case_lock_service.py  # Acquire/heartbeat/release/status for edit locks
│   └── deps.py               # get_current_user, require_role
└── router/                   # FastAPI route definitions
    ├── auth_router.py, case_router.py, company_router.py
    ├── history_router.py, notification_router.py
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Path                              | Description                                             |
|--------|------------------------------------|-----------------------------------------------------------|
| POST   | `/login`                           | Username/password → access+refresh JWT (subject to login-lockout, see below) |
| POST   | `/refresh`                         | Exchange refresh token for new access token               |
| GET    | `/me`                              | Current authenticated user                                |
| PUT    | `/me`                              | Update own profile (name, username, password, picture)    |
| POST   | `/me/password-reset-request`       | Non-admin requests a password reset from an admin         |
| GET    | `/users`                           | List all users (**admin only**)                           |
| PUT    | `/users/{user_id}/password`        | Admin sets a user's password directly                     |
| PUT    | `/users/{user_id}/role`            | Admin changes a user's role (cannot change own)            |
| DELETE | `/users/{user_id}`                 | Admin deletes a user (cannot delete own; case/history rows are preserved with the FK nulled) |
| POST   | `/register`                        | Create user (**admin only**)                               |

Roles are `admin`, `handling_personnel`, `viewer`.

### Cases (`/api/cases`)
| Method | Path                        | Description                        |
|--------|-----------------------------|--------------------------------------|
| GET    | `/`                          | List cases (search, status, company, archived, pagination) |
| GET    | `/{case_id}`                 | Get one case                          |
| POST   | `/`                           | Create case (admin or handling_personnel) |
| PUT    | `/{case_id}`                  | Update case (admin or handling_personnel; blocked if case is closed unless admin) |
| POST   | `/{case_id}/toggle-archive`   | Archive/restore                      |
| POST   | `/{case_id}/close`            | Lock case from further edits          |
| POST   | `/{case_id}/unclose`          | Re-open a closed case (**admin only**) |
| GET    | `/{case_id}/lock`             | Read-only edit-lock status (no side effects) |
| POST   | `/{case_id}/lock`             | Acquire/reclaim the edit lock          |
| POST   | `/{case_id}/lock/heartbeat`   | Keep an acquired lock alive            |
| DELETE | `/{case_id}/lock`             | Release the edit lock (holder, or admin force-release) |

`viewer` accounts can read but not write; every mutating route is gated by
`require_role(admin, handling_personnel)` except unclose, which is admin-only.

### Companies (`/api/companies`)
| Method | Path | Description                                        |
|--------|------|------------------------------------------------------|
| GET    | `/`  | List companies from `companies_reference` (name + group/group2) |

### History (`/api/history`)
| Method | Path                | Description                                         |
|--------|---------------------|--------------------------------------------------------|
| GET    | `/`                 | List all history entries (search, action filter, pagination) — any authenticated user |
| GET    | `/me`               | History entries performed by the current user only     |
| GET    | `/case/{case_id}`   | History entries for one case                            |

### Notifications (`/api/notifications`)
| Method | Path                             | Description                                                        |
|--------|-----------------------------------|----------------------------------------------------------------------|
| GET    | `/me`                             | Current user's own notifications                                     |
| GET    | `/pending`                        | Pending password-reset requests (**admin only**)                     |
| GET    | `/decided`                        | Approved/declined password-reset requests (**admin only**)           |
| POST   | `/{id}/approve`                   | Approve a password-reset request (**admin only**)                    |
| POST   | `/{id}/decline`                   | Decline a password-reset request (**admin only**)                    |
| POST   | `/{id}/disregard-lockout`         | Clear a user's login-lockout offense count and unlock them (**admin only**) |
| POST   | `/{id}/read`                      | Mark a notification (case update / decided reset) as read by its owner |

Notification types: `password_reset`, `case_update` (created when someone
else updates a case you created), `password_changed` (self-logged, always
`resolved`), `account_lockout` (sent to every admin when an account crosses
the failed-login threshold).

All case/history/notification routes require a valid bearer token
(`get_current_user`); write-sensitive ones additionally require a role via
`require_role(...)`.

## Domain Model

Mirrors the frontend's `types/case.ts` closely — see `database-diagram.md`
(repo root) for the full ERD and design rationale. Key points:

- **`cases`** holds SEnA-level fields directly (company, case title/no.,
  venue, handling personnel, cause specification, filing date, remarks) plus
  case-level flags (`closed`, `closed_date`, `archived`) and the rolled-up
  `total_paid_amount` / `total_paid_category`.
- **`decisions`** stores at most one row per `(case_id, level)` for LA/NLRC/CA/SC
  — enforced by a unique constraint — matching the frontend's single-object
  (not array) shape per stage.
- **`case_complainants`** / **`case_causes`** are join tables since a case can
  have multiple complainants and multiple causes.
- **`case_history`** is a case-lifecycle-specific audit log (`created`,
  `updated`, `archived`, `restored`) — not a generic polymorphic log.
- **`case_locks`** holds at most one row per `case_id`; it's how the backend
  prevents two users from editing the same case concurrently (see
  "Concurrent edit locking" below).
- **`notifications`** is a generic per-user inbox (password resets, case
  updates, password changes, account lockouts) with an optional `actor_user_id`
  distinct from the recipient `user_id`.
- **`complainants`** / **`cause_of_actions`** are get-or-create reference
  tables (see `crud/reference.py`), auto-populated as cases are created.
- **`companies_reference`** is also get-or-create, but its authoritative
  source is a supervisor-provided CSV rather than case creation — seeded via
  `python seed_companies.py` (`backend/seed_data/company_list.csv`), which
  also carries `company_group`/`company_group2` classification columns not
  present on the other reference tables.
- **`users`** carries `role` (`admin`, `handling_personnel`, `viewer`),
  an optional `profile_picture`, and login-lockout bookkeeping
  (`failed_login_attempts`, `locked_until`, `lockout_offense_count`).

### Stage workflow enforcement

`service/case_validation_service.py` re-implements the same rules as the
frontend's `lib/caseValidation.ts`:
- SEnA fields are required to create a case.
- A stage (LA/NLRC/CA/SC) is optional until touched; once any field in it is
  set, all its required fields must be completed.
- Progress `Not Settled` / `Others` require a specification string.
- `total_paid_category` is required once any stage (or SEnA remarks) is
  `Settled`.
- `Motion for Reconsideration` is a valid `remarks` value for NLRC/CA/SC only
  — rejected server-side if submitted for LA.

`manager/case_workflow_manager.py::determine_reset_stages` (via
`case_validation_service.determine_reset_stages`) clears downstream stage
data when an upstream stage's progress moves away from `Not Settled`/`Others`
— matching the frontend's auto-reset behavior in e.g. `LaSection.tsx`.

`service/case_service.py::update_case` also mirrors the frontend's per-stage
disabled fieldsets server-side: once a stage's required fields are already
saved, a non-admin caller can no longer rewrite its date/status/judgment
award via the API (only Remarks/Progress may still change) —
`determine_locked_stage_edits` computes this from the existing DB rows.
Admins bypass both this lock and the closed-case write lock.

### Concurrent edit locking

`case_locks` gives exclusive editing rights to one user at a time per case,
mirrored on the frontend by `dashboard/page.tsx`'s heartbeat loop:
- `POST /lock` creates the row if free, refreshes it if already held by the
  same user, reclaims it if the existing lock is stale, or returns `409` with
  the current holder's name otherwise.
- `POST /lock/heartbeat` keeps a held lock alive; if the caller no longer
  holds it (reclaimed after going stale), it returns `409` so the client can
  treat the edit as lost.
- `DELETE /lock` releases explicitly (Cancel/Save/unmount, or `beforeunload`
  via a best-effort `keepalive` fetch); admins may force-release anyone's
  lock.
- A lock is considered stale — and silently reclaimable — once
  `last_heartbeat_at` is older than `LOCK_TIMEOUT_SECONDS` (60s), comfortably
  above the frontend's ~20s heartbeat interval.

### Login lockout

`manager/auth_manager.py` enforces a tiered lockout on repeated failed
logins (`MAX_FAILED_LOGIN_ATTEMPTS = 3`):
- 1st offense → locked 5 minutes
- 2nd offense → locked 1 hour
- 3rd+ offense → locked 24 hours (capped)

The lock expires lazily (checked on the next login attempt, no cron job).
`failed_login_attempts` resets on a lock that has already expired or on a
successful login; `lockout_offense_count` persists across successful logins
and only resets when an admin explicitly disregards it
(`POST /api/notifications/{id}/disregard-lockout`), which also unlocks the
account immediately and resolves every other admin's copy of the alert. The
moment an account is newly locked, every admin gets an `account_lockout`
notification (`service/auth_service.py::login`).

## Auth Model

JWT-based, two token types (`access`, `refresh`) distinguished by a `type`
claim; the access token also carries the user's `role` as an extra claim.
`get_current_user` decodes the access token and loads the `User` row;
`require_role(...)` gates role-sensitive endpoints (case writes, user
management, notification decisions, unclose).

## Known Gaps / Integration Status

- The frontend (`frontend/src/lib/api.ts`, `frontend/src/context/CasesContext.tsx`)
  is now wired to these endpoints for real — cases, history, companies, auth,
  notifications, and case-edit locking are all live network calls, not mock
  data. `CURRENT_USER` in `constants/caseOptions.ts` is unused dead weight at
  this point: the payloads built in `caseMapper.ts` don't send a creator name,
  and the backend derives `created_by`/`updated_by` from the authenticated
  user, not from the client.
- No `requirements.txt` gap remains — `backend/requirements.txt` lists
  `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `pymysql`, `pydantic`,
  `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`,
  `python-dotenv`, `python-multipart`.
- Schema is managed via Alembic (`backend/alembic/`), not
  `Base.metadata.create_all` — run `alembic upgrade head` before serving.
- `backend/cleanup_data.sql` and `backend/reset_all_passwords.py` are
  deployment-prep utilities, not part of the running API; use them
  deliberately (they truncate case data / reissue every password,
  respectively) and never against a live production database without a
  backup.