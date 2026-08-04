import type { CaseDraft, LaInfo, NlrcInfo, CaInfo, ScInfo } from "@/types/case";

type StageInfo = LaInfo | NlrcInfo | CaInfo | ScInfo;

const TO_BE_COMPUTED = "To be computed";

// A stage (LA/NLRC/CA/SC) is "filled" when its required fields are set.
// Progress is intentionally excluded — it's always optional, EXCEPT that
// whenever Progress is "Not Settled" or "Others", its own Specify text is
// required before the NEXT stage unlocks (handled separately below, since
// that's a cross-stage gate rather than a same-stage completeness check).
function isStageFilled(stage: StageInfo): boolean {
  // Judgement Reward has two mutually exclusive manual-entry fields
  // depending on mode: judgementRewardSpecification when it's a numeric
  // "Amount", judgementRewardComputedSpecification when it's "To be
  // computed". Only the one matching the current mode is required.
  const isComputed = stage.judgementReward.trim() === TO_BE_COMPUTED;
  const judgementRewardSpecFilled = isComputed
    ? (stage.judgementRewardComputedSpecification ?? "").trim() !== ""
    : (stage.judgementRewardSpecification ?? "").trim() !== "";

  return (
    stage.date.trim() !== "" &&
    stage.status.trim() !== "" &&
    stage.judgementReward.trim() !== "" &&
    judgementRewardSpecFilled &&
    stage.remarks.trim() !== "" &&
    (stage.remarks !== "Other" || (stage.remarksSpecification ?? "").trim() !== "")
  );
}

// A stage's Progress permits moving on to the next stage only when it's
// "Not Settled" or "Others" AND its Specify text is filled in — mirrors
// the SEnA Remarks -> LA gate, applied one stage down each time.
function canProceedFromProgress(progress: string, specification: string | undefined): boolean {
  return (
    (progress === "Not Settled" || progress === "Others") &&
    (specification ?? "").trim() !== ""
  );
}

// Computes, for a given CaseDraft, whether SEnA is complete and whether
// each subsequent stage is unlocked ("enabled") and/or filled in.
// Mirrors the exact same rules used inline in CaseForm.tsx.
export function getStageGates(draft: CaseDraft) {
  // SEnA is "complete" once every field except Remarks is filled in.
  // Remarks is NOT required to create a case — it only decides whether
  // the case needs to escalate past SEnA (see laRequired below).
  const senaFilled =
    draft.company.trim() !== "" &&
    draft.caseTitle.trim() !== "" &&
    draft.caseNo.trim() !== "" &&
    draft.complainants.every((c) => c.trim() !== "") &&
    draft.venue.trim() !== "" &&
    (draft.handlingPersonnel ?? "").trim() !== "" &&
    (draft.handlingPersonnel !== "Others" || (draft.handlingPersonnelSpecification ?? "").trim() !== "") &&
    draft.cause.length > 0 &&
    (!draft.cause.includes("Others") || (draft.causeSpecification ?? "").trim() !== "") &&
    draft.filingDate.trim() !== "";

  // LA is enabled ONLY when Remarks is explicitly "Not Settled" or
  // "Others" AND its Specify field is filled in — for the default
  // "Select Remarks" or "Settled", or an unfilled Specify, LA stays
  // disabled (and, since it's disabled, it's not required either — the
  // case can still be created without touching LA in that scenario).
  const laEnabled =
    senaFilled &&
    (draft.remarks === "Not Settled" || draft.remarks === "Others") &&
    (draft.remarkSpecification ?? "").trim() !== "";
  const laFilled = isStageFilled(draft.la);

  // LA is required to submit whenever it's enabled.
  const laRequired = laEnabled;

  // NLRC unlocks only once LA Progress is "Not Settled"/"Others" AND its
  // Specify text is filled in — a bare Progress selection isn't enough.
  const nlrcEnabled =
    laRequired &&
    laFilled &&
    canProceedFromProgress(draft.caseProgress.la, draft.caseProgress.laSpecification);
  const nlrcFilled = isStageFilled(draft.nlrc);

  const caEnabled =
    nlrcEnabled &&
    nlrcFilled &&
    canProceedFromProgress(draft.caseProgress.nlrc, draft.caseProgress.nlrcSpecification);
  const caFilled = isStageFilled(draft.ca);

  const scEnabled =
    caEnabled &&
    caFilled &&
    canProceedFromProgress(draft.caseProgress.ca, draft.caseProgress.caSpecification);
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

// Returns a list of human-readable reasons the draft can't be submitted
// yet. Empty array means the draft is valid and the case can be created.
export function getCaseDraftErrors(draft: CaseDraft): string[] {
  const gates = getStageGates(draft);
  const errors: string[] = [];

  if (!gates.senaFilled) {
    errors.push(
      "Complete all SEnA fields (Company, Status, Case Title, Case No., Complainants, Venue, Handling Personnel, Cause of Action, Filing Date). Remarks is optional."
    );
    // Nothing past SEnA can be required yet, so stop here.
    return errors;
  }

  if (gates.laRequired && !gates.laFilled) {
    errors.push(
      'SEnA Remarks is "Not Settled" or "Others" — complete all Labor Arbiter (LA) fields (LA Progress is optional).'
    );
  }

  // Remarks itself stays optional, but once it's set to "Not Settled" or
  // "Others" its Specify field is required — mirrors the Cause of Action
  // "Others" requirement above.
  if (
    (draft.remarks === "Not Settled" || draft.remarks === "Others") &&
    (draft.remarkSpecification ?? "").trim() === ""
  ) {
    errors.push('Specify Remarks is required when SEnA Remarks is "Not Settled" or "Others".');
  }

  if (gates.nlrcEnabled && !gates.nlrcFilled) {
    errors.push("Complete all NLRC fields (NLRC Progress is optional).");
  }

  // Each stage's Progress Specify text is required once Progress is
  // "Not Settled" or "Others" — even though the field is technically
  // optional in the sense that Progress itself doesn't have to be set,
  // once it IS set to one of these values the Specify text becomes
  // mandatory before the next stage can unlock.
  if (
    gates.laFilled &&
    (draft.caseProgress.la === "Not Settled" || draft.caseProgress.la === "Others") &&
    (draft.caseProgress.laSpecification ?? "").trim() === ""
  ) {
    errors.push('Specify LA Progress is required when LA Progress is "Not Settled" or "Others".');
  }

  if (gates.caEnabled && !gates.caFilled) {
    errors.push("Complete all Court of Appeals (CA) fields (CA Progress is optional).");
  }

  if (
    gates.nlrcFilled &&
    (draft.caseProgress.nlrc === "Not Settled" || draft.caseProgress.nlrc === "Others") &&
    (draft.caseProgress.nlrcSpecification ?? "").trim() === ""
  ) {
    errors.push('Specify NLRC Progress is required when NLRC Progress is "Not Settled" or "Others".');
  }

  if (gates.scEnabled && !gates.scFilled) {
    errors.push("Complete all Supreme Court (SC) fields (SC Progress is optional).");
  }

  if (
    gates.caFilled &&
    (draft.caseProgress.ca === "Not Settled" || draft.caseProgress.ca === "Others") &&
    (draft.caseProgress.caSpecification ?? "").trim() === ""
  ) {
    errors.push('Specify CA Progress is required when CA Progress is "Not Settled" or "Others".');
  }

  // Category reflects how the case was resolved once it's actually
  // "Settled" somewhere — require it in that case.
  const anyStageSettled =
    draft.remarks === "Settled" ||
    draft.caseProgress.la === "Settled" ||
    draft.caseProgress.nlrc === "Settled" ||
    draft.caseProgress.ca === "Settled" ||
    draft.caseProgress.sc === "Settled";

  if (anyStageSettled && !draft.totalPaid.category) {
    errors.push('Category is required when SEnA Remarks or any stage Progress is "Settled".');
  }

  return errors;
}

// Convenience boolean for disabling a submit button, etc.
export function isCaseDraftValid(draft: CaseDraft): boolean {
  return getCaseDraftErrors(draft).length === 0;
}