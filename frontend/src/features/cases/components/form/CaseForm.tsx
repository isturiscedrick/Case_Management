import type { ReactNode } from "react";
import { Plus, Handshake, Gavel, Building2, Landmark, Scale, Lock, CheckCircle2, Circle, Info, AlertTriangle } from "lucide-react";
import type {
  CaseDraft,
  LaInfo,
  NlrcInfo,
  CaInfo,
  ScInfo,
  TotalPaidCategory,
  StageProgress,
} from "@/types/case";
import {
  STATUS_OPTIONS,
  SENA_STATUS_OPTIONS,
  PROGRESS_OPTIONS,
  CAUSE_OPTIONS,
  REMARK_OPTIONS,
  STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
  HANDLING_PERSONNEL_OPTIONS,
} from "@/constants/caseOptions";

import { SenaSection } from "./sections/SenaSection";
import { LaSection } from "./sections/LaSection";
import { NlrcSection } from "./sections/NlrcSection";
import { CaSection } from "./sections/CaSection";
import { ScSection } from "./sections/ScSection";
import { TotalJudgementRewardSection } from "./sections/TotalJudgementRewardSection";

import {
  StageStepper,
  type StageStep,
} from "./shared/StageStepper";
import { Field } from "@/components/cases/Field";
import { JudgementRewardField, inputCls } from "@/components/cases/CurrencyField";
import type { CaseStatus } from "@/types/case";
import { getStageGates } from "@/lib/caseValidation";
import { formatCurrency, getTotalJudgementReward } from "@/lib/caseHelpers";

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
  // When true, every SEnA field except Remarks (and its "Others" spec) and
  // Handling Personnel is locked. Used for editing a case that hasn't
  // escalated past SEnA yet, so the only things that can change it are
  // Remarks signaling escalation and Handling Personnel reassignment.
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

  // All stage-gating rules (SEnA complete, LA/NLRC/CA/SC filled+enabled)
  // live in lib/caseValidation.ts so the exact same logic can be reused
  // by the parent's Create Case submit handler.
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
  const totalJudgementReward = getTotalJudgementReward(value);
  const canProceedPastLa = value.caseProgress.la === "Not Settled" || value.caseProgress.la === "Others";
  const canProceedPastNlrc = value.caseProgress.nlrc === "Not Settled" || value.caseProgress.nlrc === "Others";
  const canProceedPastCa = value.caseProgress.ca === "Not Settled" || value.caseProgress.ca === "Others";
  // Category only makes sense once the case has actually settled at some
  // stage — enable it when SEnA Remarks or any of LA/NLRC/CA/SC Progress
  // is "Settled".
  const anyStageSettled =
    value.remarks === "Settled" ||
    value.caseProgress.la === "Settled" ||
    value.caseProgress.nlrc === "Settled" ||
    value.caseProgress.ca === "Settled" ||
    value.caseProgress.sc === "Settled";

  // Whether each stage's fields should be shown at all. A stage is hidden
  // (instead of just grayed out) whenever it's not enabled yet, or when an
  // earlier "progress only" lock hasn't been resolved (Progress hasn't been
  // set to "Not Settled" / "Others" to permit moving forward).
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
    { key: "sena", label: "SEnA", status: senaFilled ? "done" : "current" },
    { key: "la", label: "LA", status: !laVisible ? "locked" : laFilled ? "done" : "current" },
    { key: "nlrc", label: "NLRC", status: !nlrcVisible ? "locked" : nlrcFilled ? "done" : "current" },
    { key: "ca", label: "CA", status: !caVisible ? "locked" : caFilled ? "done" : "current" },
    { key: "sc", label: "SC", status: !scVisible ? "locked" : "current" },
  ];

  return (
    <div className="space-y-6">
      <StageStepper steps={stageSteps} />

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

      <TotalJudgementRewardSection
        value={value}
        totalJudgementReward={totalJudgementReward}
        anyStageSettled={anyStageSettled}
        setTotalPaidCategory={setTotalPaidCategory}
      />
    </div>
  );
}