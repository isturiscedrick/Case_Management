import type { CaseStatus, StageProgress, CaseDraft, EditRestrictions } from "@/types/case";
export const STATUS_OPTIONS: ("All" | CaseStatus)[] = ["All", "Filed", "Pending", "Execution", "Closed"];
export const CASE_STATUS_SUMMARY_OPTIONS: ("All" | "Settled" | "Not Settled" | "Pending" | "Closed")[] = [
  "All",
  "Settled",
  "Not Settled",
  "Pending",
  "Closed",
];
export const PROGRESS_OPTIONS: Array<"All" | StageProgress> = [
  "All",
  "Settled",
  "Not Settled",
  "Others",
];

export const SENA_STATUS_OPTIONS: CaseStatus[] = ["Filed", "Pending", "Closed"];

export const STATUS_STYLES: Record<CaseStatus, { badge: string; dot: string }> = {
  Filed: {
    badge: "bg-sky-50 text-sky-600 ring-sky-200",
    dot: "bg-sky-500",
  },
  Pending: {
    badge: "bg-amber-50 text-amber-600 ring-amber-200",
    dot: "bg-amber-500",
  },
  Execution: {
    badge: "bg-orange-50 text-orange-600 ring-orange-200",
    dot: "bg-orange-500",
  },
  Closed: {
    badge: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    dot: "bg-emerald-500",
  },
};

export const DEFAULT_STATUS_STYLE = {
  badge: "bg-slate-100 text-slate-700 ring-slate-200",
  dot: "bg-slate-400",
};

// Styles for the dashboard's derived "Case Status" column (see
// getCaseStatusSummary in caseHelpers.ts). Separate from STATUS_STYLES,
// which colors SEnA's own item.status field.
export const CASE_STATUS_SUMMARY_STYLES: Record<"Settled" | "Not Settled" | "Pending" | "Closed", { badge: string; dot: string }> = {
  Settled: { badge: "bg-emerald-50 text-emerald-600 ring-emerald-200", dot: "bg-emerald-500" },
  "Not Settled": { badge: "bg-rose-50 text-rose-600 ring-rose-200", dot: "bg-rose-500" },
  Pending: { badge: "bg-amber-50 text-amber-600 ring-amber-200", dot: "bg-amber-500" },
  Closed: { badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
};

export const PROGRESS_STAGES: Array<{ key: "la" | "nlrc" | "ca" | "sc"; label: string }> = [
  { key: "la", label: "LA" },
  { key: "nlrc", label: "NLRC" },
  { key: "ca", label: "CA" },
  { key: "sc", label: "SC" },
];

export const CAUSE_OPTIONS = [
  "Criminal Case",
  "Civil Case",
  "Administrative Case",
  "Illegal Dismissal",
  "Illegal Suspension",
  "Separation Pay",
  "Backwages",
  "Final Pay",
  "Money Claims",
  "Illegal Deduction",
  "Inspection",
  "Others",
] as const;

export const REMARK_OPTIONS = ["Settled", "Not Settled", "Others"] as const;

export const HANDLING_PERSONNEL_OPTIONS = [
  "ATTY. ELFJ",
  "ATTY. MBSA",
  "ATTY. GMBL",
  "PAR. MBE",
  "SEC. JSJ",
  "Others",
] as const;

export const STAGE_REMARKS_OPTIONS = [
  "Appealed by Respondent",
  "Appealed by Complainant",
  "Not Appealed",
  "Other",
] as const;

export const TOTAL_PAID_CATEGORY_OPTIONS = [
  "Judgment-Award-L",
  "Judgment-Award-W",
  "Settlement",
] as const;

export const STAGE_STATUS_OPTIONS = [
  "Valid Dismissal",
  "Illegal Dismissal",
  "Convicted",
  "Acquitted",
  "Dismissed",
  "Affirmed",
  "Pending",
  "Closed",
  "Execution",
] as const;

export const TABLE_COLUMN_COUNT = 35;

// Placeholder for the logged-in user. Wire this to your auth store
// (e.g. useAuthStore) once available so "Created By" reflects the real user.
export const CURRENT_USER = "Current User";

export const DEFAULT_EDIT_RESTRICTIONS: EditRestrictions = {
  restrictSenaEditing: false,
  restrictSenaRemarksEditing: false,
  restrictLaDetailsEditing: false,
  restrictLaProgressOnly: false,
  restrictLaProgressEditing: false,
  restrictNlrcDetailsEditing: false,
  restrictNlrcProgressOnly: false,
  restrictNlrcProgressEditing: false,
  restrictCaDetailsEditing: false,
  restrictCaProgressOnly: false,
  restrictCaProgressEditing: false,
};

export const EMPTY_CASE: CaseDraft = {
  company: "",
  status: "Pending",
  date: "",
  caseTitle: "",
  caseNo: "",
  complainants: [""],
  venue: "",
  handlingPersonnel: "",
  handlingPersonnelSpecification: "",
  cause: [],
  causeSpecification: "",
  filingDate: "",
  remarks: "",
  remarkSpecification: "",
  la: { date: "", status: "", judgmentAward: "", judgmentAwardSpecification: "", remarks: "", remarksSpecification: "" },
  nlrc: { date: "", status: "", judgmentAward: "", judgmentAwardSpecification: "", remarks: "", remarksSpecification: "" },
  ca: { date: "", status: "", judgmentAward: "", judgmentAwardSpecification: "", remarks: "", remarksSpecification: "" },
  sc: { date: "", status: "", judgmentAward: "", judgmentAwardSpecification: "", remarks: "", remarksSpecification: "" },
  totalPaid: { amount: "", category: "" },
  caseProgress: {
    la: "",
    nlrc: "",
    ca: "",
    sc: "",
    laSpecification: "",
    nlrcSpecification: "",
    caSpecification: "",
    scSpecification: "",
  },
  createdBy: "",
  createdAt: "",
  closed: false,
  archived: false,
};