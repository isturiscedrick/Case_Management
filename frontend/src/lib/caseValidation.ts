import type {
  CaseDraft,
  LaInfo,
  NlrcInfo,
  CaInfo,
  ScInfo,
} from "@/types/case";

type StageInfo = LaInfo | NlrcInfo | CaInfo | ScInfo;

const TO_BE_COMPUTED = "To be computed";

/**
 * Checks whether all required fields in a stage are completed.
 */
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

/**
 * Determines whether the next stage can be shown.
 *
 * The current stage must have Progress:
 *
 * - Not Settled
 * - Others
 *
 * and its Specify field must be completed.
 */
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
  // =========================================================
  // SEnA
  // =========================================================

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

  // =========================================================
  // LA
  // =========================================================

  /**
   * LA is shown when SEnA Remarks is Not Settled or Others
   * and the Remarks Specify field is completed.
   *
   * LA being shown does NOT make LA required.
   */
  const laEnabled =
    senaFilled &&
    (draft.remarks === "Not Settled" || draft.remarks === "Others") &&
    (draft.remarkSpecification ?? "").trim() !== "";

  const laFilled = isStageFilled(draft.la);

  /**
   * Kept for compatibility with existing components.
   *
   * LA is NOT automatically required during creation/update.
   */
  const laRequired = false;

  // =========================================================
  // NLRC
  // =========================================================

  /**
   * NLRC is shown only after LA has been completed
   * and LA Progress allows moving forward.
   */
  const nlrcEnabled =
    laFilled &&
    canProceedFromProgress(
      draft.caseProgress.la,
      draft.caseProgress.laSpecification
    );

  const nlrcFilled = isStageFilled(draft.nlrc);

  // =========================================================
  // CA
  // =========================================================

  /**
   * CA is shown only after NLRC has been completed
   * and NLRC Progress allows moving forward.
   */
  const caEnabled =
    nlrcFilled &&
    canProceedFromProgress(
      draft.caseProgress.nlrc,
      draft.caseProgress.nlrcSpecification
    );

  const caFilled = isStageFilled(draft.ca);

  // =========================================================
  // SC
  // =========================================================

  /**
   * SC is shown only after CA has been completed
   * and CA Progress allows moving forward.
   */
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

/**
 * Validates the case before Save Changes.
 *
 * Rules:
 *
 * 1. A visible stage can remain completely empty.
 *
 * 2. If the user starts a stage by filling ANY field,
 *    that stage must be completed before saving.
 *
 * 3. Selecting ONLY Progress also counts as starting
 *    the stage.
 *
 * 4. Progress Specify is required when Progress is
 *    Not Settled or Others.
 */
export function getCaseDraftErrors(draft: CaseDraft): string[] {
  const errors: string[] = [];

  const gates = getStageGates(draft);

  // =========================================================
  // SEnA
  // =========================================================

  if (!gates.senaFilled) {
    errors.push(
      "Complete all SEnA fields (Company, Status, Case Title, Case No., Complainants, Venue, Handling Personnel, Cause of Action, Filing Date). Remarks is optional."
    );

    return errors;
  }

  // =========================================================
  // SEnA Remarks
  // =========================================================

  /**
   * SEnA Remarks itself can be optional.
   *
   * However, if Remarks is Not Settled or Others,
   * the Specify field is required.
   */
  if (
    (draft.remarks === "Not Settled" || draft.remarks === "Others") &&
    (draft.remarkSpecification ?? "").trim() === ""
  ) {
    errors.push(
      'Specify Remarks is required when SEnA Remarks is "Not Settled" or "Others".'
    );
  }

  // =========================================================
  // LA
  // =========================================================

  /**
   * LA is optional when completely untouched.
   *
   * If the user fills ANY LA field OR selects LA Progress,
   * all required LA fields must be completed.
   */
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

  /**
   * LA Progress Specify.
   */
  if (
    draft.caseProgress.la === "Not Settled" ||
    draft.caseProgress.la === "Others"
  ) {
    if ((draft.caseProgress.laSpecification ?? "").trim() === "") {
      errors.push(
        'Specify LA Progress is required when LA Progress is "Not Settled" or "Others".'
      );
    }
  }

  // =========================================================
  // NLRC
  // =========================================================

  /**
   * NLRC is optional when completely untouched.
   *
   * If the user fills ANY NLRC field OR selects NLRC Progress,
   * all required NLRC fields must be completed.
   */
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

  /**
   * NLRC Progress Specify.
   */
  if (
    draft.caseProgress.nlrc === "Not Settled" ||
    draft.caseProgress.nlrc === "Others"
  ) {
    if ((draft.caseProgress.nlrcSpecification ?? "").trim() === "") {
      errors.push(
        'Specify NLRC Progress is required when NLRC Progress is "Not Settled" or "Others".'
      );
    }
  }

  // =========================================================
  // CA
  // =========================================================

  /**
   * CA is optional when completely untouched.
   *
   * If the user fills ANY CA field OR selects CA Progress,
   * all required CA fields must be completed.
   */
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

  /**
   * CA Progress Specify.
   */
  if (
    draft.caseProgress.ca === "Not Settled" ||
    draft.caseProgress.ca === "Others"
  ) {
    if ((draft.caseProgress.caSpecification ?? "").trim() === "") {
      errors.push(
        'Specify CA Progress is required when CA Progress is "Not Settled" or "Others".'
      );
    }
  }

  // =========================================================
  // SC
  // =========================================================

  /**
   * SC is optional when completely untouched.
   *
   * If the user fills ANY SC field OR selects SC Progress,
   * all required SC fields must be completed.
   */
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

  /**
   * SC Progress Specify.
   *
   * This is required when SC Progress is:
   *
   * - Not Settled
   * - Others
   */
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

  // =========================================================
  // Category
  // =========================================================

  /**
   * Category is required once the case has actually
   * been settled at SEnA or any subsequent stage.
   */
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

/**
 * Convenience boolean for disabling a submit button, etc.
 */
export function isCaseDraftValid(draft: CaseDraft): boolean {
  return getCaseDraftErrors(draft).length === 0;
}