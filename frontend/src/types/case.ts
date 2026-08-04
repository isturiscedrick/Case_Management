export type CaseStatus = "Filed" | "Pending" | "Execution" | "Closed";
export type StageProgress = "" | "Settled" | "Not Settled" | "Others";

export interface LaInfo {
  date: string;
  status: string;
  judgementReward: string;
  // Manual entry required when judgementReward === "To be computed".
  judgementRewardSpecification?: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface NlrcInfo {
  date: string;
  status: string;
  judgementReward: string;
  judgementRewardSpecification?: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface CaInfo {
  date: string;
  status: string;
  judgementReward: string;
  judgementRewardSpecification?: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface ScInfo {
  date: string;
  status: string;
  judgementReward: string;
  judgementRewardSpecification?: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface CaseProgress {
  la: StageProgress;
  nlrc: StageProgress;
  ca: StageProgress;
  sc: StageProgress;
  laSpecification?: string;
  nlrcSpecification?: string;
  caSpecification?: string;
  scSpecification?: string;
}

export type TotalPaidCategory =
  | "Judgement-Award-L"
  | "Judgement-Award-W"
  | "Settlement";

export interface TotalPaidInfo {
  amount: string;
  category: TotalPaidCategory | "";
}

export interface CaseItem {
  id: number;
  company: string;
  status: CaseStatus;
  date: string;
  caseTitle: string;
  caseNo: string;
  complainants: string[];
  venue: string;

  // NEW FIELD — handling personnel selected in SEnA, next to Venue.
  // Optional so existing data/mocks without this field still type-check.
  handlingPersonnel?: string;
  handlingPersonnelSpecification?: string;

  // CHANGED: cause is now an array to support multiple selections.
  cause: string[];
  causeSpecification?: string;
  filingDate: string;
  remarks: string;
  remarkSpecification?: string;

  la: LaInfo;
  nlrc: NlrcInfo;
  ca: CaInfo;
  sc: ScInfo;

  // NEW COLUMN
  totalPaid: TotalPaidInfo;

  caseProgress: CaseProgress;

  createdBy: string;
  createdAt: string;
  archived: boolean;
}

export type CaseDraft = Omit<CaseItem, "id">;

export type ModalType = "create" | "view" | "edit" | null;