# Case Management Database Diagram

This is a solid base ERD for the system. It treats users, companies, and complainants as API-fed reference data coming from your supervisor's service, while keeping the local database focused on cases, stage decisions, joins, and audit history.

```mermaid
erDiagram
  COMPANIES_REFERENCE ||--o{ EMPLOYEES_REFERENCE : contains
  COMPANIES_REFERENCE ||--o{ CASES : linked_to
  EMPLOYEES_REFERENCE ||--o{ CASES : assigned_to
  CAUSE_OF_ACTIONS ||--o{ CASES : classifies
  USERS ||--o{ CASES : creates
  CASES ||--o{ CASE_COMPLAINANTS : has
  COMPLAINANTS ||--o{ CASE_COMPLAINANTS : listed_in
  CASES ||--o{ DECISIONS : has
  USERS ||--o{ AUDIT_LOGS : performs

  COMPANIES_REFERENCE {
    bigint company_id PK
    varchar company_name
    timestamp created_at
    varchar remarks
  }

  EMPLOYEES_REFERENCE {
    bigint employee_id PK
    varchar employee_name
    bigint company_id FK
    varchar company_name
  }

  USERS {
    bigint user_id PK
    varchar username UK
  }

  COMPLAINANTS {
    bigint complainant_id PK
    varchar complainant_name
    timestamp created_at
  }

  CAUSE_OF_ACTIONS {
    bigint cause_of_action_id PK
    varchar cause_of_action
    timestamp created_at
    varchar remarks
  }

  CASES {
    bigint case_id PK
    bigint employee_id FK
    varchar employee_name
    bigint company_id FK
    varchar company_name
    case_status current_status
    date last_status_update
    varchar case_title
    varchar case_number UK
    varchar venue
    bigint cause_of_action_id FK
    bigint created_by_user_id FK
    varchar created_by_username
    timestamp created_at
    timestamp updated_at
  }

  CASE_COMPLAINANTS {
    bigint case_id FK
    bigint complainant_id FK
  }

  DECISIONS {
    bigint decision_id PK
    bigint case_id FK
    decision_level level
    stage_progress progress
    varchar progress_specification
    case_status stage_status
    varchar decision_text
    decimal judgement_award
    varchar category
    varchar remarks
    timestamp created_at
  }

  AUDIT_LOGS {
    bigint log_id PK
    bigint user_id FK
    varchar username
    varchar action
    varchar target_table
    bigint target_id
    timestamp created_at
  }
```

## Enum Sets

- `decision_level`: `labor_arbiter`, `national_labor_relations_commission`, `court_of_appeals`, `supreme_court`
- `case_status`: `FILED`, `PENDING`, `UNDER_REVIEW`, `DECIDED`, `APPEALED`, `CLOSED`, `DISMISSED`
- `stage_progress`: `Settled`, `Not Settled`, `Others`

## Design Notes

- `companies_reference`, `users`, and `complainants` are API-fed data, not local manual master tables.
- `employee_name`, `company_name`, `created_by_username`, and `audit_logs.username` are intentional snapshots for history.
- `case_complainants` supports one case with multiple complainants.
- `decisions` stores one row per case per tribunal level, which keeps LA, NLRC, CA, and SC history in one place.
- If you later want stronger normalization, `cases.employee_name` and `cases.company_name` can be treated strictly as reporting snapshots while the FK IDs remain the source of truth.

## Recommended Interpretation

- The API is the source of reference identity for users, companies, and complainants.
- The database is the source of truth for case history, decisions, and audit activity.
- The diagram is intentionally practical, so it matches your current app structure without pretending the backend already has a full production schema.
