import enum


class CaseStatus(str, enum.Enum):
    Filed = "Filed"
    Pending = "Pending"
    Execution = "Execution"
    Closed = "Closed"


class StageProgress(str, enum.Enum):
    Settled = "Settled"
    Not_Settled = "Not Settled"
    Others = "Others"


class DecisionLevel(str, enum.Enum):
    labor_arbiter = "labor_arbiter"
    national_labor_relations_commission = "national_labor_relations_commission"
    court_of_appeals = "court_of_appeals"
    supreme_court = "supreme_court"


class TribunalDecisionStatus(str, enum.Enum):
    Valid_Dismissal = "Valid Dismissal"
    Illegal_Dismissal = "Illegal Dismissal"
    Convicted = "Convicted"
    Acquitted = "Acquitted"
    Dismissed = "Dismissed"
    Affirmed = "Affirmed"
    Pending = "Pending"
    Closed = "Closed"
    Execution = "Execution"


class TribunalRemarks(str, enum.Enum):
    Appealed_by_Respondent = "Appealed by Respondent"
    Appealed_by_Complainant = "Appealed by Complainant"
    Not_Appealed = "Not Appealed"
    Motion_for_Reconsideration = "Motion for Reconsideration"
    Other = "Other"


class JudgmentAwardMode(str, enum.Enum):
    amount = "amount"
    to_be_computed = "to_be_computed"


class TotalPaidCategory(str, enum.Enum):
    Judgment_Award_L = "Judgment-Award-L"
    Judgment_Award_W = "Judgment-Award-W"
    Settlement = "Settlement"


class CaseHistoryAction(str, enum.Enum):
    created = "created"
    updated = "updated"
    archived = "archived"
    restored = "restored"


class UserRole(str, enum.Enum):
    admin = "admin"
    handling_personnel = "handling_personnel"
    viewer = "viewer"