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
import { Field } from "@/components/cases/Field";
import { JudgementRewardField, inputCls } from "@/components/cases/CurrencyField";
import type { CaseStatus } from "@/types/case";
import { getStageGates } from "@/lib/caseValidation";
import { formatCurrency, getTotalJudgementReward } from "@/lib/caseHelpers";

const STAGE_STYLES = {
  sena: { icon: Handshake, ring: "border-teal-200", chip: "bg-teal-50 text-teal-700", text: "text-teal-700", dot: "bg-teal-500" },
  la: { icon: Gavel, ring: "border-sky-200", chip: "bg-sky-50 text-sky-700", text: "text-sky-700", dot: "bg-sky-500" },
  nlrc: { icon: Building2, ring: "border-violet-200", chip: "bg-violet-50 text-violet-700", text: "text-violet-700", dot: "bg-violet-500" },
  ca: { icon: Landmark, ring: "border-fuchsia-200", chip: "bg-fuchsia-50 text-fuchsia-700", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  sc: { icon: Scale, ring: "border-rose-200", chip: "bg-rose-50 text-rose-700", text: "text-rose-700", dot: "bg-rose-500" },
} as const;

function StatusPill({ state }: { state: "locked" | "progress" | "done" }) {
  if (state === "locked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
        <Lock size={11} /> Locked
      </span>
    );
  }
  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
        <CheckCircle2 size={11} /> Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600">
      <Circle size={11} /> In progress
    </span>
  );
}

function InfoBanner({ tone, children }: { tone: "warning" | "info"; children: ReactNode }) {
  if (tone === "warning") {
    return (
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
        <AlertTriangle size={13} className="mt-0.5 shrink-0" />
        <p>{children}</p>
      </div>
    );
  }
  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
      <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
      <p>{children}</p>
    </div>
  );
}

// Icon-chip + heading row shared by every stage card. Optional status pill
// on the right (SEnA doesn't have one — it's always "current" until the
// case escalates, so a pill there wouldn't say anything useful).
function SectionHeader({
  stage,
  title,
  status,
}: {
  stage: keyof typeof STAGE_STYLES;
  title: string;
  status?: "locked" | "progress" | "done";
}) {
  const meta = STAGE_STYLES[stage];
  const Icon = meta.icon;
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.chip}`}>
          <Icon size={16} />
        </div>
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}>{title}</h3>
      </div>
      {status && <StatusPill state={status} />}
    </div>
  );
}

type StageStepStatus = "done" | "current" | "locked";
type StageStep = { key: keyof typeof STAGE_STYLES; label: string; status: StageStepStatus };

// Presentational-only stepper summary — the steps it's given are derived
// entirely from the gating booleans in CaseForm, doesn't feed back into any
// state or logic.
function StageStepper({ steps }: { steps: StageStep[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      {steps.map((step, i) => {
        const meta = STAGE_STYLES[step.key];
        const Icon = meta.icon;
        return (
          <div key={step.key} className="flex shrink-0 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  step.status === "done"
                    ? `${meta.dot} border-transparent text-white`
                    : step.status === "current"
                    ? `bg-white ${meta.ring} ${meta.text}`
                    : "border-slate-200 bg-slate-50 text-slate-300"
                }`}
              >
                {step.status === "done" ? (
                  <CheckCircle2 size={16} />
                ) : step.status === "locked" ? (
                  <Lock size={13} />
                ) : (
                  <Icon size={15} />
                )}
              </div>
              <span className={`text-[10px] font-medium ${step.status === "locked" ? "text-slate-300" : meta.text}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-1.5 h-0.5 w-8 sm:w-14 ${step.status === "done" ? meta.dot : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 2. PER-STAGE SECTIONS ─────────────────────────────────────────────────

function SenaSection({
  value,
  onChange,
  companies,
  restrictSenaEditing,
  restrictSenaRemarksEditing,
  setTop,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  companies: string[];
  restrictSenaEditing: boolean;
  restrictSenaRemarksEditing: boolean;
  setTop: <K extends keyof CaseDraft>(key: K, v: CaseDraft[K]) => void;
}) {
  return (
    <div className={`rounded-xl border ${STAGE_STYLES.sena.ring} bg-white p-4 shadow-sm sm:p-5`}>
      <SectionHeader stage="sena" title="Single Entry Approach (SEnA)" />
      {restrictSenaEditing && (
        <InfoBanner tone="warning">
          This case hasn't progressed beyond SEnA. Only Remarks and Handling Personnel can be edited here — set Remarks to "Not Settled" or "Others" to unlock the Labor Arbiter section.
        </InfoBanner>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <fieldset disabled={restrictSenaEditing} className="contents">
        <Field label="Company">
          <select
            className={inputCls}
            value={value.company}
            onChange={(e) => setTop("company", e.target.value)}
          >
            <option value="">Select Company</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputCls}
            value={value.status}
            onChange={(e) => setTop("status", e.target.value as CaseStatus)}
          >
            {SENA_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Case Title">
          <input className={inputCls} value={value.caseTitle} onChange={(e) => setTop("caseTitle", e.target.value)} />
        </Field>
        <Field label="Case No.">
          <input className={inputCls} value={value.caseNo} onChange={(e) => setTop("caseNo", e.target.value)} />
        </Field>
        <Field label="Complainants">
          <div className="space-y-2">
            {value.complainants.map((name, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={name}
                  placeholder={`Complainant ${index + 1}`}
                  onChange={(e) => {
                    const next = [...value.complainants];
                    next[index] = e.target.value;
                    setTop("complainants", next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (value.complainants.length === 1) return;
                    const next = value.complainants.filter((_, i) => i !== index);
                    setTop("complainants", next);
                  }}
                  className="rounded-lg border border-red-200 px-3 text-red-600 transition-colors hover:bg-red-50"
                >
                  −
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTop("complainants", [...value.complainants, ""])}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <Plus size={16} />
              Add Complainant
            </button>
          </div>
        </Field>
        <Field label="Venue">
          <input className={inputCls} value={value.venue} onChange={(e) => setTop("venue", e.target.value)} />
        </Field>
        </fieldset>

        {/* Handling Personnel is intentionally OUTSIDE the
            restrictSenaEditing fieldset — it must stay editable even when
            the rest of SEnA is locked. */}
        <Field label="Handling Personnel">
          <select
            className={inputCls}
            value={value.handlingPersonnel ?? ""}
            onChange={(e) => {
              const selected = e.target.value;
              onChange({
                ...value,
                handlingPersonnel: selected,
                handlingPersonnelSpecification:
                  selected === "Others" ? value.handlingPersonnelSpecification ?? "" : "",
              });
            }}
          >
            <option value="">Select Handling Personnel</option>
            {HANDLING_PERSONNEL_OPTIONS.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </Field>

        {value.handlingPersonnel === "Others" && (
          <Field label="Specify Handling Personnel *">
            <input
              required
              className={inputCls}
              placeholder="Enter handling personnel"
              value={value.handlingPersonnelSpecification ?? ""}
              onChange={(e) => setTop("handlingPersonnelSpecification", e.target.value)}
            />
          </Field>
        )}

        <fieldset disabled={restrictSenaEditing} className="contents">
        <Field label="Cause of Action">
          <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            {CAUSE_OPTIONS.map((cause) => (
              <label key={cause} className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={value.cause.includes(cause)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const nextCauses = checked
                      ? [...value.cause, cause]
                      : value.cause.filter((c) => c !== cause);
                    onChange({
                      ...value,
                      cause: nextCauses,
                      causeSpecification: nextCauses.includes("Others") ? value.causeSpecification : "",
                    });
                  }}
                />
                {cause}
              </label>
            ))}
          </div>
        </Field>

        {value.cause.includes("Others") && (
          <Field label="Specify Cause of Action *">
            <input
              required
              className={inputCls}
              placeholder="Enter cause of action"
              value={value.causeSpecification ?? ""}
              onChange={(e) => setTop("causeSpecification", e.target.value)}
            />
          </Field>
        )}
        <Field label="Filing Date">
          <input
            type="date"
            className={inputCls}
            value={value.filingDate}
            onChange={(e) => setTop("filingDate", e.target.value)}
          />
        </Field>
        </fieldset>
        <fieldset disabled={restrictSenaRemarksEditing} className="contents">
        <Field label="Remarks">
          <select
            className={inputCls}
            value={value.remarks}
            onChange={(e) => {
              const selected = e.target.value;
              // Reset LA whenever it has ANY data typed in — not just when
              // it's fully complete. laFilled requires every field to be
              // filled, which misses the case where the user only
              // partially filled LA before changing Remarks back.
              const laHasData =
                !!value.la.date ||
                !!value.la.status ||
                !!value.la.judgementReward ||
                !!value.la.judgementRewardSpecification ||
                !!value.la.judgementRewardComputedSpecification ||
                !!value.la.remarks ||
                !!value.la.remarksSpecification ||
                !!value.caseProgress.la ||
                !!value.caseProgress.laSpecification;
              const shouldResetLa =
                laHasData && selected !== "Not Settled" && selected !== "Others";
              // Category depends on some stage being "Settled" — if SEnA
              // Remarks moves to "Select Remarks", "Not Settled", or
              // "Others", clear it so a stale category doesn't linger
              // once this stage no longer justifies it.
              const shouldResetCategory =
                selected === "" || selected === "Not Settled" || selected === "Others";
              onChange({
                ...value,
                remarks: selected,
                remarkSpecification:
                  selected === "Others" || selected === "Not Settled"
                    ? value.remarkSpecification ?? ""
                    : "",
                ...(shouldResetLa
                  ? {
                      la: {
                        ...value.la,
                        date: "",
                        status: "",
                        judgementReward: "",
                        judgementRewardSpecification: "",
                        judgementRewardComputedSpecification: "",
                        remarks: "",
                        remarksSpecification: "",
                      },
                      caseProgress: {
                        ...value.caseProgress,
                        la: "",
                        laSpecification: "",
                      },
                    }
                  : {}),
                ...(shouldResetCategory
                  ? { totalPaid: { ...value.totalPaid, category: "" } }
                  : {}),
              });
            }}
          >
            <option value="">Select Remarks</option>
            {REMARK_OPTIONS.map((remark) => (
              <option key={remark} value={remark}>
                {remark}
              </option>
            ))}
          </select>
        </Field>

        {(value.remarks === "Others" || value.remarks === "Not Settled") && (
          <Field label="Specify *">
            <textarea
              required
              rows={3}
              className={inputCls}
              placeholder="Enter remarks"
              value={value.remarkSpecification ?? ""}
              onChange={(e) => onChange({ ...value, remarkSpecification: e.target.value })}
            />
          </Field>
        )}
        </fieldset>
      </div>
    </div>
  );
}

function LaSection({
  value,
  onChange,
  setLa,
  setProgressSpecification,
  senaFilled,
  laRequired,
  laFilled,
  laVisible,
  restrictLaDetailsEditing,
  restrictLaProgressOnly,
  restrictLaProgressEditing,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  setLa: <K extends keyof LaInfo>(key: K, v: LaInfo[K]) => void;
  setProgressSpecification: (key: "la" | "nlrc" | "ca" | "sc", v: string) => void;
  senaFilled: boolean;
  laRequired: boolean;
  laFilled: boolean;
  laVisible: boolean;
  restrictLaDetailsEditing: boolean;
  restrictLaProgressOnly: boolean;
  restrictLaProgressEditing: boolean;
}) {
  return (
    <div className={`rounded-xl border ${STAGE_STYLES.la.ring} bg-white p-4 shadow-sm sm:p-5`}>
      <SectionHeader
        stage="la"
        title="Labor Arbiter (LA)"
        status={!laVisible ? "locked" : laFilled ? "done" : "progress"}
      />
      {senaFilled && laRequired && !laFilled && (
        <InfoBanner tone="warning">
          SEnA Remarks is "Not Settled" or "Others" — LA fields (Date, Status, Judgement Reward, Remarks) are now required to create the case. LA Progress is optional.
        </InfoBanner>
      )}
      {senaFilled && !laRequired && (
        <InfoBanner tone="info">
          Disabled while SEnA Remarks is "Select Remarks" or "Settled", or while Specify Remarks is empty for "Not Settled"/"Others".
        </InfoBanner>
      )}
      {restrictLaProgressOnly && (
        <InfoBanner tone="warning">
          LA details are saved and locked. Update LA Progress only, then save to continue the case workflow.
        </InfoBanner>
      )}
      {laVisible && (
      <>
      <div className="grid gap-4 sm:grid-cols-4">
        <fieldset disabled={restrictLaDetailsEditing} className="contents">
        <Field label="Date">
          <input type="date" className={inputCls} value={value.la.date} onChange={(e) => setLa("date", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={value.la.status} onChange={(e) => setLa("status", e.target.value)}>
            <option value="">Select Status</option>
            {STAGE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        </fieldset>

        {/* Judgement Reward is intentionally OUTSIDE restrictLaDetailsEditing
            — it must stay fully editable regardless of any lock. */}
        <JudgementRewardField
          label="Judgement Reward"
          value={value.la.judgementReward}
          onChange={(v) => setLa("judgementReward", v)}
          amountSpecValue={value.la.judgementRewardSpecification}
          onAmountSpecChange={(v) => setLa("judgementRewardSpecification", v)}
          computedSpecValue={value.la.judgementRewardComputedSpecification}
          onComputedSpecChange={(v) => setLa("judgementRewardComputedSpecification", v)}
        />

        <fieldset disabled={restrictLaDetailsEditing} className="contents">
        <Field label="Remarks">
          <select
            className={inputCls}
            value={value.la.remarks}
            onChange={(e) => {
              const selected = e.target.value;
              onChange({
                ...value,
                la: {
                  ...value.la,
                  remarks: selected,
                  remarksSpecification: selected === "Other" ? value.la.remarksSpecification ?? "" : "",
                },
              });
            }}
          >
            <option value="">Select Remarks</option>
            {STAGE_REMARKS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        </fieldset>
      </div>

      {value.la.remarks === "Other" && (
        <fieldset disabled={restrictLaDetailsEditing} className="contents">
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Specify Remarks">
            <input
              className={inputCls}
              placeholder="Enter remarks"
              value={value.la.remarksSpecification ?? ""}
              onChange={(e) => setLa("remarksSpecification", e.target.value)}
            />
          </Field>
        </div>
        </fieldset>
      )}
      </>
      )}

      {laVisible && (
      <div className="mt-3">
        <Field label="LA Progress">
          <select
            className={inputCls}
            value={value.caseProgress.la}
            disabled={restrictLaProgressEditing}
            onChange={(e) => {
              const selected = e.target.value as StageProgress;
              // Reset NLRC whenever it has ANY data entered — not just
              // when fully complete — mirroring the SEnA Remarks -> LA
              // reset above.
              const nlrcHasData =
                !!value.nlrc.date ||
                !!value.nlrc.status ||
                !!value.nlrc.judgementReward ||
                !!value.nlrc.judgementRewardSpecification ||
                !!value.nlrc.judgementRewardComputedSpecification ||
                !!value.nlrc.remarks ||
                !!value.nlrc.remarksSpecification ||
                !!value.caseProgress.nlrc ||
                !!value.caseProgress.nlrcSpecification;
              const shouldResetNlrc =
                nlrcHasData && selected !== "Not Settled" && selected !== "Others";
              // Clear Category if LA Progress moves to "Not Settled" or
              // "Others" — it no longer reflects a settled outcome here.
              const shouldResetCategory =
                selected === "Not Settled" || selected === "Others";
              onChange({
                ...value,
                caseProgress: {
                  ...value.caseProgress,
                  la: selected,
                  ...(selected === "Others" || selected === "Not Settled" ? {} : { laSpecification: "" }),
                  ...(shouldResetNlrc ? { nlrc: "", nlrcSpecification: "" } : {}),
                },
                ...(shouldResetNlrc
                  ? {
                      nlrc: {
                        ...value.nlrc,
                        date: "",
                        status: "",
                        judgementReward: "",
                        judgementRewardSpecification: "",
                        judgementRewardComputedSpecification: "",
                        remarks: "",
                        remarksSpecification: "",
                      },
                    }
                  : {}),
                ...(shouldResetCategory
                  ? { totalPaid: { ...value.totalPaid, category: "" } }
                  : {}),
              });
            }}
          >
            <option value="">Select Progress</option>
            {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>
      )}

      {laVisible && (value.caseProgress.la === "Others" || value.caseProgress.la === "Not Settled") && (
        <fieldset disabled={restrictLaProgressEditing} className="contents">
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Specify LA Progress">
            <input
              className={inputCls}
              placeholder="Enter progress"
              value={value.caseProgress.laSpecification ?? ""}
              onChange={(e) => setProgressSpecification("la", e.target.value)}
            />
          </Field>
        </div>
        </fieldset>
      )}
    </div>
  );
}

function NlrcSection({
  value,
  onChange,
  setNlrc,
  setProgressSpecification,
  senaFilled,
  laRequired,
  laFilled,
  nlrcEnabled,
  nlrcFilled,
  nlrcVisible,
  restrictNlrcDetailsEditing,
  restrictNlrcProgressOnly,
  restrictNlrcProgressEditing,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  setNlrc: <K extends keyof NlrcInfo>(key: K, v: NlrcInfo[K]) => void;
  setProgressSpecification: (key: "la" | "nlrc" | "ca" | "sc", v: string) => void;
  senaFilled: boolean;
  laRequired: boolean;
  laFilled: boolean;
  nlrcEnabled: boolean;
  nlrcFilled: boolean;
  nlrcVisible: boolean;
  restrictNlrcDetailsEditing: boolean;
  restrictNlrcProgressOnly: boolean;
  restrictNlrcProgressEditing: boolean;
}) {
  return (
    <div className={`rounded-xl border ${STAGE_STYLES.nlrc.ring} bg-white p-4 shadow-sm sm:p-5`}>
      <SectionHeader
        stage="nlrc"
        title="National Labor Relations Commission (NLRC)"
        status={!nlrcVisible ? "locked" : nlrcFilled ? "done" : "progress"}
      />
      {senaFilled && !laRequired && (
        <InfoBanner tone="info">
          Disabled while LA Progress is "Select Progress" or "Settled".
        </InfoBanner>
      )}
      {senaFilled && laRequired && !laFilled && (
        <InfoBanner tone="info">
          Complete all Labor Arbiter (LA) fields above (Date, Status, Judgement Reward, Remarks) to unlock this section.
        </InfoBanner>
      )}
      {senaFilled && laRequired && laFilled && !nlrcEnabled && (
        <InfoBanner tone="info">
          LA Progress must be "Not Settled" or "Others" to unlock NLRC. The case is considered resolved if settled at LA.
        </InfoBanner>
      )}
      {restrictNlrcProgressOnly && (
        <InfoBanner tone="warning">
          NLRC details are saved and locked. Update NLRC Progress only, then save to continue the case workflow.
        </InfoBanner>
      )}
      {nlrcVisible && (
      <>
      <div className="grid gap-4 sm:grid-cols-4">
        <fieldset disabled={restrictNlrcDetailsEditing} className="contents">
        <Field label="Date">
          <input type="date" className={inputCls} value={value.nlrc.date} onChange={(e) => setNlrc("date", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={value.nlrc.status} onChange={(e) => setNlrc("status", e.target.value)}>
            <option value="">Select Status</option>
            {STAGE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        </fieldset>

        {/* Judgement Award is intentionally OUTSIDE restrictNlrcDetailsEditing
            — it must stay fully editable regardless of any lock. */}
        <JudgementRewardField
          label="Judgement Award"
          value={value.nlrc.judgementReward}
          onChange={(v) => setNlrc("judgementReward", v)}
          amountSpecValue={value.nlrc.judgementRewardSpecification}
          onAmountSpecChange={(v) => setNlrc("judgementRewardSpecification", v)}
          computedSpecValue={value.nlrc.judgementRewardComputedSpecification}
          onComputedSpecChange={(v) => setNlrc("judgementRewardComputedSpecification", v)}
        />

        <fieldset disabled={restrictNlrcDetailsEditing} className="contents">
        <Field label="Remarks">
          <select
            className={inputCls}
            value={value.nlrc.remarks}
            onChange={(e) => {
              const selected = e.target.value;
              onChange({
                ...value,
                nlrc: {
                  ...value.nlrc,
                  remarks: selected,
                  remarksSpecification: selected === "Other" ? value.nlrc.remarksSpecification ?? "" : "",
                },
              });
            }}
          >
            <option value="">Select Remarks</option>
            {STAGE_REMARKS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        </fieldset>
      </div>

      {value.nlrc.remarks === "Other" && (
        <fieldset disabled={restrictNlrcDetailsEditing} className="contents">
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Specify Remarks">
            <input
              className={inputCls}
              placeholder="Enter remarks"
              value={value.nlrc.remarksSpecification ?? ""}
              onChange={(e) => setNlrc("remarksSpecification", e.target.value)}
            />
          </Field>
        </div>
        </fieldset>
      )}
      </>
      )}

      {nlrcVisible && (
      <div className="mt-3">
        <Field label="NLRC Progress">
          <select
            className={inputCls}
            value={value.caseProgress.nlrc}
            disabled={restrictNlrcProgressEditing}
            onChange={(e) => {
              const selected = e.target.value as StageProgress;
              // Reset CA whenever it has ANY data entered — not just when
              // fully complete — mirroring the LA Progress -> NLRC reset
              // above.
              const caHasData =
                !!value.ca.date ||
                !!value.ca.status ||
                !!value.ca.judgementReward ||
                !!value.ca.judgementRewardSpecification ||
                !!value.ca.judgementRewardComputedSpecification ||
                !!value.ca.remarks ||
                !!value.ca.remarksSpecification ||
                !!value.caseProgress.ca ||
                !!value.caseProgress.caSpecification;
              const shouldResetCa =
                caHasData && selected !== "Not Settled" && selected !== "Others";
              // Clear Category if NLRC Progress moves to "Not Settled" or
              // "Others".
              const shouldResetCategory =
                selected === "Not Settled" || selected === "Others";
              onChange({
                ...value,
                caseProgress: {
                  ...value.caseProgress,
                  nlrc: selected,
                  ...(selected === "Others" || selected === "Not Settled" ? {} : { nlrcSpecification: "" }),
                  ...(shouldResetCa ? { ca: "", caSpecification: "" } : {}),
                },
                ...(shouldResetCa
                  ? {
                      ca: {
                        ...value.ca,
                        date: "",
                        status: "",
                        judgementReward: "",
                        judgementRewardSpecification: "",
                        judgementRewardComputedSpecification: "",
                        remarks: "",
                        remarksSpecification: "",
                      },
                    }
                  : {}),
                ...(shouldResetCategory
                  ? { totalPaid: { ...value.totalPaid, category: "" } }
                  : {}),
              });
            }}
          >
            <option value="">Select Progress</option>
            {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>
      )}

      {nlrcVisible && (value.caseProgress.nlrc === "Others" || value.caseProgress.nlrc === "Not Settled") && (
        <fieldset disabled={restrictNlrcProgressEditing} className="contents">
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Specify NLRC Progress">
            <input
              className={inputCls}
              placeholder="Enter progress"
              value={value.caseProgress.nlrcSpecification ?? ""}
              onChange={(e) => setProgressSpecification("nlrc", e.target.value)}
            />
          </Field>
        </div>
        </fieldset>
      )}
    </div>
  );
}

function CaSection({
  value,
  onChange,
  setCa,
  setProgressSpecification,
  senaFilled,
  nlrcEnabled,
  nlrcFilled,
  caEnabled,
  caFilled,
  caVisible,
  restrictCaDetailsEditing,
  restrictCaProgressOnly,
  restrictCaProgressEditing,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  setCa: <K extends keyof CaInfo>(key: K, v: CaInfo[K]) => void;
  setProgressSpecification: (key: "la" | "nlrc" | "ca" | "sc", v: string) => void;
  senaFilled: boolean;
  nlrcEnabled: boolean;
  nlrcFilled: boolean;
  caEnabled: boolean;
  caFilled: boolean;
  caVisible: boolean;
  restrictCaDetailsEditing: boolean;
  restrictCaProgressOnly: boolean;
  restrictCaProgressEditing: boolean;
}) {
  return (
    <div className={`rounded-xl border ${STAGE_STYLES.ca.ring} bg-white p-4 shadow-sm sm:p-5`}>
      <SectionHeader
        stage="ca"
        title="Court of Appeals (CA)"
        status={!caVisible ? "locked" : caFilled ? "done" : "progress"}
      />
      {senaFilled && !nlrcEnabled && (
        <InfoBanner tone="info">
          Disabled while NLRC Progress is "Select Progress" or "Settled".
        </InfoBanner>
      )}
      {senaFilled && nlrcEnabled && !nlrcFilled && (
        <InfoBanner tone="info">
          Complete all NLRC fields above (Date, Status, Judgement Award, Remarks) to unlock this section.
        </InfoBanner>
      )}
      {senaFilled && nlrcEnabled && nlrcFilled && !caEnabled && (
        <InfoBanner tone="info">
          NLRC Progress must be "Not Settled" or "Others" to unlock CA. The case is considered resolved if settled at NLRC.
        </InfoBanner>
      )}
      {restrictCaProgressOnly && (
        <InfoBanner tone="warning">
          CA details are saved and locked. Update CA Progress only, then save to continue the case workflow.
        </InfoBanner>
      )}
      {caVisible && (
      <>
      <div className="grid gap-4 sm:grid-cols-4">
        <fieldset disabled={restrictCaDetailsEditing} className="contents">
        <Field label="Date">
          <input type="date" className={inputCls} value={value.ca.date} onChange={(e) => setCa("date", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={value.ca.status} onChange={(e) => setCa("status", e.target.value)}>
            <option value="">Select Status</option>
            {STAGE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        </fieldset>

        {/* Judgement Award is intentionally OUTSIDE restrictCaDetailsEditing
            — it must stay fully editable regardless of any lock. */}
        <JudgementRewardField
          label="Judgement Award"
          value={value.ca.judgementReward}
          onChange={(v) => setCa("judgementReward", v)}
          amountSpecValue={value.ca.judgementRewardSpecification}
          onAmountSpecChange={(v) => setCa("judgementRewardSpecification", v)}
          computedSpecValue={value.ca.judgementRewardComputedSpecification}
          onComputedSpecChange={(v) => setCa("judgementRewardComputedSpecification", v)}
        />

        <fieldset disabled={restrictCaDetailsEditing} className="contents">
        <Field label="Remarks">
          <select
            className={inputCls}
            value={value.ca.remarks}
            onChange={(e) => {
              const selected = e.target.value;
              onChange({
                ...value,
                ca: {
                  ...value.ca,
                  remarks: selected,
                  remarksSpecification: selected === "Other" ? value.ca.remarksSpecification ?? "" : "",
                },
              });
            }}
          >
            <option value="">Select Remarks</option>
            {STAGE_REMARKS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        </fieldset>
      </div>

      {value.ca.remarks === "Other" && (
        <fieldset disabled={restrictCaDetailsEditing} className="contents">
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Specify Remarks">
            <input
              className={inputCls}
              placeholder="Enter remarks"
              value={value.ca.remarksSpecification ?? ""}
              onChange={(e) => setCa("remarksSpecification", e.target.value)}
            />
          </Field>
        </div>
        </fieldset>
      )}
      </>
      )}

      {caVisible && (
      <div className="mt-3">
        <Field label="CA Progress">
          <select
            className={inputCls}
            value={value.caseProgress.ca}
            disabled={restrictCaProgressEditing}
            onChange={(e) => {
              const selected = e.target.value as StageProgress;
              // Reset SC whenever it has ANY data entered — not just when
              // fully complete — mirroring the NLRC Progress -> CA reset
              // above.
              const scHasData =
                !!value.sc.date ||
                !!value.sc.status ||
                !!value.sc.judgementReward ||
                !!value.sc.judgementRewardSpecification ||
                !!value.sc.judgementRewardComputedSpecification ||
                !!value.sc.remarks ||
                !!value.sc.remarksSpecification ||
                !!value.caseProgress.sc ||
                !!value.caseProgress.scSpecification;
              const shouldResetSc =
                scHasData && selected !== "Not Settled" && selected !== "Others";
              // Clear Category if CA Progress moves to "Not Settled" or
              // "Others".
              const shouldResetCategory =
                selected === "Not Settled" || selected === "Others";
              onChange({
                ...value,
                caseProgress: {
                  ...value.caseProgress,
                  ca: selected,
                  ...(selected === "Others" || selected === "Not Settled" ? {} : { caSpecification: "" }),
                  ...(shouldResetSc ? { sc: "", scSpecification: "" } : {}),
                },
                ...(shouldResetSc
                  ? {
                      sc: {
                        ...value.sc,
                        date: "",
                        status: "",
                        judgementReward: "",
                        judgementRewardSpecification: "",
                        judgementRewardComputedSpecification: "",
                        remarks: "",
                        remarksSpecification: "",
                      },
                    }
                  : {}),
                ...(shouldResetCategory
                  ? { totalPaid: { ...value.totalPaid, category: "" } }
                  : {}),
              });
            }}
          >
            <option value="">Select Progress</option>
            {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>
      )}

      {caVisible && (value.caseProgress.ca === "Others" || value.caseProgress.ca === "Not Settled") && (
        <fieldset disabled={restrictCaProgressEditing} className="contents">
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Specify CA Progress">
            <input
              className={inputCls}
              placeholder="Enter progress"
              value={value.caseProgress.caSpecification ?? ""}
              onChange={(e) => setProgressSpecification("ca", e.target.value)}
            />
          </Field>
        </div>
        </fieldset>
      )}
    </div>
  );
}

function ScSection({
  value,
  onChange,
  setSc,
  setProgress,
  setProgressSpecification,
  setTotalPaidCategory,
  senaFilled,
  caEnabled,
  caFilled,
  scEnabled,
  scVisible,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  setSc: <K extends keyof ScInfo>(key: K, v: ScInfo[K]) => void;
  setProgress: (key: "la" | "nlrc" | "ca" | "sc", v: StageProgress) => void;
  setProgressSpecification: (key: "la" | "nlrc" | "ca" | "sc", v: string) => void;
  setTotalPaidCategory: (category: TotalPaidCategory | "") => void;
  senaFilled: boolean;
  caEnabled: boolean;
  caFilled: boolean;
  scEnabled: boolean;
  scVisible: boolean;
}) {
  return (
    <div className={`rounded-xl border ${STAGE_STYLES.sc.ring} bg-white p-4 shadow-sm sm:p-5`}>
      <SectionHeader stage="sc" title="Supreme Court (SC)" status={!scVisible ? "locked" : "progress"} />
      {senaFilled && !caEnabled && (
        <InfoBanner tone="info">
          Disabled while CA Progress is "Select Progress" or "Settled".
        </InfoBanner>
      )}
      {senaFilled && caEnabled && !caFilled && (
        <InfoBanner tone="info">
          Complete all CA fields above (Date, Status, Judgement Award, Remarks) to unlock this section.
        </InfoBanner>
      )}
      {senaFilled && caEnabled && caFilled && !scEnabled && (
        <InfoBanner tone="info">
          CA Progress must be "Not Settled" or "Others" to unlock SC. The case is considered resolved if settled at CA.
        </InfoBanner>
      )}
      {scVisible && (
      <>
      <div className="grid gap-4 sm:grid-cols-5">
        <Field label="Date">
          <input type="date" className={inputCls} value={value.sc.date} onChange={(e) => setSc("date", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={value.sc.status} onChange={(e) => setSc("status", e.target.value)}>
            <option value="">Select Status</option>
            {STAGE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <JudgementRewardField
          label="Judgement Award"
          value={value.sc.judgementReward}
          onChange={(v) => setSc("judgementReward", v)}
          amountSpecValue={value.sc.judgementRewardSpecification}
          onAmountSpecChange={(v) => setSc("judgementRewardSpecification", v)}
          computedSpecValue={value.sc.judgementRewardComputedSpecification}
          onComputedSpecChange={(v) => setSc("judgementRewardComputedSpecification", v)}
        />
        <Field label="Remarks">
          <select
            className={inputCls}
            value={value.sc.remarks}
            onChange={(e) => {
              const selected = e.target.value;
              onChange({
                ...value,
                sc: {
                  ...value.sc,
                  remarks: selected,
                  remarksSpecification: selected === "Other" ? value.sc.remarksSpecification ?? "" : "",
                },
              });
            }}
          >
            <option value="">Select Remarks</option>
            {STAGE_REMARKS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Progress">
          <select
            className={inputCls}
            value={value.caseProgress.sc}
            onChange={(e) => {
              const selected = e.target.value as StageProgress;
              // Clear Category if SC Progress moves to "Not Settled" or
              // "Others" — SC is the final stage, so this is the last
              // point at which a settled-based category can be cleared.
              const shouldResetCategory =
                selected === "Not Settled" || selected === "Others";
              setProgress("sc", selected);
              if (shouldResetCategory) {
                setTotalPaidCategory("");
              }
            }}
          >
            <option value="">Select Progress</option>
            {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {value.sc.remarks === "Other" && (
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Specify Remarks">
            <input
              className={inputCls}
              placeholder="Enter remarks"
              value={value.sc.remarksSpecification ?? ""}
              onChange={(e) => setSc("remarksSpecification", e.target.value)}
            />
          </Field>
        </div>
      )}

      {(value.caseProgress.sc === "Others" || value.caseProgress.sc === "Not Settled") && (
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Specify SC Progress">
            <input
              className={inputCls}
              placeholder="Enter progress"
              value={value.caseProgress.scSpecification ?? ""}
              onChange={(e) => setProgressSpecification("sc", e.target.value)}
            />
          </Field>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function TotalJudgementRewardSection({
  value,
  totalJudgementReward,
  anyStageSettled,
  setTotalPaidCategory,
}: {
  value: CaseDraft;
  totalJudgementReward: string;
  anyStageSettled: boolean;
  setTotalPaidCategory: (category: TotalPaidCategory | "") => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        <Landmark size={13} />
        Total Judgement Reward
      </h3>
      <div className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-lg font-semibold text-emerald-800 shadow-sm">
        {formatCurrency(totalJudgementReward)}
      </div>
      <p className="mt-1.5 text-[11px] text-emerald-700/70">
        Reflects the latest stage's Judgement Reward/Award (SC, then CA, NLRC, LA) — not a sum of all stages.
      </p>
      <div className="mt-3 max-w-sm">
        <Field label="Category">
          <select
            className={inputCls}
            value={value.totalPaid.category}
            disabled={!anyStageSettled}
            onChange={(e) => setTotalPaidCategory(e.target.value as TotalPaidCategory | "")}
          >
            <option value="">Select Category</option>
            <option value="Judgement-Award-L">Judgement-Award-L</option>
            <option value="Judgement-Award-W">Judgement-Award-W</option>
            <option value="Settlement">Settlement</option>
          </select>
        </Field>
        {!anyStageSettled && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700/60">
            <Lock size={10} />
            Enabled once a stage's Remarks/Progress is marked "Settled".
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 3. CASEFORM (ORCHESTRATOR) ────────────────────────────────────────────

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