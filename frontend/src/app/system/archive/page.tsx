"use client";

import { useMemo, useState } from "react";
import { Archive, Search } from "lucide-react";

import type { CaseItem, StageProgress } from "@/types/case";
import { TABLE_COLUMN_COUNT } from "@/constants/caseOptions";
import { useCases } from "@/context/CasesContext";

import { Modal } from "@/components/shared/Modal";
import { ArchiveConfirmDialog } from "@/components/dashboard/ArchiveConfirmDialog";
import { ViewCaseContent } from "@/components/shared/ViewCaseContent";
import { CaseTableRow } from "@/components/dashboard/CaseTableRow";

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

      {/* TABLE — mirrors Casetable.tsx: same colgroup widths, same Case
          Status/Last Updated leading columns, same yellow/sky/violet/green/
          pink stage colors, and CaseTableRow reused for identical rows. */}
      {archivedCases.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-full table-fixed border-separate border-spacing-0 text-[11px]">
              <colgroup>
                {/* Case Status */}
                <col className="w-20" />
                {/* Last Updated */}
                <col className="w-16" />

                {/* SEnA */}
                <col className="w-32" />
                <col className="w-16" />
                <col className="w-28" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-20" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-16" />
                <col className="w-24" />

                {/* LA */}
                <col className="w-16" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-16" />

                {/* NLRC */}
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-20" />

                {/* CA */}
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-20" />

                {/* SC */}
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-20" />

                {/* Total Paid */}
                <col className="w-28" />
                <col className="w-28" />

                {/* Actions */}
                <col className="w-16" />
              </colgroup>

              <thead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th rowSpan={2} className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-50 p-2 text-left">
                    Case Status
                  </th>
                  <th rowSpan={2} className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-2 text-left">
                    Last Updated
                  </th>

                  <th colSpan={10} className="sticky top-0 z-20 h-9 border-b border-r border-slate-200 bg-yellow-50/60 p-1.5 text-center text-yellow-700">
                    SEnA
                  </th>

                  <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center text-sky-700">
                    Labor Arbiter
                  </th>
                  <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center text-violet-700">
                    National Labor Relations Commission
                  </th>
                  <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-green-50/60 p-1.5 text-center text-green-700">
                    Court of Appeals
                  </th>
                  <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-r border-slate-200 bg-pink-50/60 p-1.5 text-center text-pink-700">
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
                  {/* SEnA */}
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Company</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Case Title</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Case No.</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Complainants</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Venue</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Handling Personnel</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Cause of Action</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-yellow-50/60 p-1.5 text-center">Filing Date</th>
                  <th className="sticky top-9 z-20 border-b border-r border-slate-200 bg-yellow-50/60 p-1.5 text-center">Remarks</th>

                  {/* LA */}
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Date</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Judgment Award</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Remarks</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Progress</th>

                  {/* NLRC */}
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Date</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Judgment Award</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Remarks</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Progress</th>

                  {/* CA */}
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-green-50/60 p-1.5 text-center">Date</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-green-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-green-50/60 p-1.5 text-center">Judgment Award</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-green-50/60 p-1.5 text-center">Remarks</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-green-50/60 p-1.5 text-center">Progress</th>

                  {/* SC */}
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-pink-50/60 p-1.5 text-center">Date</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-pink-50/60 p-1.5 text-center">Status</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-pink-50/60 p-1.5 text-center">Judgment Award</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-pink-50/60 p-1.5 text-center">Remarks</th>
                  <th className="sticky top-9 z-20 border-b border-slate-200 bg-pink-50/60 p-1.5 text-center">Progress</th>
                </tr>
              </thead>

              <tbody>
                {filteredCases.map((item) => (
                  <CaseTableRow
                    key={item.id}
                    item={item}
                    onView={(caseItem) => setViewItem(caseItem)}
                    onEdit={() => {}}
                    onToggleArchive={requestRestore}
                    hideEdit
                  />
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