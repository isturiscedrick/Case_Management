# Case Management Database Diagram

This diagram is based on your schema draft and keeps the system organized around cases, decisions, reference data, authentication, and audit logging.

```dbml
Enum decision_level {
  labor_arbiter
  national_labor_relations_commission
  court_of_appeals
  supreme_court
}

Enum case_status {
  FILED
  PENDING
  UNDER_REVIEW
  DECIDED
  APPEALED
  CLOSED
  DISMISSED
}

Table employees_reference {
  employee_id bigint [pk, increment]
  employee_name varchar(150)
  company_id bigint
  company_name varchar

  indexes {
    company_id
  }
}

Table cause_of_actions {
  cause_of_action_id bigint [pk, increment]
  cause_of_action varchar
  created_at timestamp
  remarks varchar
}

Table users {
  user_id bigint [pk, increment]
  username varchar(100) [unique]
}

Table cases {
  case_id bigint [pk, increment]
  employee_id bigint [not null]
  employee_name varchar
  company_id bigint
  company_name varchar
  current_status case_status
  last_status_update date
  case_title varchar(255)
  case_number varchar(100) [unique]
  complainants_name varchar [not null]
  venue varchar(150)
  cause_of_action_id bigint
  created_by varchar
  created_at timestamp
  updated_at timestamp

  indexes {
    employee_id
    company_id
    cause_of_action_id
    created_by
  }
}

Table decisions {
  decision_id bigint [pk, increment]
  case_id bigint [not null]
  level decision_level [not null]
  decision_text varchar
  judgement_award decimal(15,2)
  category varchar
  created_at timestamp
  remarks varchar

  indexes {
    case_id
  }
}

Table audit_logs {
  log_id bigint [pk, increment]
  user_id bigint
  username varchar
  action varchar(100)
  target_table varchar(100)
  target_id bigint
  created_at timestamp

  indexes {
    user_id
    (target_table, target_id)
  }
}

Ref: cases.cause_of_action_id > cause_of_actions.cause_of_action_id
Ref: cases.employee_id > employees_reference.employee_id
Ref: cases.created_by > users.username
Ref: decisions.case_id > cases.case_id
Ref: audit_logs.user_id > users.user_id
```

## Relationship Notes

- `cases.employee_name`, `cases.company_name`, and `audit_logs.username` are historical snapshots.
- `employees_reference.company_name` is also a snapshot and is not enforced as a foreign key.
- `decisions.level` separates outcomes by tribunal level: LA, NLRC, CA, and SC.
- `case_status` is the controlled workflow for the case lifecycle.

## Suggested Next Step

If you want, I can turn this into a rendered Mermaid ER diagram or a cleaner visual diagram page in the workspace.