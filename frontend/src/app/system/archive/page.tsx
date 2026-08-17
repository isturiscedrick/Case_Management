"use client";

import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Eye, Search } from "lucide-react";

import type { CaseItem, StageProgress } from "@/types/case";
import { formatDate, formatCurrency } from "@/lib/caseHelpers";
import { TABLE_COLUMN_COUNT } from "@/constants/caseOptions";
import { useCases } from "@/context/CasesContext";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Modal } from "@/components/shared/Modal";
import { ArchiveConfirmDialog } from "@/components/dashboard/ArchiveConfirmDialog";
import { ViewCaseContent } from "@/components/shared/ViewCaseContent";
import { formatProgress } from "@/components/shared/caseTableHelpers";
export default function ArchivePage() {

  const { cases, toggleArchive } = useCases();
  const [search, setSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<"All" | StageProgress>("All");

  const [viewItem, setViewItem] = useState<CaseItem | null>(null);
  const [restoreItem, setRestoreItem] = useState<CaseItem | null>(null);

  const archivedCases = useMemo(() => cases.filter((item) => item.archived), [cases]);

  const filteredCases = useMemo(() => {
    const keyword = search.toLowerCase();
    return archivedCases.filter((item) => {
      const matchesProgress =
        progressFilter === "All" || Object.values(item.caseProgress).some((stage) => stage === progressFilter);

      const matchesSearch =
        item.company.toLowerCase().includes(keyword) ||
        item.caseNo.toLowerCase().includes(keyword) ||
        item.complainants.some((name) => name.toLowerCase().includes(keyword)) ||
        item.cause.some((cause) => cause.toLowerCase().includes(keyword));

      return matchesProgress && matchesSearch;
    });
  }, [archivedCases, search, progressFilter]);

  const requestRestore = (item: CaseItem) => setRestoreItem(item);

  const confirmRestore = () => {
    if (!restoreItem) return;
    // Flip the archived flag through the shared context so the dashboard's
    // active list picks up the restore immediately.
    toggleArchive(restoreItem.id);
    setRestoreItem(null);
  };

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden bg-[#F5F1E3] p-4">
      {/* HEADER */}
      <div>
        <h1 className="font-serif text-lg font-medium tracking-tight text-[#12331F] md:text-xl">Archive</h1>
        <p className="mt-0.5 text-xs text-slate-500">Cases that have been archived from the active dashboard.</p>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, case no., complainant, or cause"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-950/10"
            />
          </div>

          <select
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value as "All" | StageProgress)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white sm:w-48"
          >
            <option value="All">Any Stage Progress</option>
            <option value="Settled">Any stage: Settled</option>
            <option value="Not Settled">Any stage: Not Settled</option>
            <option value="Others">Any stage: Others</option>
          </select>
        </div>

        <p className="mt-2 text-[11px] text-slate-400">
          Showing {filteredCases.length} of {archivedCases.length} archived cases
        </p>
      </div>

      {/* EMPTY STATE */}
      {archivedCases.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#12331F]/5">
            <Archive className="h-5 w-5 text-[#12331F]/40" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">No archived cases yet</p>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Cases you archive from the dashboard will appear here.
          </p>
        </div>
      )}

      {/* TABLE */}
      {archivedCases.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-[11px] table-fixed">
              <colgroup>
                <col className="w-32" />
                <col className="w-16" />
                <col className="w-16" />
                <col className="w-28" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-20" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-16" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-28" />
                <col className="w-16" />
              </colgroup>
              <thead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th rowSpan={2} className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-50 p-2 text-left">
                    Company
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Status
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Last Updated
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Case Title
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Case No.
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Complainants
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Venue
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Handling Personnel
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Cause of Action
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Filing Date
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-2 text-left">
                    Remarks
                  </th>
                  <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center text-sky-700">
                    Labor Arbiter
                  </th>
                  <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center text-violet-700">
                    National Labor Relations Commission
                  </th>
                  <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center text-fuchsia-700">
                    Court of Appeals
                  </th>
                  <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-r border-slate-200 bg-rose-50/60 p-1.5 text-center text-rose-700">
                    Supreme Court
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-emerald-50/60 p-2 text-center text-emerald-700">
                    Amount
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-r border-slate-200 bg-emerald-50/60 p-2 text-center text-emerald-700">
                    Category
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                    Actions
                  </th>
                </tr>
                <tr>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Date</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Judgment Award</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Remarks</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Progress</th>

                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Date</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Judgment Award</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Remarks</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Progress</th>

                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Date</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Judgment Award</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Remarks</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Progress</th>

                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Date</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Judgment Award</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Remarks</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Progress</th>
                </tr>
              </thead>

              <tbody>
                {filteredCases.map((item) => (
                  <tr key={item.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td title={item.company} className="sticky left-0 z-10 truncate border-r border-slate-200 bg-white p-2 font-medium text-slate-900 group-hover:bg-slate-50">
                      {item.company}
                    </td>
                    <td className="p-2">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-2 text-slate-600">{formatDate(item.date)}</td>
                    <td className="truncate p-2 text-slate-600">{item.caseTitle}</td>
                    <td className="truncate p-2 font-mono text-[11px] text-slate-500">{item.caseNo}</td>
                    <td className="p-2 text-slate-600">{item.complainants.join(", ")}</td>
                    <td className="truncate p-2 text-slate-600">{item.venue}</td>
                    <td className="truncate p-2 text-slate-600">
                      {item.handlingPersonnel}
                      {item.handlingPersonnel === "Others" && item.handlingPersonnelSpecification && (
                        <div className="text-[10px] text-slate-500">({item.handlingPersonnelSpecification})</div>
                      )}
                    </td>
                    <td className="truncate p-2 text-slate-600">
                      {item.cause.join(", ")}
                      {item.causeSpecification && <div className="text-[10px] text-slate-500">({item.causeSpecification})</div>}
                    </td>
                    <td className="p-2 text-slate-600">{formatDate(item.filingDate)}</td>
                    <td className="truncate border-r border-slate-100 p-2 text-slate-600">
                      {item.remarks}
                      {item.remarkSpecification && <div className="text-[10px] text-slate-500">({item.remarkSpecification})</div>}
                    </td>

                    <td className="bg-sky-50/30 p-2 text-slate-600">{formatDate(item.la.date)}</td>
                    <td className="truncate bg-sky-50/30 p-2 text-slate-600">{item.la.status}</td>
                    <td className="truncate bg-sky-50/30 p-2 font-medium text-slate-700">{formatCurrency(item.la.judgmentAward)}</td>
                    <td className="truncate bg-sky-50/30 p-2 text-slate-600">
                      {item.la.remarks}
                      {item.la.remarks === "Other" && item.la.remarksSpecification && (
                        <div className="text-[10px] text-slate-500">({item.la.remarksSpecification})</div>
                      )}
                    </td>
                    <td className="truncate bg-sky-50/30 p-2 text-slate-600">
                      {formatProgress(item.caseProgress.la, item.caseProgress.laSpecification)}
                    </td>

                    <td className="bg-violet-50/30 p-2 text-slate-600">{formatDate(item.nlrc.date)}</td>
                    <td className="truncate bg-violet-50/30 p-2 text-slate-600">{item.nlrc.status}</td>
                    <td className="truncate bg-violet-50/30 p-2 font-medium text-slate-700">{formatCurrency(item.nlrc.judgmentAward)}</td>
                    <td className="truncate bg-violet-50/30 p-2 text-slate-600">
                      {item.nlrc.remarks}
                      {item.nlrc.remarks === "Other" && item.nlrc.remarksSpecification && (
                        <div className="text-[10px] text-slate-500">({item.nlrc.remarksSpecification})</div>
                      )}
                    </td>
                    <td className="truncate bg-violet-50/30 p-2 text-slate-600">
                      {formatProgress(item.caseProgress.nlrc, item.caseProgress.nlrcSpecification)}
                    </td>

                    <td className="bg-fuchsia-50/30 p-2 text-slate-600">{formatDate(item.ca.date)}</td>
                    <td className="truncate bg-fuchsia-50/30 p-2 text-slate-600">{item.ca.status}</td>
                    <td className="truncate bg-fuchsia-50/30 p-2 font-medium text-slate-700">{formatCurrency(item.ca.judgmentAward)}</td>
                    <td className="truncate bg-fuchsia-50/30 p-2 text-slate-600">
                      {item.ca.remarks}
                      {item.ca.remarks === "Other" && item.ca.remarksSpecification && (
                        <div className="text-[10px] text-slate-500">({item.ca.remarksSpecification})</div>
                      )}
                    </td>
                    <td className="truncate bg-fuchsia-50/30 p-2 text-slate-600">
                      {formatProgress(item.caseProgress.ca, item.caseProgress.caSpecification)}
                    </td>

                    <td className="bg-rose-50/30 p-2 text-slate-600">{formatDate(item.sc.date)}</td>
                    <td className="truncate bg-rose-50/30 p-2 text-slate-600">{item.sc.status}</td>
                    <td className="truncate bg-rose-50/30 p-2 font-medium text-slate-700">{formatCurrency(item.sc.judgmentAward)}</td>
                    <td className="truncate bg-rose-50/30 p-2 text-slate-600">
                      {item.sc.remarks}
                      {item.sc.remarks === "Other" && item.sc.remarksSpecification && (
                        <div className="text-[10px] text-slate-500">({item.sc.remarksSpecification})</div>
                      )}
                    </td>
                    <td className="truncate bg-rose-50/30 p-2 text-slate-600">
                      {formatProgress(item.caseProgress.sc, item.caseProgress.scSpecification)}
                    </td>

                    <td className="bg-emerald-50/30 p-2 font-medium text-slate-700">
                      {item.totalPaid ? formatCurrency(item.totalPaid.amount) : "-"}
                    </td>
                    <td className="border-r border-slate-200 bg-emerald-50/30 p-2 text-slate-600">
                      {item.totalPaid?.category || "-"}
                    </td>

                    <td className="p-2">
                      <div className="flex gap-1">
                        <button
                          aria-label="View case"
                          onClick={() => setViewItem(item)}
                          className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          aria-label="Restore case"
                          onClick={() => requestRestore(item)}
                          className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <ArchiveRestore size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={TABLE_COLUMN_COUNT} className="p-8 text-center text-sm text-slate-400">
                      No archived cases match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewItem && (
        <Modal title={`${viewItem.caseNo} · ${viewItem.company}`} onClose={() => setViewItem(null)} wide>
          <ViewCaseContent item={viewItem} />
        </Modal>
      )}

      {/* RESTORE CONFIRMATION */}
      {restoreItem && (
        <ArchiveConfirmDialog
          item={restoreItem}
          onConfirm={confirmRestore}
          onCancel={() => setRestoreItem(null)}
        />
      )}
    </div>
  );
}