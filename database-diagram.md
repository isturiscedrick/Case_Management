# Case Management Database Diagram

This ERD is grounded directly in the frontend's actual data model — `types/case.ts`, `constants/caseOptions.ts`, `context/CasesContext.tsx`, and `data/historyEvents.ts` — rather than a general-purpose case-tracking schema. It treats companies and complainants as API-fed reference data coming from your supervisor's service, while keeping the local database focused on cases, per-stage decisions, joins, case activity history, and now a first-class `users` table with roles.

```mermaid
erDiagram
  COMPANIES_REFERENCE ||--o{ CASES : linked_to
  CAUSE_OF_ACTIONS ||--o{ CASE_CAUSES : classifies
  CASES ||--o{ CASE_CAUSES : has
  USERS ||--o{ CASES : creates
  USERS ||--o{ CASES : last_updates
  CASES ||--o{ CASE_COMPLAINANTS : has
  COMPLAINANTS ||--o{ CASE_COMPLAINANTS : listed_in
  CASES ||--o{ DECISIONS : has
  CASES ||--o{ CASE_HISTORY : logs
  USERS ||--o{ CASE_HISTORY : performs

  COMPANIES_REFERENCE {
    bigint company_id PK
    varchar company_name
    timestamp created_at
    varchar remarks
  }

  USERS {
    bigint user_id PK
    varchar full_name
    user_role role
    timestamp created_at
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
    bigint company_id FK
    varchar company_name
    case_status current_status
    date last_status_update
    varchar case_title
    varchar case_no UK
    varchar venue
    varchar handling_personnel
    varchar handling_personnel_specification
    varchar cause_specification
    date filing_date
    stage_progress remarks
    varchar remark_specification
    decimal total_paid_amount
    total_paid_category total_paid_category
    boolean closed
    date closed_date
    bigint created_by_user_id FK
    varchar created_by_username
    timestamp created_at
    bigint updated_by_user_id FK
    varchar updated_by_username
    timestamp updated_at
    boolean archived
  }

  CASE_COMPLAINANTS {
    bigint case_id FK
    bigint complainant_id FK
  }

  CASE_CAUSES {
    bigint case_id FK
    bigint cause_of_action_id FK
  }

  DECISIONS {
    bigint decision_id PK
    bigint case_id FK
    decision_level level
    date date
    tribunal_decision_status status
    judgment_award_mode judgment_award_mode
    decimal judgment_award_amount
    varchar judgment_award_amount_specification
    varchar judgment_award_computed_specification
    tribunal_remarks remarks
    varchar remarks_specification
    stage_progress progress
    varchar progress_specification
    timestamp created_at
    timestamp updated_at
  }

  CASE_HISTORY {
    bigint history_id PK
    bigint case_id FK
    varchar case_no
    varchar company
    case_history_action action
    bigint performed_by_user_id FK
    varchar performed_by_username
    varchar detail
    timestamp created_at
  }
```

## Enum Sets

- `case_status` (`CaseItem.status`): `Filed`, `Pending`, `Execution`, `Closed`
- `stage_progress` (`CaseItem.caseProgress.{la,nlrc,ca,sc}` **and** `CaseItem.remarks` — same three values in both, so one enum covers both): `Settled`, `Not Settled`, `Others` (unset state is `NULL`, not a 4th value — the frontend uses `""` for "not yet chosen")
- `decision_level`: `labor_arbiter`, `national_labor_relations_commission`, `court_of_appeals`, `supreme_court`
- `tribunal_decision_status` (`LaInfo/NlrcInfo/CaInfo/ScInfo.status`): `Valid Dismissal`, `Illegal Dismissal`, `Convicted`, `Acquitted`, `Dismissed`, `Affirmed`, `Pending`, `Closed`, `Execution`
- `tribunal_remarks` (`LaInfo/NlrcInfo/CaInfo/ScInfo.remarks`): `Appealed by Respondent`, `Appealed by Complainant`, `Not Appealed`, `Motion for Reconsideration`, `Other`. `Motion for Reconsideration` is backend-valid for all four stages (single shared MySQL enum, migration `a1c9e4f7b2d3`), but the frontend only exposes it as a selectable option on NLRC/CA/SC — LA keeps the original 4-option list. Backend validation (`case_validation_service.py`) explicitly rejects it if submitted for LA.
- `judgment_award_mode`: `amount`, `to_be_computed` — an award is either a numeric amount (with `judgment_award_amount_specification` as its basis note) or the literal `"To be computed"` (with `judgment_award_computed_specification` as its basis note); never both
- `total_paid_category` (`CaseItem.totalPaid.category`): `Judgment-Award-L`, `Judgment-Award-W`, `Settlement`
  - Display labels only (values unchanged): the frontend renders `Judgment-Award-W` as "Judgment (In Favor)" and `Judgment-Award-L` as "Judgment (Not In Favor)" everywhere shown to the user (form dropdown, Analytics, dashboard table, View Case modal), via `formatTotalPaidCategory()` in `caseHelpers.ts`. Stored/filtered values remain `Judgment-Award-W` / `Judgment-Award-L`.
- `case_history_action` (`HistoryEntry.action`): `created`, `updated`, `archived`, `restored`
- `user_role` (new): `admin`, `handling_personnel` — not yet reflected anywhere in the frontend (there is no role field or role-gated UI today); added ahead of real auth so `users` doesn't need a breaking migration once login differentiates roles.

## Design Notes

- `companies_reference` and `complainants` are API-fed reference data, not local manual master tables. `users` is now a locally-owned table (see below) rather than API-fed, since role needs to live somewhere authoritative for this app.
- `company_name`, `created_by_username`, `updated_by_username`, and `case_history.company`/`case_history.case_no` are intentional snapshots for history, matching the pattern already used for reference-fed data elsewhere.
- `case_complainants` and `case_causes` are both join tables, since a case can have multiple complainants **and** multiple causes of action (`CaseDraft.complainants: string[]` and `CaseDraft.cause: string[]`).
- `decisions` stores at most one row per `(case_id, level)` — LA, NLRC, CA, SC — since the frontend models each stage as a single keyed object (`la`, `nlrc`, `ca`, `sc`), never an array. Enforced with a unique constraint on `(case_id, level)`.
- SEnA has no `decisions` row of its own — its fields (`company`, `status`, `case_title`, `case_no`, `venue`, `handling_personnel`, `cause`, `filing_date`, `remarks`) live directly on `cases`, matching how `CaseDraft` structures them.
- `total_paid_amount` / `total_paid_category` live on `cases`, not `decisions` — this is a case-level summary derived from whichever stage has the most recent judgment award (SC, then CA, NLRC, LA), computed by `getTotalJudgmentAward()`, not a per-stage value.
- `closed` / `closed_date` are new on `cases`, mapping directly to `CaseItem.closed` / `CaseItem.closedDate`. This is a standalone lock flag set via "Close Case" in `CaseForm.tsx` (`setTop("closed", true)`) — it takes priority over stage/remarks progress in `getCaseStatusSummary()` and is independent of `total_paid_category`/settlement state.
- `case_history` is scoped specifically to case lifecycle events (create/update/archive/restore), matching exactly what `CasesContext.tsx` logs and what the `/system/history` page displays — it is not a generic polymorphic audit log. If the app later needs to audit non-case entities, that would be a separate, more general table.
- `users` now carries `role` (`admin` | `handling_personnel`). The current frontend placeholder (`CURRENT_USER = "Current User"`) means `created_by_username`/`performed_by_username`/`updated_by_username` will resolve to a single seed user until real auth is wired in — see the seed note below. Once auth exists, `created_by_user_id`/`performed_by_user_id`/`updated_by_user_id` should resolve to the actual logged-in user instead of always falling back to the seed row.
- The database is the source of truth for case history, decisions, and case activity. The API is the source of reference identity for companies and complainants.

## Seed Data

- Default seed user (matches the frontend's current `CURRENT_USER` placeholder in `constants/caseOptions.ts`): `user_id=1`, `full_name='Current User'`, `role='admin'`.
- Every `created_by_user_id` / `performed_by_user_id` / `updated_by_user_id` should point at this row until real login differentiates users.

## Recommended Interpretation

- `company_id` as a proper FK (rather than the plain string the frontend prototype currently uses for `CaseDraft.company`) is the intended normalized end-state, consistent with treating companies as API-fed reference data — not a literal 1:1 mirror of today's frontend, which just picks from a local string array.
- `role` on `users` is forward-looking: nothing in the frontend today reads or sets a role, but adding it now avoids an awkward later migration once auth and role-gated permissions (e.g. restricting who can close a case or edit SEnA) are implemented.
- The diagram is intentionally practical: it matches the app's actual field-level structure today (plus this near-term `users`/`closed` extension), not a hypothetical full production schema.