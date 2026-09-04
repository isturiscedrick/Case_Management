# Backend — Case Management API

FastAPI + SQLAlchemy backend for the CMI Case Management system (labor cases
tracked through SEnA → LA → NLRC → CA → SC).

## Stack

- **FastAPI** (routers, dependency injection)
- **SQLAlchemy** ORM, **MySQL** (via `pymysql`) — see `core/config.py`
- **Pydantic** / `pydantic-settings` for schemas & env config
- **python-jose** for JWT, **passlib[bcrypt]** for password hashing

## Getting Started

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt # (create/populate if not present)
```

Create a `.env` file (see `core/config.py` for all fields):

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
│   ├── user.py
│   ├── case.py             # Case, CaseComplainant, CaseCause
│   ├── decision.py         # Decision (one row per case per stage: LA/NLRC/CA/SC)
│   ├── history.py          # CaseHistory (audit log)
│   ├── reference.py        # CompanyReference, Complainant, CauseOfAction
│   └── enums.py            # CaseStatus, StageProgress, DecisionLevel, etc.
├── schemas/                # Pydantic request/response models
│   ├── auth.py, case.py, decision.py, history.py
├── crud/                   # Raw DB access (no business logic)
│   ├── user.py, case.py, decision.py, reference.py, history.py
├── manager/                 # Orchestration across multiple CRUD calls
│   ├── auth_manager.py
│   └── case_workflow_manager.py  # create/update/archive/close case + history
├── service/                 # Business logic + HTTP error handling
│   ├── auth_service.py, case_service.py
│   ├── case_validation_service.py  # Mirrors frontend's caseValidation.ts
│   └── deps.py               # get_current_user, require_role
└── router/                   # FastAPI route definitions
    ├── auth_router.py, case_router.py, history_router.py
```

**Request flow:** `router` → `service` (validation, auth checks, error
mapping) → `manager` (multi-step orchestration + history logging) → `crud`
(single-table DB operations) → `models`.

## API Endpoints

### Auth (`/api/auth`)
| Method | Path         | Description                          |
|--------|--------------|---------------------------------------|
| POST   | `/login`     | Username/password → access+refresh JWT |
| POST   | `/refresh`   | Exchange refresh token for new access token |
| GET    | `/me`        | Current authenticated user             |
| POST   | `/register`  | Create user (**admin only**)           |

### Cases (`/api/cases`)
| Method | Path                        | Description                        |
|--------|-----------------------------|--------------------------------------|
| GET    | `/`                          | List cases (search, status, company, archived, pagination) |
| GET    | `/{case_id}`                 | Get one case                          |
| POST   | `/`                           | Create case                          |
| PUT    | `/{case_id}`                  | Update case                          |
| POST   | `/{case_id}/toggle-archive`   | Archive/restore                      |
| POST   | `/{case_id}/close`            | Lock case from further edits          |
| POST   | `/{case_id}/unclose`          | Re-open a closed case                 |

### History (`/api/history`)
| Method | Path | Description                                   |
|--------|------|-------------------------------------------------|
| GET    | `/`  | List history entries (search, action filter, pagination) |

All case/history routes require a valid bearer token (`get_current_user`).

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
- **`complainants`** / **`cause_of_actions`** are get-or-create reference
  tables (see `crud/reference.py`), auto-populated as cases are created.
- **`companies_reference`** is also get-or-create, but its authoritative
  source is a supervisor-provided CSV rather than case creation — seeded via
  `python seed_companies.py` (`backend/seed_data/company_list.csv`), which
  also carries `company_group`/`company_group2` classification columns not
  present on the other reference tables.
- **`users`** carries `role` (`admin`, `handling_personnel`, `viewer`) —
  ahead of full role-gated permissions (currently only `register` enforces
  `admin`).

### Stage workflow enforcement

`service/case_validation_service.py` re-implements the same rules as the
frontend's `lib/caseValidation.ts`:
- SEnA fields are required to create a case.
- A stage (LA/NLRC/CA/SC) is optional until touched; once any field in it is
  set, all its required fields must be completed.
- Progress `Not Settled` / `Others` require a specification string.
- `total_paid_category` is required once any stage (or SEnA remarks) is
  `Settled`.

`manager/case_workflow_manager.py::determine_reset_stages` (via
`case_validation_service.determine_reset_stages`) clears downstream stage
data when an upstream stage's progress moves away from `Not Settled`/`Others`
— matching the frontend's auto-reset behavior in e.g. `LaSection.tsx`.

## Auth Model

JWT-based, two token types (`access`, `refresh`) distinguished by a `type`
claim. `get_current_user` decodes the access token and loads the `User` row;
`require_role(...)` gates specific endpoints (currently only user
registration).

## Known Gaps / Frontend Integration

- The frontend (`frontend/src/context/CasesContext.tsx`) currently runs on
  **local mock data only** and does not call these endpoints yet. Wiring the
  dashboard, archive, and history pages to `/api/cases` and `/api/history`
  (with a real login flow against `/api/auth/login`) is the main outstanding
  integration task.
- No `requirements.txt` is shown in the provided files — ensure one exists
  listing `fastapi`, `uvicorn`, `sqlalchemy`, `pymysql`, `pydantic-settings`,
  `python-jose`, `passlib[bcrypt]`.
- No Alembic/migration setup is shown; schema creation strategy (e.g.
  `Base.metadata.create_all` vs. migrations) should be confirmed.