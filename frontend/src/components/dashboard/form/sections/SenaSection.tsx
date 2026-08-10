import { Plus } from "lucide-react";

import type { CaseDraft, CaseStatus } from "@/types/case";
import {
  SENA_STATUS_OPTIONS,
  CAUSE_OPTIONS,
  REMARK_OPTIONS,
  HANDLING_PERSONNEL_OPTIONS,
} from "@/constants/caseOptions";

import { Field } from "@/components/cases/Field";
import { inputCls } from "@/components/cases/CurrencyField";
import { InfoBanner } from "@/components/dashboard/form/shared/InfoBanner";
import { SectionHeader, STAGE_STYLES } from "@/components/dashboard/form/shared/SectionHeader";

type SenaSectionProps = {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  companies: string[];
  restrictSenaEditing: boolean;
  restrictSenaRemarksEditing: boolean;
  setTop: <K extends keyof CaseDraft>(
    key: K,
    value: CaseDraft[K]
  ) => void;
};

export function SenaSection({
  value,
  onChange,
  companies,
  restrictSenaEditing,
  restrictSenaRemarksEditing,
  setTop,
}: SenaSectionProps) {
  return (
    <div
      className={`rounded-xl border ${STAGE_STYLES.sena.ring} bg-white p-4 shadow-sm sm:p-5`}
    >
      <SectionHeader stage="sena" title="Single Entry Approach (SEnA)" />

      {restrictSenaEditing && (
        <InfoBanner tone="warning">
          This case hasn't progressed beyond SEnA. Only Remarks and Handling
          Personnel can be edited here — set Remarks to "Not Settled" or
          "Others" to unlock the Labor Arbiter section.
        </InfoBanner>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* ------------------------------------------------ */}
        {/* BASIC CASE INFORMATION */}
        {/* ------------------------------------------------ */}

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
              onChange={(e) =>
                setTop("status", e.target.value as CaseStatus)
              }
            >
              {SENA_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Case Title">
            <input
              className={inputCls}
              value={value.caseTitle}
              onChange={(e) => setTop("caseTitle", e.target.value)}
            />
          </Field>

          <Field label="Case No.">
            <input
              className={inputCls}
              value={value.caseNo}
              onChange={(e) => setTop("caseNo", e.target.value)}
            />
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

                      const next = value.complainants.filter(
                        (_, i) => i !== index
                      );

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
                onClick={() =>
                  setTop("complainants", [
                    ...value.complainants,
                    "",
                  ])
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <Plus size={16} />
                Add Complainant
              </button>
            </div>
          </Field>

          <Field label="Venue">
            <input
              className={inputCls}
              value={value.venue}
              onChange={(e) => setTop("venue", e.target.value)}
            />
          </Field>
        </fieldset>

        {/* ------------------------------------------------ */}
        {/* HANDLING PERSONNEL */}
        {/* ------------------------------------------------ */}

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
                  selected === "Others"
                    ? value.handlingPersonnelSpecification ?? ""
                    : "",
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
              onChange={(e) =>
                setTop(
                  "handlingPersonnelSpecification",
                  e.target.value
                )
              }
            />
          </Field>
        )}

        {/* ------------------------------------------------ */}
        {/* CAUSE OF ACTION */}
        {/* ------------------------------------------------ */}

        <fieldset disabled={restrictSenaEditing} className="contents">
          <Field label="Cause of Action">
            <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              {CAUSE_OPTIONS.map((cause) => (
                <label
                  key={cause}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700"
                >
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
                        causeSpecification:
                          nextCauses.includes("Others")
                            ? value.causeSpecification
                            : "",
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
                onChange={(e) =>
                  setTop("causeSpecification", e.target.value)
                }
              />
            </Field>
          )}

          <Field label="Filing Date">
            <input
              type="date"
              className={inputCls}
              value={value.filingDate}
              onChange={(e) =>
                setTop("filingDate", e.target.value)
              }
            />
          </Field>
        </fieldset>

        {/* ------------------------------------------------ */}
        {/* REMARKS */}
        {/* ------------------------------------------------ */}

        <fieldset
          disabled={restrictSenaRemarksEditing}
          className="contents"
        >
          <Field label="Remarks">
            <select
              className={inputCls}
              value={value.remarks}
              onChange={(e) => {
                const selected = e.target.value;

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
                  laHasData &&
                  selected !== "Not Settled" &&
                  selected !== "Others";

                const shouldResetCategory =
                  selected === "" ||
                  selected === "Not Settled" ||
                  selected === "Others";

                onChange({
                  ...value,

                  remarks: selected,

                  remarkSpecification:
                    selected === "Others" ||
                    selected === "Not Settled"
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
                    ? {
                        totalPaid: {
                          ...value.totalPaid,
                          category: "",
                        },
                      }
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

          {(value.remarks === "Others" ||
            value.remarks === "Not Settled") && (
            <Field label="Specify *">
              <textarea
                required
                rows={3}
                className={inputCls}
                placeholder="Enter remarks"
                value={value.remarkSpecification ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    remarkSpecification: e.target.value,
                  })
                }
              />
            </Field>
          )}
        </fieldset>
      </div>
    </div>
  );
}