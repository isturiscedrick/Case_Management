export type CaseStatus = "Filed" | "Pending" | "Closed";
export type StageProgress = "Not Started" | "Pending" | "Completed";

export interface LaInfo {
  date: string;
  status: string;
  judgementReward: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface NlrcInfo {
  date: string;
  status: string;
  judgementReward: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface CaInfo {
  date: string;
  status: string;
  judgementReward: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface ScInfo {
  date: string;
  status: string;
  judgementReward: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface CaseProgress {
  la: StageProgress;
  nlrc: StageProgress;
  ca: StageProgress;
  sc: StageProgress;
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
  cause: string;
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