"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Search } from "lucide-react";

import type { StageProgress } from "@/types/case";
import { useCases } from "@/context/CasesContext";
import { fetchCurrentUser, UnauthorizedError } from "@/lib/api";
import { getCaseStatusSummary, type CaseStatusSummary } from "@/lib/caseHelpers";

import { CaseTable } from "@/components/dashboard/CaseTable";
import { Modal } from "@/components/shared/Modal";
import { ViewCaseContent } from "@/components/shared/ViewCaseContent";
import type { CaseItem } from "@/types/case";

const PAGE_SIZE = 10;

export default function MyCasesPage() {
  const { cases, isLoading, loadError, refetch } = useCases();
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatusSummary>("All");
  const [progressFilter, setProgressFilter] = useState<"All" | StageProgress>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewItem, setViewItem] = useState<CaseItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setCurrentUserName(user.full_name);
      })
      .catch((error) => {
        if (!cancelled && error instanceof UnauthorizedError) {
          window.location.href = "/login";
        }
      })
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cases created by the logged-in user, excluding archived ones (archived
  // cases still live under /system/archive regardless of who created them).
  const myCases = useMemo(
    () => cases.filter((item) => !item.archived && item.createdBy === currentUserName),
    [cases, currentUserName]
  );

  const filteredCases = useMemo(() => {
    const keyword = search.toLowerCase();
    return myCases
      .filter((item) => {
        const matchesStatus = statusFilter === "All" || getCaseStatusSummary(item) === statusFilter;
        const matchesProgress =
          progressFilter === "All" ||
          item.remarks === progressFilter ||
          Object.values(item.caseProgress).some((stage) => stage === progressFilter);
        const matchesSearch =
          item.company.toLowerCase().includes(keyword) ||
          item.caseNo.toLowerCase().includes(keyword) ||
          item.complainants.some((name) => name.toLowerCase().includes(keyword)) ||
          item.cause.some((cause) => cause.toLowerCase().includes(keyword));
        return matchesStatus && matchesProgress && matchesSearch;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [myCases, search, statusFilter, progressFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const paginatedCases = filteredCases.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, progressFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const isBusy = isLoading || userLoading;

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden bg-[#F5F1E3] p-4">
      <div>
        <h1 className="font-serif text-lg font-medium tracking-tight text-[#12331F] md:text-xl">My Cases</h1>
        <p className="mt-0.5 text-xs text-slate-500">Cases you created.</p>
      </div>

      {loadError && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{loadError}</span>
          <button onClick={refetch} className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium hover:bg-rose-100">
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Briefcase size={18} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Cases Created by You</p>
          <p className="text-lg font-semibold tabular-nums text-[#12331F]">{myCases.length}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search my cases"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company, case no., complainant, or cause"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "All" | CaseStatusSummary)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10"
          >
            <option value="All">All Status</option>
            <option value="Settled">Settled</option>
            <option value="Not Settled">Not Settled</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={progressFilter}
            onChange={(event) => setProgressFilter(event.target.value as "All" | StageProgress)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10"
          >
            <option value="All">Any Progress</option>
            <option value="Settled">Any stage: Settled</option>
            <option value="Not Settled">Any stage: Not Settled</option>
            <option value="Others">Any stage: Others</option>
          </select>
        </div>

        <p className="mt-2 text-[11px] text-slate-400">
          Showing {filteredCases.length} of {myCases.length} cases you created
        </p>
      </div>

      {/* EMPTY STATE */}
      {!isBusy && myCases.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#12331F]/5">
            <Briefcase className="h-5 w-5 text-[#12331F]/40" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">No cases yet</p>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Cases you create from the Dashboard will appear here.
          </p>
        </div>
      )}

      {isBusy && myCases.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-sm text-slate-400 shadow-sm">
          Loading your cases…
        </div>
      )}

      {/* TABLE — read-only here; edits still happen from the Dashboard */}
      {myCases.length > 0 && (
        <>
          <CaseTable
            cases={paginatedCases}
            onView={(item) => setViewItem(item)}
            onEdit={() => {}}
            onToggleArchive={() => {}}
          />

          {filteredCases.length > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <p className="text-xs text-slate-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}
                –{Math.min(currentPage * PAGE_SIZE, filteredCases.length)} of {filteredCases.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {viewItem && (
        <Modal title={`${viewItem.caseNo} · ${viewItem.company}`} onClose={() => setViewItem(null)} wide>
          <ViewCaseContent item={viewItem} />
        </Modal>
      )}
    </div>
  );
}