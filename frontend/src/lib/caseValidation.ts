import type { CaseDraft, LaInfo, NlrcInfo, CaInfo, ScInfo } from "@/types/case";

type StageInfo = LaInfo | NlrcInfo | CaInfo | ScInfo;

// A stage (LA/NLRC/CA/SC) is "filled" when its required fields are set.
// Progress is intentionally excluded — it's always optional.
function isStageFilled(stage: StageInfo): boolean {
  return (
    stage.date.trim() !== "" &&
    stage.status.trim() !== "" &&
    stage.judgementReward.trim() !== "" &&
    stage.remarks.trim() !== "" &&
    (stage.remarks !== "Other" || (stage.remarksSpecification ?? "").trim() !== "")
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
    draft.cause.trim() !== "" &&
    (draft.cause !== "Others" || (draft.causeSpecification ?? "").trim() !== "") &&
    draft.filingDate.trim() !== "";

  // LA is enabled ONLY when Remarks is explicitly "Not Settled" or
  // "Others" — for the default "Select Remarks" or "Settled", LA stays
  // disabled (and, since it's disabled, it's not required either — the
  // case can still be created without touching LA in that scenario).
  const laEnabled = senaFilled && (draft.remarks === "Not Settled" || draft.remarks === "Others");
  const laFilled = isStageFilled(draft.la);

  // LA is required to submit whenever it's enabled.
  const laRequired = laEnabled;

  const nlrcEnabled =
    laRequired &&
    laFilled &&
    (draft.caseProgress.la === "Not Settled" || draft.caseProgress.la === "Others");
  const nlrcFilled = isStageFilled(draft.nlrc);

  const caEnabled =
    nlrcEnabled &&
    nlrcFilled &&
    (draft.caseProgress.nlrc === "Not Settled" || draft.caseProgress.nlrc === "Others");
  const caFilled = isStageFilled(draft.ca);

  const scEnabled =
    caEnabled &&
    caFilled &&
    (draft.caseProgress.ca === "Not Settled" || draft.caseProgress.ca === "Others");
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

  if (gates.caEnabled && !gates.caFilled) {
    errors.push("Complete all Court of Appeals (CA) fields (CA Progress is optional).");
  }

  if (gates.scEnabled && !gates.scFilled) {
    errors.push("Complete all Supreme Court (SC) fields (SC Progress is optional).");
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