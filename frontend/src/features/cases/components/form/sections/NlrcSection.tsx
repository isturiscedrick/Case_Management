import {
  Building2,
  Lock,
  CheckCircle2,
  Circle,
  Info,
  AlertTriangle,
} from "lucide-react";

import type {
  CaseDraft,
  NlrcInfo,
  StageProgress,
} from "@/types/case";

import {
  PROGRESS_OPTIONS,
  STAGE_REMARKS_OPTIONS,
  STAGE_STATUS_OPTIONS,
} from "@/constants/caseOptions";

import { Field } from "@/components/cases/Field";
import {
  JudgementRewardField,
  inputCls,
} from "@/components/cases/CurrencyField";

const STAGE_STYLES = {
  nlrc: {
    icon: Building2,
    ring: "border-violet-200",
    chip: "bg-violet-50 text-violet-700",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
} as const;

type StatusPillState = "locked" | "progress" | "done";

function StatusPill({
  state,
}: {
  state: StatusPillState;
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
        <CheckCircle2 size={11} />
        Complete
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600">
      <Circle size={11} />
      In progress
    </span>
  );
}

function InfoBanner({
  tone,
  children,
}: {
  tone: "warning" | "info";
  children: React.ReactNode;
}) {
  if (tone === "warning") {
    return (
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
        <AlertTriangle
          size={13}
          className="mt-0.5 shrink-0"
        />
        <p>{children}</p>
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
      <Info
        size={13}
        className="mt-0.5 shrink-0 text-slate-400"
      />
      <p>{children}</p>
    </div>
  );
}

function SectionHeader({
  title,
  status,
}: {
  title: string;
  status?: StatusPillState;
}) {
  const meta = STAGE_STYLES.nlrc;
  const Icon = meta.icon;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.chip}`}
        >
          <Icon size={16} />
        </div>

        <h3
          className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}
        >
          {title}
        </h3>
      </div>

      {status && <StatusPill state={status} />}
    </div>
  );
}

export function NlrcSection({
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
  setNlrc: <K extends keyof NlrcInfo>(
    key: K,
    v: NlrcInfo[K],
  ) => void;
  setProgressSpecification: (
    key: "la" | "nlrc" | "ca" | "sc",
    v: string,
  ) => void;
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
    <div
      className={`rounded-xl border ${STAGE_STYLES.nlrc.ring} bg-white p-4 shadow-sm sm:p-5`}
    >
      <SectionHeader
        title="National Labor Relations Commission (NLRC)"
        status={
          !nlrcVisible
            ? "locked"
            : nlrcFilled
            ? "done"
            : "progress"
        }
      />

      {/* -----------------------------------------------------------
          INFORMATION BANNERS
         ----------------------------------------------------------- */}

      {senaFilled && !laRequired && (
        <InfoBanner tone="info">
          Disabled while LA Progress is "Select Progress" or
          "Settled".
        </InfoBanner>
      )}

      {senaFilled && laRequired && !laFilled && (
        <InfoBanner tone="info">
          Complete all Labor Arbiter (LA) fields above (Date,
          Status, Judgement Reward, Remarks) to unlock this
          section.
        </InfoBanner>
      )}

      {senaFilled &&
        laRequired &&
        laFilled &&
        !nlrcEnabled && (
          <InfoBanner tone="info">
            LA Progress must be "Not Settled" or "Others" to
            unlock NLRC. The case is considered resolved if
            settled at LA.
          </InfoBanner>
        )}

      {restrictNlrcProgressOnly && (
        <InfoBanner tone="warning">
          NLRC details are saved and locked. Update NLRC
          Progress only, then save to continue the case
          workflow.
        </InfoBanner>
      )}

      {/* -----------------------------------------------------------
          NLRC DETAILS
         ----------------------------------------------------------- */}

      {nlrcVisible && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {/* Date + Status */}
            <fieldset
              disabled={restrictNlrcDetailsEditing}
              className="contents"
            >
              <Field label="Date">
                <input
                  type="date"
                  className={inputCls}
                  value={value.nlrc.date}
                  onChange={(e) =>
                    setNlrc("date", e.target.value)
                  }
                />
              </Field>

              <Field label="Status">
                <select
                  className={inputCls}
                  value={value.nlrc.status}
                  onChange={(e) =>
                    setNlrc("status", e.target.value)
                  }
                >
                  <option value="">
                    Select Status
                  </option>

                  {STAGE_STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            {/* -----------------------------------------------------
                JUDGEMENT AWARD

                Intentionally outside restrictNlrcDetailsEditing.
                It remains editable regardless of the detail lock.
               ----------------------------------------------------- */}

            <JudgementRewardField
              label="Judgement Award"
              value={value.nlrc.judgementReward}
              onChange={(v) =>
                setNlrc("judgementReward", v)
              }
              amountSpecValue={
                value.nlrc.judgementRewardSpecification
              }
              onAmountSpecChange={(v) =>
                setNlrc(
                  "judgementRewardSpecification",
                  v,
                )
              }
              computedSpecValue={
                value.nlrc
                  .judgementRewardComputedSpecification
              }
              onComputedSpecChange={(v) =>
                setNlrc(
                  "judgementRewardComputedSpecification",
                  v,
                )
              }
            />

            {/* Remarks */}
            <fieldset
              disabled={restrictNlrcDetailsEditing}
              className="contents"
            >
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
                        remarksSpecification:
                          selected === "Other"
                            ? value.nlrc
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
                    ),
                  )}
                </select>
              </Field>
            </fieldset>
          </div>

          {/* -------------------------------------------------------
              NLRC REMARK SPECIFICATION
             ------------------------------------------------------- */}

          {value.nlrc.remarks === "Other" && (
            <fieldset
              disabled={restrictNlrcDetailsEditing}
              className="contents"
            >
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field label="Specify Remarks">
                  <input
                    className={inputCls}
                    placeholder="Enter remarks"
                    value={
                      value.nlrc
                        .remarksSpecification ??
                      ""
                    }
                    onChange={(e) =>
                      setNlrc(
                        "remarksSpecification",
                        e.target.value,
                      )
                    }
                  />
                </Field>
              </div>
            </fieldset>
          )}
        </>
      )}

      {/* -----------------------------------------------------------
          NLRC PROGRESS
         ----------------------------------------------------------- */}

      {nlrcVisible && (
        <div className="mt-3">
          <Field label="NLRC Progress">
            <select
              className={inputCls}
              value={value.caseProgress.nlrc}
              disabled={
                restrictNlrcProgressEditing
              }
              onChange={(e) => {
                const selected =
                  e.target.value as StageProgress;

                /*
                 * Check whether CA already contains ANY data.
                 * We intentionally check partial data too so that
                 * changing NLRC Progress cannot leave stale CA
                 * information behind.
                 */

                const caHasData =
                  !!value.ca.date ||
                  !!value.ca.status ||
                  !!value.ca.judgementReward ||
                  !!value.ca
                    .judgementRewardSpecification ||
                  !!value.ca
                    .judgementRewardComputedSpecification ||
                  !!value.ca.remarks ||
                  !!value.ca
                    .remarksSpecification ||
                  !!value.caseProgress.ca ||
                  !!value.caseProgress
                    .caSpecification;

                /*
                 * If the user moves away from
                 * "Not Settled" / "Others", CA must be
                 * reset because the workflow can no longer
                 * proceed to CA.
                 */

                const shouldResetCa =
                  caHasData &&
                  selected !== "Not Settled" &&
                  selected !== "Others";

                /*
                 * Category should be cleared when NLRC
                 * Progress becomes Not Settled or Others.
                 */

                const shouldResetCategory =
                  selected === "Not Settled" ||
                  selected === "Others";

                onChange({
                  ...value,

                  caseProgress: {
                    ...value.caseProgress,

                    nlrc: selected,

                    ...(selected === "Others" ||
                    selected === "Not Settled"
                      ? {}
                      : {
                          nlrcSpecification: "",
                        }),

                    ...(shouldResetCa
                      ? {
                          ca: "",
                          caSpecification: "",
                        }
                      : {}),
                  },

                  ...(shouldResetCa
                    ? {
                        ca: {
                          ...value.ca,
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
                (
                  p,
                ): p is StageProgress =>
                  p !== "All",
              ).map((p) => (
                <option
                  key={p}
                  value={p}
                >
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {/* -----------------------------------------------------------
          NLRC PROGRESS SPECIFICATION
         ----------------------------------------------------------- */}

      {nlrcVisible &&
        (value.caseProgress.nlrc ===
          "Others" ||
          value.caseProgress.nlrc ===
            "Not Settled") && (
          <fieldset
            disabled={
              restrictNlrcProgressEditing
            }
            className="contents"
          >
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Specify NLRC Progress">
                <input
                  className={inputCls}
                  placeholder="Enter progress"
                  value={
                    value.caseProgress
                      .nlrcSpecification ??
                    ""
                  }
                  onChange={(e) =>
                    setProgressSpecification(
                      "nlrc",
                      e.target.value,
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