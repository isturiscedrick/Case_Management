import { Archive, ArchiveRestore, Eye, RefreshCw } from "lucide-react";

import type { CaseItem } from "@/types/case";
import { formatCurrency, formatDate, getCaseStatusSummary } from "@/lib/caseHelpers";
import { formatProgress } from "@/components/shared/caseTableHelpers";
import { CaseStatusSummaryBadge } from "@/components/dashboard/CaseStatusSummaryBadge";

const TO_BE_COMPUTED = "To be computed";

// Mirrors ViewCaseContent.tsx's formatJudgmentAward so the table shows the
// same specification text as the view modal, not just the bare amount.
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

export function CaseTableRow({
  item,
  onView,
  onEdit,
  onToggleArchive,
  hideEdit = false,
}: {
  item: CaseItem;
  onView: (item: CaseItem) => void;
  onEdit: (item: CaseItem) => void;
  onToggleArchive: (item: CaseItem) => void;
  // Hides the "Update case" action. Used by the Archive page, where cases
  // are read-only until restored.
  hideEdit?: boolean;
}) {
  // Update is locked only once a case has been explicitly closed via
  // "Close Case" in the form. Being resolved (having a Total Paid category)
  // no longer auto-locks editing — Close Case is the sole lock mechanism.
  const isLocked = !!item.closed;
  const lockReason = "This case is closed and can no longer be updated.";

  return (
    <tr className="group border-b border-slate-100 last:border-0 hover:bg-slate-50">
      {/* Case Status (overall, across all stages) */}
      <td className="sticky left-0 z-10 border-r border-slate-200 bg-white p-2 group-hover:bg-slate-50">
        <CaseStatusSummaryBadge status={getCaseStatusSummary(item)} />
      </td>

      {/* Last Updated */}
      <td className="border-r border-slate-100 p-2 text-slate-600">{formatDate(item.date)}</td>

      {/* Company */}
      <td title={item.company} className="truncate bg-yellow-50/30 p-2 font-medium text-slate-900">
        {item.company}
      </td>

      {/* Status */}
      <td className="bg-yellow-50/30 p-2 text-slate-600">{item.status}</td>

      {/* Case Title */}
      <td className="truncate bg-yellow-50/30 p-2 text-slate-600">{item.caseTitle}</td>

      {/* Case Number */}
      <td className="truncate bg-yellow-50/30 p-2 font-mono text-[11px] text-slate-500">{item.caseNo}</td>

      {/* Complainants */}
      <td className="bg-yellow-50/30 p-2 text-slate-600">{item.complainants.join(", ")}</td>

      {/* Venue */}
      <td className="truncate bg-yellow-50/30 p-2 text-slate-600">{item.venue}</td>

      {/* Handling Personnel */}
      <td className="truncate bg-yellow-50/30 p-2 text-slate-600">
        {item.handlingPersonnel}
        {item.handlingPersonnel === "Others" && item.handlingPersonnelSpecification && (
          <div className="text-[10px] text-slate-500">({item.handlingPersonnelSpecification})</div>
        )}
      </td>

      {/* Cause of Action */}
      <td className="truncate bg-yellow-50/30 p-2 text-slate-600">
        {item.cause.join(", ")}
        {item.causeSpecification && <div className="text-[10px] text-slate-500">({item.causeSpecification})</div>}
      </td>

      {/* Filing Date */}
      <td className="bg-yellow-50/30 p-2 text-slate-600">{formatDate(item.filingDate)}</td>

      {/* Remarks */}
      <td className="truncate border-r border-slate-100 bg-yellow-50/30 p-2 text-slate-600">
        {item.remarks}
        {item.remarkSpecification && <div className="text-[10px] text-slate-500">({item.remarkSpecification})</div>}
      </td>

         {/* LABOR ARBITER */}
      <td className="bg-sky-50/30 p-2 text-slate-600">{formatDate(item.la.date)}</td>
      <td className="truncate bg-sky-50/30 p-2 text-slate-600">{item.la.status}</td>
      <td className="truncate bg-sky-50/30 p-2 font-medium text-slate-700">{formatJudgmentAward(item.la)}</td>
      <td className="truncate bg-sky-50/30 p-2 text-slate-600">
        {item.la.remarks}
        {item.la.remarks === "Other" && item.la.remarksSpecification && (
          <div className="text-[10px] text-slate-500">({item.la.remarksSpecification})</div>
        )}
      </td>
      <td className="truncate bg-sky-50/30 p-2 text-slate-600">
        {formatProgress(item.caseProgress.la, item.caseProgress.laSpecification)}
      </td>

        {/* NLRC */}
      <td className="bg-violet-50/30 p-2 text-slate-600">{formatDate(item.nlrc.date)}</td>
      <td className="truncate bg-violet-50/30 p-2 text-slate-600">{item.nlrc.status}</td>
      <td className="truncate bg-violet-50/30 p-2 font-medium text-slate-700">{formatJudgmentAward(item.nlrc)}</td>
      <td className="truncate bg-violet-50/30 p-2 text-slate-600">
        {item.nlrc.remarks}
        {item.nlrc.remarks === "Other" && item.nlrc.remarksSpecification && (
          <div className="text-[10px] text-slate-500">({item.nlrc.remarksSpecification})</div>
        )}
      </td>
      <td className="truncate bg-violet-50/30 p-2 text-slate-600">
        {formatProgress(item.caseProgress.nlrc, item.caseProgress.nlrcSpecification)}
      </td>

      {/* COURT OF APPEALS */}
      <td className="bg-green-50/30 p-2 text-slate-600">{formatDate(item.ca.date)}</td>
      <td className="truncate bg-green-50/30 p-2 text-slate-600">{item.ca.status}</td>
      <td className="truncate bg-green-50/30 p-2 font-medium text-slate-700">{formatJudgmentAward(item.ca)}</td>
      <td className="truncate bg-green-50/30 p-2 text-slate-600">
        {item.ca.remarks}
        {item.ca.remarks === "Other" && item.ca.remarksSpecification && (
          <div className="text-[10px] text-slate-500">({item.ca.remarksSpecification})</div>
        )}
      </td>
      <td className="truncate bg-green-50/30 p-2 text-slate-600">
        {formatProgress(item.caseProgress.ca, item.caseProgress.caSpecification)}
      </td>

      {/* SUPREME COURT */}
      <td className="bg-pink-50/30 p-2 text-slate-600">{formatDate(item.sc.date)}</td>
      <td className="truncate bg-pink-50/30 p-2 text-slate-600">{item.sc.status}</td>
      <td className="truncate bg-pink-50/30 p-2 font-medium text-slate-700">{formatJudgmentAward(item.sc)}</td>
      <td className="truncate bg-pink-50/30 p-2 text-slate-600">
        {item.sc.remarks}
        {item.sc.remarks === "Other" && item.sc.remarksSpecification && (
          <div className="text-[10px] text-slate-500">({item.sc.remarksSpecification})</div>
        )}
      </td>
      <td className="truncate bg-pink-50/30 p-2 text-slate-600">
        {formatProgress(item.caseProgress.sc, item.caseProgress.scSpecification)}
      </td>

      {/* TOTAL PAID */}
      <td className="bg-emerald-50/30 p-2 font-medium text-slate-700">
        {item.totalPaid ? formatCurrency(item.totalPaid.amount) : "-"}
      </td>
      <td className="border-r border-slate-200 bg-emerald-50/30 p-2 text-slate-600">
        {item.totalPaid?.category || "-"}
      </td>

      {/* ACTIONS */}
      <td className="p-2">
        <div className="flex gap-1">
          <button
            aria-label="View case"
            onClick={() => onView(item)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
          >
            <Eye size={13} />
          </button>

          {!hideEdit && (
            <button
              aria-label={isLocked ? "Update locked" : "Update case"}
              onClick={() => onEdit(item)}
              disabled={isLocked}
              title={isLocked ? lockReason : undefined}
              className={`rounded-md border p-1.5 transition ${
                isLocked
                  ? "cursor-not-allowed border-slate-100 text-slate-300"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-900"
              }`}
            >
              <RefreshCw size={13} />
            </button>
          )}

          <button
            aria-label={item.archived ? "Restore case" : "Archive case"}
            onClick={() => onToggleArchive(item)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
          >
            {item.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
          </button>
        </div>
      </td>
    </tr>
  );
}