import { Ban, Lock, Unlock } from "lucide-react";
import { useState } from "react";

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
import { getStageGates } from "@/lib/caseValidation";
import { getTotalJudgmentAward } from "@/lib/caseHelpers";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

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

  const setTop = <K extends keyof CaseDraft>(key: K, v: CaseDraft[K]) => {
    onChange({ ...value, [key]: v });
  };
  const setLa = <K extends keyof LaInfo>(key: K, v: LaInfo[K]) => {
    onChange({ ...value, la: { ...value.la, [key]: v } });
  };
  const setNlrc = <K extends keyof NlrcInfo>(key: K, v: NlrcInfo[K]) => {
    onChange({ ...value, nlrc: { ...value.nlrc, [key]: v } });
  };
  const setCa = <K extends keyof CaInfo>(key: K, v: CaInfo[K]) => {
    onChange({ ...value, ca: { ...value.ca, [key]: v } });
  };
  const setSc = <K extends keyof ScInfo>(key: K, v: ScInfo[K]) => {
    onChange({ ...value, sc: { ...value.sc, [key]: v } });
  };
  const setTotalPaidCategory = (category: TotalPaidCategory | "") => {
    onChange({
      ...value,
      totalPaid: { ...value.totalPaid, category },
    });
  };

  const setProgress = (key: "la" | "nlrc" | "ca" | "sc", v: StageProgress) => {
    const specKey = `${key}Specification` as const;
    onChange({
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
    onChange({
      ...value,
      caseProgress: {
        ...value.caseProgress,
        [specKey]: v,
      },
    });
  };

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

  // "Closed" is a standalone lock flag — it never overwrites status,
  // remarks, or any stage's data. It only disables the form.
  const isClosed = !!value.closed;

  // A settled case (has a Total Paid category) locks all field sections
  // just like Closed does, but leaves the Close Case button itself active —
  // Close/Unclose is the only action still available once settled.
  const isSettled = !!value.totalPaid?.category;
  const isFieldsetLocked = isClosed || isSettled;

  const requestCloseCase = () => {
    if (isClosed) return;
    setShowCloseConfirm(true);
  };

  const confirmCloseCase = () => {
    const today = new Date().toISOString().slice(0, 10);
    onChange({ ...value, closed: true, closedDate: today });
    setShowCloseConfirm(false);
  };

  // Uncloses immediately — no confirm dialog. Clears the lock flag and its
  // date; edits are then subject to the normal stage restrictions (passed
  // in via props from CasesPage.openEdit), not fully unlocked.
  const uncloseCase = () => {
    onChange({ ...value, closed: false, closedDate: "" });
  };

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

  const stageSteps: StageStep[] = [
    { key: "sena", label: "SENA", status: senaFilled ? "done" : "current" },
    { key: "la", label: "LA", status: !laVisible ? "locked" : laFilled ? "done" : "current" },
    { key: "nlrc", label: "NLRC", status: !nlrcVisible ? "locked" : nlrcFilled ? "done" : "current" },
    { key: "ca", label: "CA", status: !caVisible ? "locked" : caFilled ? "done" : "current" },
    { key: "sc", label: "SC", status: !scVisible ? "locked" : "current" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StageStepper steps={stageSteps} />

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
        <SenaSection
          value={value}
          onChange={onChange}
          companies={companies}
          restrictSenaEditing={restrictSenaEditing}
          restrictSenaRemarksEditing={restrictSenaRemarksEditing}
          setTop={setTop}
        />

        <LaSection
          value={value}
          onChange={onChange}
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

        <NlrcSection
          value={value}
          onChange={onChange}
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

        <CaSection
          value={value}
          onChange={onChange}
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

        <ScSection
          value={value}
          onChange={onChange}
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

        <TotalJudgmentAwardSection
          value={value}
          totalJudgmentAward={totalJudgmentAward}
          anyStageSettled={anyStageSettled}
          setTotalPaidCategory={setTotalPaidCategory}
        />
      </fieldset>

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