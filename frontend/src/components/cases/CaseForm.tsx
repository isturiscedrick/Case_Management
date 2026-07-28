import { Plus } from "lucide-react";
import type {
  CaseDraft,
  LaInfo,
  NlrcInfo,
  CaInfo,
  ScInfo,
  CaseProgress,
  StageProgress,
  TotalPaidCategory,
} from "@/types/case";
import {
  STATUS_OPTIONS,
  PROGRESS_OPTIONS,
  CAUSE_OPTIONS,
  REMARK_OPTIONS,
  STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";
import { Field } from "./Field";
import { CurrencyField, inputCls } from "./CurrencyField";
import type { CaseStatus } from "@/types/case";

export function CaseForm({
  value,
  onChange,
  companies,
}: {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;
  companies: string[];
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

const setTotalPaid = (
  key: "amount" | "category",
  valueToSet: string | TotalPaidCategory | ""
) => {
  onChange({
    ...value,
    totalPaid: {
      ...value.totalPaid,
      [key]: valueToSet,
    },
  });
};

const setProgress = (key: keyof CaseProgress, v: StageProgress) => {
  onChange({ ...value, caseProgress: { ...value.caseProgress, [key]: v } });
};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Single Entry Approach (SEnA)
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
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
              {STATUS_OPTIONS.filter((s): s is CaseStatus => s !== "All").map((s) => (
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
            <Field label="Specify Cause of Action">
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
          <Field label="Remarks">
            <select
              className={inputCls}
              value={value.remarks}
              onChange={(e) => {
                const selected = e.target.value;
                onChange({
                  ...value,
                  remarks: selected,
                  remarkSpecification: selected === "Others" ? value.remarkSpecification ?? "" : "",
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

          {value.remarks === "Others" && (
            <Field label="Specify Remarks">
              <input
                className={inputCls}
                placeholder="Enter remarks"
                value={value.remarkSpecification ?? ""}
                onChange={(e) => onChange({ ...value, remarkSpecification: e.target.value })}
              />
            </Field>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-sky-600">Labor Arbiter (LA)</h3>
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

        <div className="mt-3">
          <Field label="LA Progress">
            <select
              className={inputCls}
              value={value.caseProgress.la}
              onChange={(e) => setProgress("la", e.target.value as StageProgress)}
            >
              {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-600">NLRC</h3>
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

        <div className="mt-3">
          <Field label="NLRC Progress">
            <select
              className={inputCls}
              value={value.caseProgress.nlrc}
              onChange={(e) => setProgress("nlrc", e.target.value as StageProgress)}
            >
              {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Court of Appeals (CA)</h3>
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

        <div className="mt-3">
          <Field label="CA Progress">
            <select
              className={inputCls}
              value={value.caseProgress.ca}
              onChange={(e) => setProgress("ca", e.target.value as StageProgress)}
            >
              {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-rose-600">Supreme Court (SC)</h3>
        <div className="grid gap-4 sm:grid-cols-4">
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

        <div className="mt-3">
          <Field label="SC Progress">
            <select
              className={inputCls}
              value={value.caseProgress.sc}
              onChange={(e) => setProgress("sc", e.target.value as StageProgress)}
            >
              {PROGRESS_OPTIONS.filter((p): p is StageProgress => p !== "All").map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
              <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Total Amount Paid
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <CurrencyField
            label="Total Paid"
            value={value.totalPaid.amount}
            onChange={(v) => setTotalPaid("amount", v)}
          />

          <Field label="Category">
            <select
              className={inputCls}
              value={value.totalPaid.category}
              onChange={(e) =>
                setTotalPaid(
                  "category",
                  e.target.value as TotalPaidCategory | ""
                )
              }
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