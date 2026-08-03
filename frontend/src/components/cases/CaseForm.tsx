/* eslint-disable react/no-unescaped-entities */
import { Plus } from "lucide-react";
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
import { Field } from "./Field";
import { CurrencyField, inputCls } from "./CurrencyField";
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
  // When true, every SEnA field except Remarks (and its "Others" spec) is
  // locked. Used for editing a case that hasn't escalated past SEnA yet, so
  // the only thing that can change it is Remarks signaling escalation.
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Single Entry Approach (SEnA)
        </h3>
        {restrictSenaEditing && (
          <p className="mb-2 text-[11px] text-amber-600">
            This case hasn't progressed beyond SEnA. Only Remarks can be edited here — set it to "Not Settled" or "Others" to unlock the Labor Arbiter section.
          </p>
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
                    className="rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50"
                  >
                    −
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTop("complainants", [...value.complainants, ""])}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <Plus size={16} />
                Add Complainant
              </button>
            </div>
          </Field>
          <Field label="Venue">
            <input className={inputCls} value={value.venue} onChange={(e) => setTop("venue", e.target.value)} />
          </Field>
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
                className={inputCls}
                placeholder="Enter handling personnel"
                value={value.handlingPersonnelSpecification ?? ""}
                onChange={(e) => setTop("handlingPersonnelSpecification", e.target.value)}
              />
            </Field>
          )}
          <Field label="Cause of Action">
            <select
              className={inputCls}
              value={value.cause}
              onChange={(e) => {
                const selected = e.target.value;
                onChange({
                  ...value,
                  cause: selected,
                  causeSpecification: selected === "Others" ? value.causeSpecification : "",
                });
              }}
            >
              <option value="">Select Cause of Action</option>
              {CAUSE_OPTIONS.map((cause) => (
                <option key={cause} value={cause}>
                  {cause}
                </option>
              ))}
            </select>
          </Field>

          {value.cause === "Others" && (
            <Field label="Specify Cause of Action *">
              <input
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
              <input
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

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-sky-600">Labor Arbiter (LA)</h3>
        {senaFilled && laRequired && !laFilled && (
          <p className="mb-2 text-[11px] font-medium text-amber-600">
            SEnA Remarks is "Not Settled" or "Others" — LA fields (Date, Status, Judgement Reward, Remarks) are now required to create the case. LA Progress is optional.
          </p>
        )}
        {senaFilled && !laRequired && (
          <p className="mb-2 text-[11px] text-slate-400">
            Disabled while SEnA Remarks is "Select Remarks" or "Settled".
          </p>
        )}
        {restrictLaProgressOnly && (
          <p className="mb-2 text-[11px] font-medium text-amber-600">
            LA details are saved and locked. Update LA Progress only, then save to continue the case workflow.
          </p>
        )}
        {laVisible && (
        <fieldset disabled={restrictLaDetailsEditing} className="contents">
        <div className="grid gap-4 sm:grid-cols-4">
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
          <CurrencyField label="Judgement Reward" value={value.la.judgementReward} onChange={(v) => setLa("judgementReward", v)} />
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
        </div>

        {value.la.remarks === "Other" && (
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
        )}
        </fieldset>
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

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-600">National Labor Relations Commission (NLRC)</h3>
        {senaFilled && !laRequired && (
          <p className="mb-2 text-[11px] text-slate-400">
            Disabled while LA Progress is "Select Progress" or "Settled".
          </p>
        )}
        {senaFilled && laRequired && !laFilled && (
          <p className="mb-2 text-[11px] text-slate-400">
            Complete all Labor Arbiter (LA) fields above (Date, Status, Judgement Reward, Remarks) to unlock this section.
          </p>
        )}
        {senaFilled && laRequired && laFilled && !nlrcEnabled && (
          <p className="mb-2 text-[11px] text-slate-400">
            LA Progress must be "Not Settled" or "Others" to unlock NLRC. The case is considered resolved if settled at LA.
          </p>
        )}
        {restrictNlrcProgressOnly && (
          <p className="mb-2 text-[11px] font-medium text-amber-600">
            NLRC details are saved and locked. Update NLRC Progress only, then save to continue the case workflow.
          </p>
        )}
        {nlrcVisible && (
        <fieldset disabled={restrictNlrcDetailsEditing} className="contents">
        <div className="grid gap-4 sm:grid-cols-4">
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
          <CurrencyField label="Judgement Award" value={value.nlrc.judgementReward} onChange={(v) => setNlrc("judgementReward", v)} />
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
        </div>

        {value.nlrc.remarks === "Other" && (
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
        )}
        </fieldset>
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

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Court of Appeals (CA)</h3>
        {senaFilled && !nlrcEnabled && (
          <p className="mb-2 text-[11px] text-slate-400">
            Disabled while NLRC Progress is "Select Progress" or "Settled".
          </p>
        )}
        {senaFilled && nlrcEnabled && !nlrcFilled && (
          <p className="mb-2 text-[11px] text-slate-400">
            Complete all NLRC fields above (Date, Status, Judgement Award, Remarks) to unlock this section.
          </p>
        )}
        {senaFilled && nlrcEnabled && nlrcFilled && !caEnabled && (
          <p className="mb-2 text-[11px] text-slate-400">
            NLRC Progress must be "Not Settled" or "Others" to unlock CA. The case is considered resolved if settled at NLRC.
          </p>
        )}
        {restrictCaProgressOnly && (
          <p className="mb-2 text-[11px] font-medium text-amber-600">
            CA details are saved and locked. Update CA Progress only, then save to continue the case workflow.
          </p>
        )}
        {caVisible && (
        <fieldset disabled={restrictCaDetailsEditing} className="contents">
        <div className="grid gap-4 sm:grid-cols-4">
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
          <CurrencyField label="Judgement Award" value={value.ca.judgementReward} onChange={(v) => setCa("judgementReward", v)} />
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
        </div>

        {value.ca.remarks === "Other" && (
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
        )}
        </fieldset>
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

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-rose-600">Supreme Court (SC)</h3>
        {senaFilled && !caEnabled && (
          <p className="mb-2 text-[11px] text-slate-400">
            Disabled while CA Progress is "Select Progress" or "Settled".
          </p>
        )}
        {senaFilled && caEnabled && !caFilled && (
          <p className="mb-2 text-[11px] text-slate-400">
            Complete all CA fields above (Date, Status, Judgement Award, Remarks) to unlock this section.
          </p>
        )}
        {senaFilled && caEnabled && caFilled && !scEnabled && (
          <p className="mb-2 text-[11px] text-slate-400">
            CA Progress must be "Not Settled" or "Others" to unlock SC. The case is considered resolved if settled at CA.
          </p>
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
          <CurrencyField label="Judgement Award" value={value.sc.judgementReward} onChange={(v) => setSc("judgementReward", v)} />
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
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Total Judgement Reward
        </h3>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-sm font-medium text-emerald-800">
          {formatCurrency(totalJudgementReward)}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Calculated automatically from the Judgement Reward/Award values above.
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
        </div>
      </div>
      </div>
    </div>
  );
}