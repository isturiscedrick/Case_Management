import type {
  CaseDraft,
  LaInfo,
  NlrcInfo,
  CaInfo,
  ScInfo,
} from "@/types/case";

type StageInfo = LaInfo | NlrcInfo | CaInfo | ScInfo;

const TO_BE_COMPUTED = "To be computed";

function isStageFilled(stage: StageInfo): boolean {
  const isComputed = stage.judgmentAward.trim() === TO_BE_COMPUTED;

  const judgmentAwardSpecFilled = isComputed
    ? (stage.judgmentAwardComputedSpecification ?? "").trim() !== ""
    : (stage.judgmentAwardSpecification ?? "").trim() !== "";

  return (
    stage.date.trim() !== "" &&
    stage.status.trim() !== "" &&
    stage.judgmentAward.trim() !== "" &&
    judgmentAwardSpecFilled &&
    stage.remarks.trim() !== "" &&
    (stage.remarks !== "Other" ||
      (stage.remarksSpecification ?? "").trim() !== "")
  );
}

function isStageStarted(
  stage: StageInfo,
  progress: string,
  progressSpecification?: string
): boolean {
  return (
    stage.date.trim() !== "" ||
    stage.status.trim() !== "" ||
    stage.judgmentAward.trim() !== "" ||
    (stage.judgmentAwardSpecification ?? "").trim() !== "" ||
    (stage.judgmentAwardComputedSpecification ?? "").trim() !== "" ||
    stage.remarks.trim() !== "" ||
    (stage.remarksSpecification ?? "").trim() !== "" ||
    progress.trim() !== "" ||
    (progressSpecification ?? "").trim() !== ""
  );
}

function canProceedFromProgress(
  progress: string,
  specification: string | undefined
): boolean {
  return (
    (progress === "Not Settled" || progress === "Others") &&
    (specification ?? "").trim() !== ""
  );
}

export function getStageGates(draft: CaseDraft) {

  const senaFilled =
    draft.company.trim() !== "" &&
    draft.caseTitle.trim() !== "" &&
    draft.caseNo.trim() !== "" &&
    draft.complainants.every((c) => c.trim() !== "") &&
    draft.venue.trim() !== "" &&
    (draft.handlingPersonnel ?? "").trim() !== "" &&
    (draft.handlingPersonnel !== "Others" ||
      (draft.handlingPersonnelSpecification ?? "").trim() !== "") &&
    draft.cause.length > 0 &&
    (!draft.cause.includes("Others") ||
      (draft.causeSpecification ?? "").trim() !== "") &&
    draft.filingDate.trim() !== "";

  const laEnabled =
    senaFilled &&
    (draft.remarks === "Not Settled" || draft.remarks === "Others") &&
    (draft.remarkSpecification ?? "").trim() !== "";

  const laFilled = isStageFilled(draft.la);

  const laRequired = false;

  const nlrcEnabled =
    laFilled &&
    canProceedFromProgress(
      draft.caseProgress.la,
      draft.caseProgress.laSpecification
    );

  const nlrcFilled = isStageFilled(draft.nlrc);

  const caEnabled =
    nlrcFilled &&
    canProceedFromProgress(
      draft.caseProgress.nlrc,
      draft.caseProgress.nlrcSpecification
    );

  const caFilled = isStageFilled(draft.ca);

  const scEnabled =
    caFilled &&
    canProceedFromProgress(
      draft.caseProgress.ca,
      draft.caseProgress.caSpecification
    );

  const scFilled = isStageFilled(draft.sc);

  return {
    senaFilled,

    laEnabled,
    laRequired,
    laFilled,

    nlrcEnabled,
    nlrcFilled,

    caEnabled,
    caFilled,

    scEnabled,
    scFilled,
  };
}

export function getCaseDraftErrors(draft: CaseDraft): string[] {
  const errors: string[] = [];

  const gates = getStageGates(draft);

  if (!gates.senaFilled) {
    errors.push(
      "Complete all SEnA fields (Company, Status, Case Title, Case No., Complainants, Venue, Handling Personnel, Cause of Action, Filing Date). Remarks is optional."
    );

    return errors;
  }

  if (
    (draft.remarks === "Not Settled" || draft.remarks === "Others") &&
    (draft.remarkSpecification ?? "").trim() === ""
  ) {
    errors.push(
      'Specify Remarks is required when SEnA Remarks is "Not Settled" or "Others".'
    );
  }

  if (
    isStageStarted(
      draft.la,
      draft.caseProgress.la,
      draft.caseProgress.laSpecification
    ) &&
    !gates.laFilled
  ) {
    errors.push(
      "Complete all required LA fields before saving changes."
    );
  }

  if (
    gates.laFilled &&
    (draft.caseProgress.la === "Not Settled" ||
      draft.caseProgress.la === "Others") &&
    (draft.caseProgress.laSpecification ?? "").trim() === ""
  ) {
    errors.push(
      'Specify LA Progress is required when LA Progress is "Not Settled" or "Others".'
    );
  }

  if (
    isStageStarted(
      draft.nlrc,
      draft.caseProgress.nlrc,
      draft.caseProgress.nlrcSpecification
    ) &&
    !gates.nlrcFilled
  ) {
    errors.push(
      "Complete all required NLRC fields before saving changes."
    );
  }

  if (
    gates.nlrcFilled &&
    (draft.caseProgress.nlrc === "Not Settled" ||
      draft.caseProgress.nlrc === "Others") &&
    (draft.caseProgress.nlrcSpecification ?? "").trim() === ""
  ) {
    errors.push(
      'Specify NLRC Progress is required when NLRC Progress is "Not Settled" or "Others".'
    );
  }

  if (
    isStageStarted(
      draft.ca,
      draft.caseProgress.ca,
      draft.caseProgress.caSpecification
    ) &&
    !gates.caFilled
  ) {
    errors.push(
      "Complete all required CA fields before saving changes."
    );
  }

  if (
    gates.caFilled &&
    (draft.caseProgress.ca === "Not Settled" ||
      draft.caseProgress.ca === "Others") &&
    (draft.caseProgress.caSpecification ?? "").trim() === ""
  ) {
    errors.push(
      'Specify CA Progress is required when CA Progress is "Not Settled" or "Others".'
    );
  }

  if (
  isStageStarted(
    draft.sc,
    draft.caseProgress.sc,
    draft.caseProgress.scSpecification
  ) &&
  !gates.scFilled
) {
  errors.push(
    "Complete all required SC fields before saving changes."
  );
}

  if (
  draft.caseProgress.sc === "Not Settled" ||
  draft.caseProgress.sc === "Others"
) {
  if ((draft.caseProgress.scSpecification ?? "").trim() === "") {
  errors.push(
    'Specify SC Progress is required when SC Progress is "Not Settled" or "Others".'
  );
}
}

  const anyStageSettled =
    draft.remarks === "Settled" ||
    draft.caseProgress.la === "Settled" ||
    draft.caseProgress.nlrc === "Settled" ||
    draft.caseProgress.ca === "Settled" ||
    draft.caseProgress.sc === "Settled";

  if (anyStageSettled && !draft.totalPaid.category) {
    errors.push(
      "Category is required when SEnA Remarks or any stage Progress is Settled."
    );
  }

  return errors;
}

export function isCaseDraftValid(draft: CaseDraft): boolean {
  return getCaseDraftErrors(draft).length === 0;
}