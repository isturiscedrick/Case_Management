import { Gavel, Lock } from "lucide-react";
import type { ReactNode } from "react";

import type {
  CaseDraft,
  LaInfo,
  StageProgress,
} from "@/types/case";

import {
  PROGRESS_OPTIONS,
  STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";

import { Field } from "@/components/cases/Field";
import {
  inputCls,
  JudgementRewardField,
} from "@/components/cases/CurrencyField";

type LaSectionProps = {
  value: CaseDraft;
  onChange: (next: CaseDraft) => void;

  setLa: <K extends keyof LaInfo>(
    key: K,
    value: LaInfo[K]
  ) => void;

  setProgressSpecification: (
    key: "la" | "nlrc" | "ca" | "sc",
    value: string
  ) => void;

  senaFilled: boolean;
  laRequired: boolean;
  laFilled: boolean;
  laVisible: boolean;

  restrictLaDetailsEditing: boolean;
  restrictLaProgressOnly: boolean;
  restrictLaProgressEditing: boolean;
};

const STAGE_STYLE = {
  ring: "border-sky-200",
  chip: "bg-sky-50 text-sky-700",
  text: "text-sky-700",
};

type StatusState = "locked" | "progress" | "done";

function StatusPill({
  state,
}: {
  state: StatusState;
}) {
  if (state === "locked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
        <Lock size={11} />
        Locked
      </span>
    );
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
        ✓ Complete
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600">
      ○ In progress
    </span>
  );
}

function InfoBanner({
  tone,
  children,
}: {
  tone: "warning" | "info";
  children: ReactNode;
}) {
  if (tone === "warning") {
    return (
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
        <span className="mt-0.5 shrink-0">⚠</span>
        <p>{children}</p>
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
      <span className="mt-0.5 shrink-0">ⓘ</span>
      <p>{children}</p>
    </div>
  );
}

function SectionHeader({
  status,
}: {
  status: StatusState;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${STAGE_STYLE.chip}`}
        >
          <Gavel size={16} />
        </div>

        <h3
          className={`text-xs font-semibold uppercase tracking-wide ${STAGE_STYLE.text}`}
        >
          Labor Arbiter (LA)
        </h3>
      </div>

      <StatusPill state={status} />
    </div>
  );
}

export function LaSection({
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
}: LaSectionProps) {
  return (
    <div
      className={`rounded-xl border ${STAGE_STYLE.ring} bg-white p-4 shadow-sm sm:p-5`}
    >
      <SectionHeader
        status={
          !laVisible
            ? "locked"
            : laFilled
              ? "done"
              : "progress"
        }
      />

      {/* LA REQUIRED WARNING */}
      {senaFilled && laRequired && !laFilled && (
        <InfoBanner tone="warning">
          SEnA Remarks is "Not Settled" or "Others" — LA fields
          (Date, Status, Judgement Reward, Remarks) are now required
          to create the case. LA Progress is optional.
        </InfoBanner>
      )}

      {/* LA DISABLED */}
      {senaFilled && !laRequired && (
        <InfoBanner tone="info">
          Disabled while SEnA Remarks is "Select Remarks" or
          "Settled", or while Specify Remarks is empty for
          "Not Settled"/"Others".
        </InfoBanner>
      )}

      {/* LA DETAILS LOCKED */}
      {restrictLaProgressOnly && (
        <InfoBanner tone="warning">
          LA details are saved and locked. Update LA Progress only,
          then save to continue the case workflow.
        </InfoBanner>
      )}

      {laVisible && (
        <>
          {/* ================================================ */}
          {/* LA DETAILS */}
          {/* ================================================ */}

          <div className="grid gap-4 sm:grid-cols-4">
            <fieldset
              disabled={restrictLaDetailsEditing}
              className="contents"
            >
              <Field label="Date">
                <input
                  type="date"
                  className={inputCls}
                  value={value.la.date}
                  onChange={(e) =>
                    setLa("date", e.target.value)
                  }
                />
              </Field>

              <Field label="Status">
                <select
                  className={inputCls}
                  value={value.la.status}
                  onChange={(e) =>
                    setLa("status", e.target.value)
                  }
                >
                  <option value="">
                    Select Status
                  </option>

                  {STAGE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            {/* ================================================= */}
            {/* JUDGEMENT REWARD */}
            {/* ================================================= */}

            <JudgementRewardField
              label="Judgement Reward"
              value={value.la.judgementReward}
              onChange={(v) =>
                setLa("judgementReward", v)
              }
              amountSpecValue={
                value.la.judgementRewardSpecification
              }
              onAmountSpecChange={(v) =>
                setLa(
                  "judgementRewardSpecification",
                  v
                )
              }
              computedSpecValue={
                value.la.judgementRewardComputedSpecification
              }
              onComputedSpecChange={(v) =>
                setLa(
                  "judgementRewardComputedSpecification",
                  v
                )
              }
            />

            {/* ================================================= */}
            {/* LA REMARKS */}
            {/* ================================================= */}

            <fieldset
              disabled={restrictLaDetailsEditing}
              className="contents"
            >
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

                        remarksSpecification:
                          selected === "Other"
                            ? value.la
                                .remarksSpecification ??
                              ""
                            : "",
                      },
                    });
                  }}
                >
                  <option value="">
                    Select Remarks
                  </option>

                  {STAGE_REMARKS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </fieldset>
          </div>

          {/* ================================================ */}
          {/* SPECIFY LA REMARKS */}
          {/* ================================================ */}

          {value.la.remarks === "Other" && (
            <fieldset
              disabled={restrictLaDetailsEditing}
              className="contents"
            >
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field label="Specify Remarks">
                  <input
                    className={inputCls}
                    placeholder="Enter remarks"
                    value={
                      value.la
                        .remarksSpecification ??
                      ""
                    }
                    onChange={(e) =>
                      setLa(
                        "remarksSpecification",
                        e.target.value
                      )
                    }
                  />
                </Field>
              </div>
            </fieldset>
          )}
        </>
      )}

      {/* ================================================ */}
      {/* LA PROGRESS */}
      {/* ================================================ */}

      {laVisible && (
        <div className="mt-3">
          <Field label="LA Progress">
            <select
              className={inputCls}
              value={value.caseProgress.la}
              disabled={restrictLaProgressEditing}
              onChange={(e) => {
                const selected =
                  e.target.value as StageProgress;

                /*
                 * Check whether NLRC already contains
                 * any information.
                 */
                const nlrcHasData =
                  !!value.nlrc.date ||
                  !!value.nlrc.status ||
                  !!value.nlrc.judgementReward ||
                  !!value.nlrc
                    .judgementRewardSpecification ||
                  !!value.nlrc
                    .judgementRewardComputedSpecification ||
                  !!value.nlrc.remarks ||
                  !!value.nlrc
                    .remarksSpecification ||
                  !!value.caseProgress.nlrc ||
                  !!value.caseProgress
                    .nlrcSpecification;

                /*
                 * If LA moves away from a
                 * "Not Settled"/"Others" state,
                 * clear NLRC.
                 */
                const shouldResetNlrc =
                  nlrcHasData &&
                  selected !== "Not Settled" &&
                  selected !== "Others";

                /*
                 * Clear Total Paid category if
                 * LA is Not Settled/Others.
                 */
                const shouldResetCategory =
                  selected === "Not Settled" ||
                  selected === "Others";

                onChange({
                  ...value,

                  caseProgress: {
                    ...value.caseProgress,

                    la: selected,

                    ...(selected === "Others" ||
                    selected === "Not Settled"
                      ? {}
                      : {
                          laSpecification: "",
                        }),

                    ...(shouldResetNlrc
                      ? {
                          nlrc: "",
                          nlrcSpecification: "",
                        }
                      : {}),
                  },

                  ...(shouldResetNlrc
                    ? {
                        nlrc: {
                          ...value.nlrc,
                          date: "",
                          status: "",
                          judgementReward: "",
                          judgementRewardSpecification:
                            "",
                          judgementRewardComputedSpecification:
                            "",
                          remarks: "",
                          remarksSpecification: "",
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
              <option value="">
                Select Progress
              </option>

              {PROGRESS_OPTIONS.filter(
                (p): p is StageProgress =>
                  p !== "All"
              ).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {/* ================================================ */}
      {/* SPECIFY LA PROGRESS */}
      {/* ================================================ */}

      {laVisible &&
        (value.caseProgress.la === "Others" ||
          value.caseProgress.la === "Not Settled") && (
          <fieldset
            disabled={restrictLaProgressEditing}
            className="contents"
          >
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Specify LA Progress">
                <input
                  className={inputCls}
                  placeholder="Enter progress"
                  value={
                    value.caseProgress
                      .laSpecification ?? ""
                  }
                  onChange={(e) =>
                    setProgressSpecification(
                      "la",
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>
          </fieldset>
        )}
    </div>
  );
}