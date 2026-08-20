import { Ban, Lock, Unlock, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  CaseDraft,
  LaInfo,
  NlrcInfo,
  CaInfo,
  ScInfo,
  TotalPaidCategory,
  StageProgress,
} from "@/types/case";

import { SenaSection } from "./sections/SenaSection";
import { LaSection } from "./sections/LaSection";
import { NlrcSection } from "./sections/NlrcSection";
import { CaSection } from "./sections/CaSection";
import { ScSection } from "./sections/ScSection";
import { TotalJudgmentAwardSection } from "./sections/TotalJudgmentAwardSection";

import {
  StageStepper,
  type StageStep,
} from "./shared/StageStepper";
import { getStageGates, isStageFilled } from "@/lib/caseValidation";
import { getTotalJudgmentAward } from "@/lib/caseHelpers";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

// Wizard steps. "review" is the existing Total Judgment Award section,
// which was previously always rendered unconditionally below SC — it's
// now its own step instead of always being on-screen.
type WizardStep = "sena" | "la" | "nlrc" | "ca" | "sc" | "review";
const STEP_ORDER: WizardStep[] = ["sena", "la", "nlrc", "ca", "sc", "review"];

export function CaseForm({
  value,
  onChange,
  companies,
  restrictSenaEditing = false,
  restrictSenaRemarksEditing = false,
  restrictLaDetailsEditing = false,
  restrictLaProgressOnly = false,
  restrictLaProgressEditing = false,
  restrictNlrcDetailsEditing = false,
  restrictNlrcProgressOnly = false,
  restrictNlrcProgressEditing = false,
  restrictCaDetailsEditing = false,
  restrictCaProgressOnly = false,
  restrictCaProgressEditing = false,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  companies: string[];
  restrictSenaEditing?: boolean;
  restrictSenaRemarksEditing?: boolean;
  restrictLaDetailsEditing?: boolean;
  restrictLaProgressOnly?: boolean;
  restrictLaProgressEditing?: boolean;
  restrictNlrcDetailsEditing?: boolean;
  restrictNlrcProgressOnly?: boolean;
  restrictNlrcProgressEditing?: boolean;
  restrictCaDetailsEditing?: boolean;
  restrictCaProgressOnly?: boolean;
  restrictCaProgressEditing?: boolean;
}) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Central guard: whenever the draft changes, if no stage is settled
  // anymore, the Total Judgment Award category must not remain set.
  // This catches every path that can un-settle a stage (SEnA remarks,
  // LA/NLRC/CA/SC progress dropdowns, or any future one) without each
  // section's onChange needing its own bespoke reset logic. All setters
  // in this file, and every onChange passed down to a stage section,
  // route through this instead of calling the raw onChange prop directly.
  const guardedOnChange = (next: CaseDraft) => {
    const nextAnyStageSettled =
      next.remarks === "Settled" ||
      next.caseProgress.la === "Settled" ||
      next.caseProgress.nlrc === "Settled" ||
      next.caseProgress.ca === "Settled" ||
      next.caseProgress.sc === "Settled";

    if (!nextAnyStageSettled && next.totalPaid.category) {
      onChange({
        ...next,
        totalPaid: { ...next.totalPaid, category: "" },
      });
      return;
    }

    onChange(next);
  };

  const setTop = <K extends keyof CaseDraft>(key: K, v: CaseDraft[K]) => {
    guardedOnChange({ ...value, [key]: v });
  };
  const setLa = <K extends keyof LaInfo>(key: K, v: LaInfo[K]) => {
    guardedOnChange({ ...value, la: { ...value.la, [key]: v } });
  };
  const setNlrc = <K extends keyof NlrcInfo>(key: K, v: NlrcInfo[K]) => {
    guardedOnChange({ ...value, nlrc: { ...value.nlrc, [key]: v } });
  };
  const setCa = <K extends keyof CaInfo>(key: K, v: CaInfo[K]) => {
    guardedOnChange({ ...value, ca: { ...value.ca, [key]: v } });
  };
  const setSc = <K extends keyof ScInfo>(key: K, v: ScInfo[K]) => {
    guardedOnChange({ ...value, sc: { ...value.sc, [key]: v } });
  };
  const setTotalPaidCategory = (category: TotalPaidCategory | "") => {
    guardedOnChange({
      ...value,
      totalPaid: { ...value.totalPaid, category },
    });
  };

  const setProgress = (key: "la" | "nlrc" | "ca" | "sc", v: StageProgress) => {
    const specKey = `${key}Specification` as const;
    guardedOnChange({
      ...value,
      caseProgress: {
        ...value.caseProgress,
        [key]: v,
        ...(v === "Others" || v === "Not Settled" ? {} : { [specKey]: "" }),
      },
    });
  };

  const setProgressSpecification = (key: "la" | "nlrc" | "ca" | "sc", v: string) => {
    const specKey = `${key}Specification` as const;
    guardedOnChange({
      ...value,
      caseProgress: {
        ...value.caseProgress,
        [specKey]: v,
      },
    });
  };

  // --- Unchanged gating logic (same source of truth as before) ----------
  const {
    senaFilled,
    laEnabled,
    laRequired,
    laFilled,
    nlrcEnabled,
    nlrcFilled,
    caEnabled,
    caFilled,
    scEnabled,
  } = getStageGates(value);
  const totalJudgmentAward = getTotalJudgmentAward(value);
  const canProceedPastLa = value.caseProgress.la === "Not Settled" || value.caseProgress.la === "Others";
  const canProceedPastNlrc = value.caseProgress.nlrc === "Not Settled" || value.caseProgress.nlrc === "Others";
  const canProceedPastCa = value.caseProgress.ca === "Not Settled" || value.caseProgress.ca === "Others";

  const anyStageSettled =
    value.remarks === "Settled" ||
    value.caseProgress.la === "Settled" ||
    value.caseProgress.nlrc === "Settled" ||
    value.caseProgress.ca === "Settled" ||
    value.caseProgress.sc === "Settled";

  const laVisible = laEnabled;
  const nlrcVisible = nlrcEnabled && !(restrictLaProgressOnly && !canProceedPastLa);
  const caVisible =
    caEnabled &&
    !(restrictLaProgressOnly && !canProceedPastLa) &&
    !(restrictNlrcProgressOnly && !canProceedPastNlrc);
  const scVisible =
    scEnabled &&
    !(restrictLaProgressOnly && !canProceedPastLa) &&
    !(restrictNlrcProgressOnly && !canProceedPastNlrc) &&
    !(restrictCaProgressOnly && !canProceedPastCa);
  // -----------------------------------------------------------------------

  const stageSteps: StageStep[] = [
    { key: "sena", label: "SENA", status: senaFilled ? "done" : "current" },
    { key: "la", label: "LA", status: !laVisible ? "locked" : laFilled ? "done" : "current" },
    { key: "nlrc", label: "NLRC", status: !nlrcVisible ? "locked" : nlrcFilled ? "done" : "current" },
    { key: "ca", label: "CA", status: !caVisible ? "locked" : caFilled ? "done" : "current" },
    { key: "sc", label: "SC", status: !scVisible ? "locked" : "current" },
  ];

  // A step is reachable if its underlying section is currently visible
  // (same booleans used for inline rendering before), or "review" which
  // was always rendered regardless of stage completion previously.
  function isStepVisible(step: WizardStep): boolean {
    if (step === "sena") return true;
    if (step === "la") return laVisible;
    if (step === "nlrc") return nlrcVisible;
    if (step === "ca") return caVisible;
    if (step === "sc") return scVisible;
    return true; // review
  }

  // Default to the first not-yet-done visible step, so re-opening a
  // partially filled case lands the user where they left off.
  function computeInitialStep(): WizardStep {
    const firstIncomplete = stageSteps.find((s) => s.status !== "done" && s.status !== "locked");
    if (firstIncomplete) return firstIncomplete.key as WizardStep;
    return "review";
  }

  const [activeStep, setActiveStep] = useState<WizardStep>(computeInitialStep);
  const [maxReachedIndex, setMaxReachedIndex] = useState<number>(STEP_ORDER.indexOf(activeStep));

  // Clamp maxReachedIndex back down whenever a later stage's data gets reset
  // (e.g. SEnA remarks or an earlier stage's progress flips back to
  // "Not Settled"/"Others", cascading a reset through LA/NLRC/CA/SC).
  // Without this, visibleStageSteps keeps showing stale steps the header
  // already reset out from under, since maxReachedIndex only ever grows
  // via goToStep and nothing else ever pulls it back down.
  useEffect(() => {
    const highestVisibleIndex = STEP_ORDER.reduce(
      (acc, step, index) => (isStepVisible(step) ? index : acc),
      0
    );

    if (highestVisibleIndex < maxReachedIndex) {
      setMaxReachedIndex(highestVisibleIndex);

      if (STEP_ORDER.indexOf(activeStep) > highestVisibleIndex) {
        setActiveStep(STEP_ORDER[highestVisibleIndex]);
      }
    }
  }, [laVisible, nlrcVisible, caVisible, scVisible]);
  const isClosed = !!value.closed;
  const isSettled = !!value.totalPaid?.category;
  const isFieldsetLocked = isClosed || (isSettled && activeStep === "review");

  const visibleStageSteps = stageSteps.filter((s) => isStepVisible(s.key as WizardStep));

  function canGoToStep(step: WizardStep): boolean {
    return isStepVisible(step);
  }

  function goToStep(step: WizardStep) {
    if (!canGoToStep(step)) return;
    setActiveStep(step);
    const index = STEP_ORDER.indexOf(step);
    if (index > maxReachedIndex) setMaxReachedIndex(index);
  }

  const currentIndex = STEP_ORDER.indexOf(activeStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEP_ORDER.length - 1;

  // Dedicated completeness check for the wizard's Next button only — this
  // is stricter than Save's validation (getCaseDraftErrors /
  // isStageFilled in caseValidation.ts), which still treats Remarks and
  // Progress as optional. That Save-time rule is untouched; this function
  // adds nothing to it and lives only here, gating navigation, not saving.
  function isCurrentStageFullyFilled(): boolean {
    const remarksComplete =
      value.remarks.trim() !== "" &&
      (value.remarks !== "Others" && value.remarks !== "Not Settled"
        ? true
        : (value.remarkSpecification ?? "").trim() !== "");

    function progressComplete(progress: StageProgress, specification?: string) {
      return (
        progress.trim() !== "" &&
        (progress !== "Others" && progress !== "Not Settled"
          ? true
          : (specification ?? "").trim() !== "")
      );
    }

    if (activeStep === "sena") {
      const handlingPersonnelComplete =
        value.handlingPersonnel === "Others"
          ? (value.handlingPersonnelSpecification ?? "").trim() !== ""
          : (value.handlingPersonnel ?? "").trim() !== "";

      const causeComplete =
        value.cause.length > 0 &&
        (!value.cause.includes("Others") ||
          (value.causeSpecification ?? "").trim() !== "");

      const senaComplete =
        value.company.trim() !== "" &&
        value.status.trim() !== "" &&
        value.caseTitle.trim() !== "" &&
        value.caseNo.trim() !== "" &&
        value.complainants.every((c) => c.trim() !== "") &&
        value.venue.trim() !== "" &&
        handlingPersonnelComplete &&
        causeComplete &&
        value.filingDate.trim() !== "";

      return senaComplete && remarksComplete;
    }

    if (activeStep === "la") {
      const laRemarksComplete =
        value.la.remarks.trim() !== "" &&
        (value.la.remarks !== "Other" ||
          (value.la.remarksSpecification ?? "").trim() !== "");

      const laStageComplete =
        value.la.date.trim() !== "" &&
        value.la.status.trim() !== "" &&
        value.la.judgmentAward.trim() !== "" &&
        laRemarksComplete;

      return laStageComplete && progressComplete(value.caseProgress.la, value.caseProgress.laSpecification);
    }

    if (activeStep === "nlrc") {
      const nlrcRemarksComplete =
        value.nlrc.remarks.trim() !== "" &&
        (value.nlrc.remarks !== "Other" ||
          (value.nlrc.remarksSpecification ?? "").trim() !== "");

      const nlrcStageComplete =
        value.nlrc.date.trim() !== "" &&
        value.nlrc.status.trim() !== "" &&
        value.nlrc.judgmentAward.trim() !== "" &&
        nlrcRemarksComplete;

      return (
        nlrcStageComplete &&
        progressComplete(value.caseProgress.nlrc, value.caseProgress.nlrcSpecification)
      );
    }

    if (activeStep === "ca") {
      const caRemarksComplete =
        value.ca.remarks.trim() !== "" &&
        (value.ca.remarks !== "Other" ||
          (value.ca.remarksSpecification ?? "").trim() !== "");

      const caStageComplete =
        value.ca.date.trim() !== "" &&
        value.ca.status.trim() !== "" &&
        value.ca.judgmentAward.trim() !== "" &&
        caRemarksComplete;

      return caStageComplete && progressComplete(value.caseProgress.ca, value.caseProgress.caSpecification);
    }

    if (activeStep === "sc") {
      const scRemarksComplete =
        value.sc.remarks.trim() !== "" &&
        (value.sc.remarks !== "Other" ||
          (value.sc.remarksSpecification ?? "").trim() !== "");

      const scStageComplete =
        value.sc.date.trim() !== "" &&
        value.sc.status.trim() !== "" &&
        value.sc.judgmentAward.trim() !== "" &&
        scRemarksComplete;

      return scStageComplete && progressComplete(value.caseProgress.sc, value.caseProgress.scSpecification);
    }

    return true; // review — no further gate before Save
  }

  const isCurrentStepComplete = isCurrentStageFullyFilled();

  function goBack() {
    if (isFirstStep) return;
    for (let i = currentIndex - 1; i >= 0; i--) {
      const candidate = STEP_ORDER[i];
      if (i === 0 || isStepVisible(candidate)) {
        setActiveStep(candidate);
        return;
      }
    }
  }

  function goNext() {
    if (isLastStep) return;
    // Skip forward past any steps that aren't visible yet (mirrors the
    // previous conditional-rendering behavior — a hidden section was
    // simply not shown, never a dead stop).
    for (let i = currentIndex + 1; i < STEP_ORDER.length; i++) {
      const candidate = STEP_ORDER[i];
      if (isStepVisible(candidate) || i === STEP_ORDER.length - 1) {
        goToStep(candidate);
        return;
      }
    }
  }

  const requestCloseCase = () => {
    if (isClosed) return;
    setShowCloseConfirm(true);
  };

  const confirmCloseCase = () => {
    const today = new Date().toISOString().slice(0, 10);
    onChange({ ...value, closed: true, closedDate: today });
    setShowCloseConfirm(false);
  };

  const uncloseCase = () => {
    onChange({ ...value, closed: false, closedDate: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StageStepper
          steps={visibleStageSteps}
          activeKey={activeStep === "review" ? undefined : activeStep}
          onStepClick={(key) => goToStep(key as WizardStep)}
        />

        {isClosed ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
              <Lock size={13} />
              Case Closed — form locked
            </span>

            <button
              type="button"
              onClick={uncloseCase}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100"
            >
              <Unlock size={13} />
              Unclose Case
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isSettled && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                <Lock size={13} />
                Settled — fields locked
              </span>
            )}

            <button
              type="button"
              onClick={requestCloseCase}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
            >
              <Ban size={13} />
              Close Case
            </button>
          </div>
        )}
      </div>

      <fieldset disabled={isFieldsetLocked} className="contents">
        {activeStep === "sena" && (
          <SenaSection
            value={value}
            onChange={guardedOnChange}
            companies={companies}
            restrictSenaEditing={restrictSenaEditing}
            restrictSenaRemarksEditing={restrictSenaRemarksEditing}
            setTop={setTop}
          />
        )}

        {activeStep === "la" && (
          <LaSection
            value={value}
            onChange={guardedOnChange}
            setLa={setLa}
            setProgressSpecification={setProgressSpecification}
            senaFilled={senaFilled}
            laRequired={laRequired}
            laFilled={laFilled}
            laVisible={laVisible}
            restrictLaDetailsEditing={restrictLaDetailsEditing}
            restrictLaProgressOnly={restrictLaProgressOnly}
            restrictLaProgressEditing={restrictLaProgressEditing}
          />
        )}

        {activeStep === "nlrc" && (
          <NlrcSection
            value={value}
            onChange={guardedOnChange}
            setNlrc={setNlrc}
            setProgressSpecification={setProgressSpecification}
            senaFilled={senaFilled}
            laRequired={laRequired}
            laFilled={laFilled}
            nlrcEnabled={nlrcEnabled}
            nlrcFilled={nlrcFilled}
            nlrcVisible={nlrcVisible}
            restrictNlrcDetailsEditing={restrictNlrcDetailsEditing}
            restrictNlrcProgressOnly={restrictNlrcProgressOnly}
            restrictNlrcProgressEditing={restrictNlrcProgressEditing}
          />
        )}

        {activeStep === "ca" && (
          <CaSection
            value={value}
            onChange={guardedOnChange}
            setCa={setCa}
            setProgressSpecification={setProgressSpecification}
            senaFilled={senaFilled}
            nlrcEnabled={nlrcEnabled}
            nlrcFilled={nlrcFilled}
            caEnabled={caEnabled}
            caFilled={caFilled}
            caVisible={caVisible}
            restrictCaDetailsEditing={restrictCaDetailsEditing}
            restrictCaProgressOnly={restrictCaProgressOnly}
            restrictCaProgressEditing={restrictCaProgressEditing}
          />
        )}

        {activeStep === "sc" && (
          <ScSection
            value={value}
            onChange={guardedOnChange}
            setSc={setSc}
            setProgress={setProgress}
            setProgressSpecification={setProgressSpecification}
            setTotalPaidCategory={setTotalPaidCategory}
            senaFilled={senaFilled}
            caEnabled={caEnabled}
            caFilled={caFilled}
            scEnabled={scEnabled}
            scVisible={scVisible}
          />
        )}

        {activeStep === "review" && (
          <TotalJudgmentAwardSection
            value={value}
            totalJudgmentAward={totalJudgmentAward}
            anyStageSettled={anyStageSettled}
            setTotalPaidCategory={setTotalPaidCategory}
          />
        )}
      </fieldset>

      {/* Step navigation — Save/Cancel remain in the modal footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={goBack}
          disabled={isFirstStep}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
            isFirstStep
              ? "cursor-not-allowed border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {!isLastStep && (
          <button
            type="button"
            onClick={goNext}
            disabled={!isCurrentStepComplete}
            title={!isCurrentStepComplete ? "Complete this stage's required fields to continue." : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              isCurrentStepComplete
                ? "bg-[#12331F] text-white hover:bg-[#1B4A2C]"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            Next
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {showCloseConfirm && (
        <ConfirmDialog
          title="Close Case"
          message={
            isSettled
              ? "Close this settled case? This marks the case fully complete. No existing SEnA or stage data will be changed."
              : "Close this case? The form will be locked from further edits. No existing SEnA or stage data will be changed."
          }
          confirmLabel="Close Case"
          onConfirm={confirmCloseCase}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
    </div>
  );
}