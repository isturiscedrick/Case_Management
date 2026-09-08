import type { CaseItem, LaInfo, NlrcInfo, CaInfo, ScInfo, CaseProgress, StageProgress, CaseStatus } from "@/types/case";

// Shape of what the backend actually returns from GET /api/cases and
// GET /api/cases/{id} — mirrors CaseOut/DecisionOut in
// backend/app/schemas/case.py and decision.py. Kept local to this file
// since nothing else needs the raw wire shape.
interface DecisionOut {
  decision_id: number;
  case_id: number;
  level: "labor_arbiter" | "national_labor_relations_commission" | "court_of_appeals" | "supreme_court";
  date: string | null;
  status: string | null;
  judgment_award_mode: "amount" | "to_be_computed" | null;
  judgment_award_amount: string | null; // Decimal serializes as string
  judgment_award_amount_specification: string | null;
  judgment_award_computed_specification: string | null;
  remarks: string | null;
  remarks_specification: string | null;
  progress: string | null;
  progress_specification: string | null;
}

export interface CaseOut {
  case_id: number;
  company_name: string;
  current_status: string;
  case_title: string;
  case_no: string;
  venue: string | null;
  handling_personnel: string | null;
  handling_personnel_specification: string | null;
  cause_specification: string | null;
  filing_date: string | null;
  remarks: string | null;
  remark_specification: string | null;
  total_paid_amount: string | null;
  total_paid_category: string | null;
  closed: boolean;
  closed_date: string | null;
  created_by_username: string | null;
  created_at: string | null;
  updated_by_username: string | null;
  updated_at: string | null;
  archived: boolean;
  complainants: string[];
  causes: string[];
  decisions: DecisionOut[];
}

const LEVEL_TO_STAGE_KEY: Record<DecisionOut["level"], "la" | "nlrc" | "ca" | "sc"> = {
  labor_arbiter: "la",
  national_labor_relations_commission: "nlrc",
  court_of_appeals: "ca",
  supreme_court: "sc",
};

const EMPTY_STAGE = {
  date: "",
  status: "",
  judgmentAward: "",
  judgmentAwardSpecification: "",
  judgmentAwardComputedSpecification: "",
  remarks: "",
  remarksSpecification: "",
};

function mapJudgmentAward(decision: DecisionOut) {
  if (decision.judgment_award_mode === "to_be_computed") {
    return {
      judgmentAward: "To be computed",
      judgmentAwardSpecification: "",
      judgmentAwardComputedSpecification: decision.judgment_award_computed_specification ?? "",
    };
  }
  if (decision.judgment_award_mode === "amount") {
    return {
      judgmentAward: decision.judgment_award_amount ?? "",
      judgmentAwardSpecification: decision.judgment_award_amount_specification ?? "",
      judgmentAwardComputedSpecification: "",
    };
  }
  return { judgmentAward: "", judgmentAwardSpecification: "", judgmentAwardComputedSpecification: "" };
}

function mapStage(decision: DecisionOut | undefined): LaInfo | NlrcInfo | CaInfo | ScInfo {
  if (!decision) return { ...EMPTY_STAGE };
  return {
    date: decision.date ?? "",
    status: decision.status ?? "",
    ...mapJudgmentAward(decision),
    remarks: decision.remarks ?? "",
    remarksSpecification: decision.remarks_specification ?? "",
  };
}

function mapProgress(decisions: DecisionOut[]): CaseProgress {
  const byStage = new Map(decisions.map((d) => [LEVEL_TO_STAGE_KEY[d.level], d]));
  const get = (key: "la" | "nlrc" | "ca" | "sc") => byStage.get(key);

  return {
    la: (get("la")?.progress as StageProgress) ?? "",
    nlrc: (get("nlrc")?.progress as StageProgress) ?? "",
    ca: (get("ca")?.progress as StageProgress) ?? "",
    sc: (get("sc")?.progress as StageProgress) ?? "",
    laSpecification: get("la")?.progress_specification ?? "",
    nlrcSpecification: get("nlrc")?.progress_specification ?? "",
    caSpecification: get("ca")?.progress_specification ?? "",
    scSpecification: get("sc")?.progress_specification ?? "",
  };
}

export function mapCaseOutToCaseItem(out: CaseOut): CaseItem {
  const byStage = new Map(out.decisions.map((d) => [LEVEL_TO_STAGE_KEY[d.level], d]));

  return {
    id: out.case_id,
    company: out.company_name,
    status: (out.current_status as CaseStatus) ?? "Pending",
    date: out.updated_at ?? out.created_at ?? "",
    caseTitle: out.case_title,
    caseNo: out.case_no,
    complainants: out.complainants.length > 0 ? out.complainants : [""],
    venue: out.venue ?? "",

    handlingPersonnel: out.handling_personnel ?? "",
    handlingPersonnelSpecification: out.handling_personnel_specification ?? "",

    cause: out.causes,
    causeSpecification: out.cause_specification ?? "",
    filingDate: out.filing_date ?? "",
    remarks: out.remarks ?? "",
    remarkSpecification: out.remark_specification ?? "",

    la: mapStage(byStage.get("la")) as LaInfo,
    nlrc: mapStage(byStage.get("nlrc")) as NlrcInfo,
    ca: mapStage(byStage.get("ca")) as CaInfo,
    sc: mapStage(byStage.get("sc")) as ScInfo,

    totalPaid: {
      amount: out.total_paid_amount ?? "",
      category: (out.total_paid_category as CaseItem["totalPaid"]["category"]) ?? "",
    },

    caseProgress: mapProgress(out.decisions),

    createdBy: out.created_by_username ?? "",
    createdAt: out.created_at ?? "",

    updatedBy: out.updated_by_username ?? undefined,
    updatedAt: out.updated_at ?? undefined,

    closed: out.closed,
    closedDate: out.closed_date ?? "",

    archived: out.archived,
  };
}