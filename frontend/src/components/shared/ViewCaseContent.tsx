"use client";

import { useEffect, useState } from "react";
import { Clock3, Landmark, User as UserIcon } from "lucide-react";
import type { CaseItem } from "@/types/case";
import { formatDate, formatDateTime, formatCurrency, formatTotalPaidCategory, getCaseStatusSummary, getTotalJudgmentAward } from "@/lib/caseHelpers";
import { isStageFilled } from "@/lib/caseValidation";
import { fetchCaseHistory, type HistoryOut } from "@/lib/api";
import { DetailRow } from "@/components/shared/DetailRow";
import { StatusBadge } from "./StatusBadge";
import { CaseStatusSummaryBadge } from "@/components/dashboard/CaseStatusSummaryBadge";
import { SectionHeader, STAGE_STYLES } from "@/components/dashboard/form/shared/SectionHeader";

const TO_BE_COMPUTED = "To be computed";

function formatProgress(value: string, specification?: string) {
  if ((value === "Others" || value === "Not Settled") && specification) {
    return `${value} (${specification})`;
  }

  return value || "-";
}

function formatJudgmentAward(info: {
  judgmentAward: string;
  judgmentAwardSpecification?: string;
  judgmentAwardComputedSpecification?: string;
}) {
  if (!info.judgmentAward) return "-";

  if (info.judgmentAward === TO_BE_COMPUTED) {
    return info.judgmentAwardComputedSpecification
      ? `${TO_BE_COMPUTED} (${info.judgmentAwardComputedSpecification})`
      : TO_BE_COMPUTED;
  }

  const amount = formatCurrency(info.judgmentAward);
  return info.judgmentAwardSpecification
    ? `${amount} (${info.judgmentAwardSpecification})`
    : amount;
}

function formatStageRemarks(info: { remarks: string; remarksSpecification?: string }) {
  return info.remarks === "Other" && info.remarksSpecification
    ? `${info.remarks} (${info.remarksSpecification})`
    : info.remarks;
}

// Small label/value pair used in the summary bar at the top of the modal.
function SummaryStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  );
}

// Shared layout for the four tribunal stages (LA / NLRC / CA / SC).
// Short fields share one row; long, wrap-prone fields get a full-width row.
function StageFields({
  info,
  progress,
  progressSpecification,
}: {
  info: CaseItem["la"];
  progress: string;
  progressSpecification?: string;
}) {
  return (
    <div className="grid gap-x-6 sm:grid-cols-3">
      <DetailRow label="Date" value={formatDate(info.date)} />
      <DetailRow label="Status" value={info.status} />
      <DetailRow label="Progress" value={formatProgress(progress, progressSpecification)} />
      <div className="sm:col-span-3">
        <DetailRow label="Judgment Award" value={formatJudgmentAward(info)} />
      </div>
      <div className="sm:col-span-3">
        <DetailRow label="Remarks" value={formatStageRemarks(info)} />
      </div>
    </div>
  );
}

export function ViewCaseContent({ item }: { item: CaseItem }) {
  const [activity, setActivity] = useState<HistoryOut[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const totalJudgmentAward = getTotalJudgmentAward(item);

  useEffect(() => {
    let cancelled = false;
    setActivityLoading(true);
    fetchCaseHistory(item.id)
      .then((entries) => {
        if (!cancelled) setActivity(entries);
      })
      .catch(() => {
        if (!cancelled) setActivity([]);
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  const laEnabled = isStageFilled(item.la);
  const nlrcEnabled = isStageFilled(item.nlrc);
  const caEnabled = isStageFilled(item.ca);
  const scEnabled = isStageFilled(item.sc);

  return (
    <div className="space-y-4">
      {/* SUMMARY BAR — Case ID + Case Status (same badge as the table's
          second column) + Last Updated */}
      <div className="flex flex-wrap items-center gap-x-10 gap-y-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
        <SummaryStat label="Case ID">
          <span className="font-mono">{item.id}</span>
        </SummaryStat>
        <SummaryStat label="Case Status">
          <CaseStatusSummaryBadge status={getCaseStatusSummary(item)} />
        </SummaryStat>
        <SummaryStat label="Last Updated">{formatDate(item.date)}</SummaryStat>
        {item.closed && item.closedDate && (
          <SummaryStat label="Closed Date">{formatDate(item.closedDate)}</SummaryStat>
        )}
      </div>

      <div className={`rounded-xl border ${STAGE_STYLES.sena.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="sena" title="Single Entry Approach (SEnA)" size={7} />
        <div className="grid gap-x-6 sm:grid-cols-2">
          <DetailRow label="Company" value={item.company} />
          <DetailRow label="SEnA Status" value={<StatusBadge status={item.status} />} />
          <DetailRow label="Case Title" value={item.caseTitle} />
          <DetailRow label="Case No." value={item.caseNo} />
          <DetailRow label="Filing Date" value={formatDate(item.filingDate)} />
          <DetailRow label="Venue" value={item.venue} />
          <DetailRow
            label="Handling Personnel"
            value={
              item.handlingPersonnel === "Others" && item.handlingPersonnelSpecification
                ? `${item.handlingPersonnel} (${item.handlingPersonnelSpecification})`
                : item.handlingPersonnel || "-"
            }
          />
          <DetailRow
            label="Cause of Action"
            value={
              item.cause.length
                ? item.causeSpecification
                  ? `${item.cause.join(", ")} (${item.causeSpecification})`
                  : item.cause.join(", ")
                : "-"
            }
          />
          <div className="sm:col-span-2">
            <DetailRow
              label="Complainants"
              value={
                <ul className="list-disc pl-5">
                  {item.complainants.map((person, index) => (
                    <li key={index}>{person}</li>
                  ))}
                </ul>
              }
            />
          </div>
          <div className="sm:col-span-2">
            <DetailRow
              label="Remarks"
              value={item.remarkSpecification ? `${item.remarks} (${item.remarkSpecification})` : item.remarks}
            />
          </div>
        </div>
      </div>

      {laEnabled && (
        <div className={`rounded-xl border ${STAGE_STYLES.la.ring} bg-white p-4 shadow-sm sm:p-5`}>
          <SectionHeader stage="la" title="Labor Arbiter (LA)" size={7} />
          <StageFields
            info={item.la}
            progress={item.caseProgress.la}
            progressSpecification={item.caseProgress.laSpecification}
          />
        </div>
      )}

      {nlrcEnabled && (
        <div className={`rounded-xl border ${STAGE_STYLES.nlrc.ring} bg-white p-4 shadow-sm sm:p-5`}>
          <SectionHeader stage="nlrc" title="NLRC" size={7} />
          <StageFields
            info={item.nlrc}
            progress={item.caseProgress.nlrc}
            progressSpecification={item.caseProgress.nlrcSpecification}
          />
        </div>
      )}

      {caEnabled && (
        <div className={`rounded-xl border ${STAGE_STYLES.ca.ring} bg-white p-4 shadow-sm sm:p-5`}>
          <SectionHeader stage="ca" title="Court of Appeals (CA)" size={7} />
          <StageFields
            info={item.ca}
            progress={item.caseProgress.ca}
            progressSpecification={item.caseProgress.caSpecification}
          />
        </div>
      )}

      {scEnabled && (
        <div className={`rounded-xl border ${STAGE_STYLES.sc.ring} bg-white p-4 shadow-sm sm:p-5`}>
          <SectionHeader stage="sc" title="Supreme Court (SC)" size={7} />
          <StageFields
            info={item.sc}
            progress={item.caseProgress.sc}
            progressSpecification={item.caseProgress.scSpecification}
          />
        </div>
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          <Landmark size={13} />
          Total Judgment Award
        </h3>
        <div className="grid max-w-sm gap-x-6">
          <DetailRow label="Amount" value={formatCurrency(totalJudgmentAward)} />
          <DetailRow label="Category" value={formatTotalPaidCategory(item.totalPaid?.category)} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <UserIcon size={12} className="text-slate-300" />
        <p>
          Created by <span className="font-medium text-slate-600">{item.createdBy || "-"}</span>
          {item.createdAt && <> on {formatDate(item.createdAt)}</>}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Clock3 className="h-4 w-4 text-[#B08D57]" />
          <div>
            <h3 className="text-sm font-semibold text-[#12331F]">Case activity</h3>
            <p className="text-xs text-slate-500">A record of changes made to this case.</p>
          </div>
        </div>
        {activityLoading ? (
          <p className="text-sm text-slate-400">Loading activity...</p>
        ) : activity.length === 0 ? (
          <p className="text-sm text-slate-400">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3 pl-1">
            {activity.map((entry) => (
              <div key={entry.history_id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                  {entry.performed_by_profile_picture ? (
                    <img
                      src={entry.performed_by_profile_picture}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon size={12} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <p className="text-sm font-medium capitalize text-slate-700">{entry.action}</p>
                    <time className="text-xs text-slate-400">
                      {formatDateTime(entry.created_at)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    By <span className="font-medium text-slate-700">{entry.performed_by_username ?? "-"}</span>
                    {entry.detail ? ` · ${entry.detail}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}