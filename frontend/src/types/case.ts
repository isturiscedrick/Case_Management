export type CaseStatus = "Filed" | "Pending" | "Execution" | "Closed";
export type StageProgress = "" | "Settled" | "Not Settled" | "Others";

export interface LaInfo {
  date: string;
  status: string;
  judgmentAward: string;
  judgmentAwardSpecification?: string;
  judgmentAwardComputedSpecification?: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface NlrcInfo {
  date: string;
  status: string;
  judgmentAward: string;
  judgmentAwardSpecification?: string;
  judgmentAwardComputedSpecification?: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface CaInfo {
  date: string;
  status: string;
  judgmentAward: string;
  judgmentAwardSpecification?: string;
  judgmentAwardComputedSpecification?: string;
  remarks: string;
  remarksSpecification?: string;
}

export interface ScInfo {
  date: string;
  status: string;
  judgmentAward: string;
  judgmentAwardSpecification?: string;
  judgmentAwardComputedSpecification?: string;
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
  | "Judgment-Award-L"
  | "Judgment-Award-W"
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

  // NEW FIELDS — who last modified the case and when. Optional so existing
  // data/mocks that predate this change still type-check; a case that has
  // never been edited since creation simply won't have these set. The
  // actual save/submit handler is responsible for populating these on
  // every update (not covered by this file).
  updatedBy?: string;
  updatedAt?: string;

  // Set true when "Close Case" is used in the form. Purely a lock flag —
  // does not affect status, remarks, or any stage's data.
  closed?: boolean;
  // ISO date ("YYYY-MM-DD") when "Close Case" was confirmed. Only set
  // alongside closed=true; used for the Closed Date range filter.
  closedDate?: string;

  archived: boolean;
}

export type CaseDraft = Omit<CaseItem, "id">;

export type ModalType = "create" | "view" | "edit" | null;

export type EditRestrictions = {
  restrictSenaEditing: boolean;
  restrictSenaRemarksEditing: boolean;
  restrictLaDetailsEditing: boolean;
  restrictLaProgressOnly: boolean;
  restrictLaProgressEditing: boolean;
  restrictNlrcDetailsEditing: boolean;
  restrictNlrcProgressOnly: boolean;
  restrictNlrcProgressEditing: boolean;
  restrictCaDetailsEditing: boolean;
  restrictCaProgressOnly: boolean;
  restrictCaProgressEditing: boolean;
};