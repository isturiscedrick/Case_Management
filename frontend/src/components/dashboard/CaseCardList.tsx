import { Archive, ArchiveRestore, Bookmark, BookmarkCheck, ChevronDown, Eye, RefreshCw } from "lucide-react";

import type { CaseItem } from "@/types/case";
import { formatCurrency, formatDate, formatTotalPaidCategory, getCaseStatusSummary } from "@/lib/caseHelpers";
import { formatProgress } from "@/components/shared/caseTableHelpers";
import { CaseStatusSummaryBadge } from "@/components/dashboard/CaseStatusSummaryBadge";

const TO_BE_COMPUTED = "To be computed";

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
  return info.judgmentAwardSpecification ? `${amount} (${info.judgmentAwardSpecification})` : amount;
}

const STAGES: Array<{ key: "la" | "nlrc" | "ca" | "sc"; label: string; dot: string }> = [
  { key: "la", label: "LA", dot: "bg-sky-500" },
  { key: "nlrc", label: "NLRC", dot: "bg-violet-500" },
  { key: "ca", label: "CA", dot: "bg-green-500" },
  { key: "sc", label: "SC", dot: "bg-pink-500" },
];

export function CaseCardList({
  cases,
  onView,
  onEdit,
  onToggleArchive,
  hideEdit = false,
  canEditClosed = false,
  onToggleSave,
  savedIds,
  saveActionLabel,
}: {
  cases: CaseItem[];
  onView: (item: CaseItem) => void;
  onEdit: (item: CaseItem) => void;
  onToggleArchive: (item: CaseItem) => void;
  hideEdit?: boolean;
  canEditClosed?: boolean;
  onToggleSave?: (item: CaseItem) => void;
  savedIds?: Set<number>;
  saveActionLabel?: string;
}) {
  if (cases.length === 0) {
    return (
      <div className="flex items-center justify-center p-10 text-center text-sm text-slate-400">
        No cases match your filters. Try a different search or reset the filters.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {cases.map((item) => {
        const isSaved = savedIds?.has(item.id) ?? false;
        const defaultSaveLabel = isSaved ? "Remove from My Cases" : "Save to My Cases";
        const saveLabel = saveActionLabel ?? defaultSaveLabel;
        const isLocked = !!item.closed && !canEditClosed;

        return (
          <details
            key={item.id}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    #{item.id}
                  </span>
                  <CaseStatusSummaryBadge status={getCaseStatusSummary(item)} />
                </div>

                <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">{item.company}</p>
                <p className="truncate font-mono text-[11px] text-slate-500">{item.caseNo}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Updated {formatDate(item.date)}</p>
              </div>

              <ChevronDown
                size={16}
                className="mt-1 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="border-t border-slate-100 px-3 pb-3 pt-2 text-xs">
              {/* SEnA */}
              <div className="rounded-lg bg-yellow-50/60 p-2.5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-700">SEnA</p>
                <dl className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                  <dt className="text-slate-400">Status</dt>
                  <dd className="text-right text-slate-700">{item.status}</dd>
                  <dt className="text-slate-400">Case Title</dt>
                  <dd className="truncate text-right text-slate-700">{item.caseTitle || "-"}</dd>
                  <dt className="text-slate-400">Venue</dt>
                  <dd className="truncate text-right text-slate-700">{item.venue || "-"}</dd>
                  <dt className="text-slate-400">Handling Personnel</dt>
                  <dd className="truncate text-right text-slate-700">{item.handlingPersonnel || "-"}</dd>
                  <dt className="text-slate-400">Filing Date</dt>
                  <dd className="text-right text-slate-700">{formatDate(item.filingDate)}</dd>
                  <dt className="text-slate-400">Remarks</dt>
                  <dd className="truncate text-right text-slate-700">{item.remarks || "-"}</dd>
                </dl>
              </div>

              {/* Stages */}
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {STAGES.map((stage) => {
                  const stageData = item[stage.key];
                  const progress = item.caseProgress[stage.key];
                  const progressSpec = item.caseProgress[`${stage.key}Specification` as const];
                  const hasData = !!(stageData.date || stageData.status || stageData.judgmentAward);

                  return (
                    <div key={stage.key} className="rounded-lg bg-slate-50 p-2.5">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
                        {stage.label}
                      </p>
                      {hasData ? (
                        <dl className="grid grid-cols-2 gap-y-1 gap-x-2">
                          <dt className="text-slate-400">Date</dt>
                          <dd className="text-right text-slate-700">{formatDate(stageData.date)}</dd>
                          <dt className="text-slate-400">Award</dt>
                          <dd className="truncate text-right text-slate-700">{formatJudgmentAward(stageData)}</dd>
                          <dt className="text-slate-400">Progress</dt>
                          <dd className="truncate text-right text-slate-700">
                            {formatProgress(progress, progressSpec)}
                          </dd>
                        </dl>
                      ) : (
                        <p className="text-slate-400">No data</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total paid */}
              <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50/60 p-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Total Paid</span>
                <span className="font-medium text-emerald-800">
                  {item.totalPaid ? formatCurrency(item.totalPaid.amount) : "-"} ·{" "}
                  {formatTotalPaidCategory(item.totalPaid?.category)}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onView(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:bg-slate-50"
                >
                  <Eye size={13} />
                  View
                </button>

                {!hideEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    disabled={isLocked}
                    title={isLocked ? "This case is closed and can no longer be updated." : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition ${
                      isLocked
                        ? "cursor-not-allowed border-slate-100 text-slate-300"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <RefreshCw size={13} />
                    Update
                  </button>
                )}

                {onToggleSave && (
                  <button
                    type="button"
                    onClick={() => onToggleSave(item)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition ${
                      isSaved
                        ? "border-[#B08D57]/40 bg-[#B08D57]/10 text-[#B08D57]"
                        : "border-slate-200 text-slate-600 hover:border-[#B08D57]/40 hover:bg-[#B08D57]/10 hover:text-[#B08D57]"
                    }`}
                  >
                    {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                    {saveLabel}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onToggleArchive(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                >
                  {item.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                  {item.archived ? "Restore" : "Archive"}
                </button>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}