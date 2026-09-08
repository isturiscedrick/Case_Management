"use client";

import { useEffect, useState } from "react";
import { Clock3, Landmark, User } from "lucide-react";
import type { CaseItem } from "@/types/case";
import { formatDate, formatCurrency, formatTotalPaidCategory, getTotalJudgmentAward } from "@/lib/caseHelpers";
import { isStageFilled } from "@/lib/caseValidation";
import { fetchCaseHistory, type HistoryOut } from "@/lib/api";
import { DetailRow } from "@/components/shared/DetailRow";
import { StatusBadge } from "./StatusBadge";
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
      <div className={`rounded-xl border ${STAGE_STYLES.sena.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="sena" title="Single Entry Approach (SEnA)" size={7} />
        <div className="grid gap-x-6 sm:grid-cols-2">
          <DetailRow label="Company" value={item.company} />
          <DetailRow label="Status" value={<StatusBadge status={item.status} />} />
          <DetailRow label="Last Updated" value={formatDate(item.date)} />
          <DetailRow label="Filing Date" value={formatDate(item.filingDate)} />
          <DetailRow label="Case Title" value={item.caseTitle} />
          <DetailRow label="Case No." value={item.caseNo} />
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
          <DetailRow
            label="Remarks"
            value={item.remarkSpecification ? `${item.remarks} (${item.remarkSpecification})` : item.remarks}
          />
        </div>
      </div>

      {laEnabled && (
      <div className={`rounded-xl border ${STAGE_STYLES.la.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="la" title="Labor Arbiter (LA)" size={7} />
        <div className="grid gap-x-6 sm:grid-cols-5">
          <DetailRow label="Date" value={formatDate(item.la.date)} />
          <DetailRow label="Status" value={item.la.status} />
          <DetailRow label="Judgment Reward" value={formatJudgmentAward(item.la)} />
          <DetailRow label="Progress" value={formatProgress(item.caseProgress.la, item.caseProgress.laSpecification)} />
          <DetailRow
            label="Remarks"
            value={
              item.la.remarks === "Other" && item.la.remarksSpecification
                ? `${item.la.remarks} (${item.la.remarksSpecification})`
                : item.la.remarks
            }
          />
        </div>
      </div>
      )}

      {nlrcEnabled && (
      <div className={`rounded-xl border ${STAGE_STYLES.nlrc.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="nlrc" title="NLRC" size={7} />
        <div className="grid gap-x-6 sm:grid-cols-5">
          <DetailRow label="Date" value={formatDate(item.nlrc.date)} />
          <DetailRow label="Status" value={item.nlrc.status} />
          <DetailRow label="Judgment Award" value={formatJudgmentAward(item.nlrc)} />
          <DetailRow label="Progress" value={formatProgress(item.caseProgress.nlrc, item.caseProgress.nlrcSpecification)} />
          <DetailRow
            label="Remarks"
            value={
              item.nlrc.remarks === "Other" && item.nlrc.remarksSpecification
                ? `${item.nlrc.remarks} (${item.nlrc.remarksSpecification})`
                : item.nlrc.remarks
            }
          />
        </div>
      </div>
      )}

      {caEnabled && (
      <div className={`rounded-xl border ${STAGE_STYLES.ca.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="ca" title="Court of Appeals (CA)" size={7} />
        <div className="grid gap-x-6 sm:grid-cols-5">
          <DetailRow label="Date" value={formatDate(item.ca.date)} />
          <DetailRow label="Status" value={item.ca.status} />
          <DetailRow label="Judgment Award" value={formatJudgmentAward(item.ca)} />
          <DetailRow label="Progress" value={formatProgress(item.caseProgress.ca, item.caseProgress.caSpecification)} />
          <DetailRow
            label="Remarks"
            value={
              item.ca.remarks === "Other" && item.ca.remarksSpecification
                ? `${item.ca.remarks} (${item.ca.remarksSpecification})`
                : item.ca.remarks
            }
          />
        </div>
      </div>
      )}

      {scEnabled && (
      <div className={`rounded-xl border ${STAGE_STYLES.sc.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="sc" title="Supreme Court (SC)" size={7} />
        <div className="grid gap-x-6 sm:grid-cols-5">
          <DetailRow label="Date" value={formatDate(item.sc.date)} />
          <DetailRow label="Status" value={item.sc.status} />
          <DetailRow label="ment Award" value={formatJudgmentAward(item.sc)} />
          <DetailRow label="Progress" value={formatProgress(item.caseProgress.sc, item.caseProgress.scSpecification)} />
          <DetailRow
            label="Remarks"
            value={
              item.sc.remarks === "Other" && item.sc.remarksSpecification
                ? `${item.sc.remarks} (${item.sc.remarksSpecification})`
                : item.sc.remarks
            }
          />
        </div>
      </div>
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          <Landmark size={13} />
          Total Judgment Reward
        </h3>
        <div className="max-w-sm space-y-3">
          <DetailRow label="Amount" value={formatCurrency(totalJudgmentAward)} />
          <DetailRow label="Category" value={formatTotalPaidCategory(item.totalPaid?.category)} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <User size={12} className="text-slate-300" />
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
          <div className="relative space-y-4 pl-5 before:absolute before:bottom-2 before:left-[6px] before:top-2 before:w-px before:bg-slate-200">
            {activity.map((entry) => (
              <div key={entry.history_id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-slate-50 bg-[#B08D57]" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <p className="text-sm font-medium capitalize text-slate-700">{entry.action}</p>
                  <time className="text-xs text-slate-400">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : "-"}
                  </time>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  By <span className="font-medium text-slate-700">{entry.performed_by_username ?? "-"}</span>
                  {entry.detail ? ` · ${entry.detail}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}