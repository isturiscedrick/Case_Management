import type { CaseStatus, StageProgress, CaseDraft } from "@/types/case";
export const STATUS_OPTIONS: Array<"All" | CaseStatus> = ["All", "Filed", "Pending", "Closed"];

export const PROGRESS_OPTIONS: Array<"All" | StageProgress> = [
  "All",
  "Settled",
  "Not Settled",
  "Others",
];

export const STATUS_STYLES: Record<CaseStatus, { badge: string; dot: string }> = {
  Filed: { badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  Pending: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  Closed: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
};

export const DEFAULT_STATUS_STYLE = {
  badge: "bg-slate-100 text-slate-700 ring-slate-200",
  dot: "bg-slate-400",
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

export const STAGE_REMARKS_OPTIONS = [
  "Appealed by Respondent",
  "Appealed by Complainant",
  "Not Appealed",
  "Other",
] as const;

export const TOTAL_PAID_CATEGORY_OPTIONS = [
  "Judgement-Award-L",
  "Judgement-Award-W",
  "Settlement",
] as const;

export const STAGE_STATUS_OPTIONS = [
  "Valid Dismissal",
  "Illegal Dismissal",
  "Convicted",
  "Acquitted",
  "Dismissed",
  "Affirmed",
] as const;

export const TABLE_COLUMN_COUNT = 28;

// Placeholder for the logged-in user. Wire this to your auth store
// (e.g. useAuthStore) once available so "Created By" reflects the real user.
export const CURRENT_USER = "Current User";

export const EMPTY_CASE: CaseDraft = {
  company: "",
  status: "Filed",
  date: "",
  caseTitle: "",
  caseNo: "",
  complainants: [""],
  venue: "",
  cause: "",
  causeSpecification: "",
  filingDate: "",
  remarks: "",
  remarkSpecification: "",
  la: { date: "", status: "", judgementReward: "", remarks: "", remarksSpecification: "" },
  nlrc: { date: "", status: "", judgementReward: "", remarks: "", remarksSpecification: "" },
  ca: { date: "", status: "", judgementReward: "", remarks: "", remarksSpecification: "" },
  sc: { date: "", status: "", judgementReward: "", remarks: "", remarksSpecification: "" },
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
  archived: false,
};
