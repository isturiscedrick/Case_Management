"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, EyeOff, Plus, Search, Undo2 } from "lucide-react";

import type { CaseDraft, StageProgress } from "@/types/case";
import { EMPTY_CASE } from "@/constants/caseOptions";
import { useCases } from "@/context/CasesContext";
import { fetchCurrentUser, UnauthorizedError } from "@/lib/api";
import { cloneDraft, getCaseStatusSummary, getTotalJudgmentAward, type CaseStatusSummary } from "@/lib/caseHelpers";
import { getCaseDraftErrors } from "@/lib/caseValidation";

import { CaseTable } from "@/components/dashboard/CaseTable";
import { CaseFormModal } from "@/components/dashboard/CaseFormModal";
import { SaveConfirmDialog } from "@/components/dashboard/SaveConfirmDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { ViewCaseContent } from "@/components/shared/ViewCaseContent";
import type { CaseItem } from "@/types/case";

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------
// "Hidden from My Cases" — purely a view-level preference, scoped to this
// browser + this user. Hiding a case here does NOT archive, close, or
// otherwise change it anywhere else in the app (Dashboard, Archive,
// Analytics, History all still show it normally). Stored in localStorage
// since this is cosmetic-only and not something the backend needs to know
// about; if the user clears storage or switches devices, hidden cases
// simply reappear.
// ---------------------------------------------------------------------

function hiddenStorageKey(username: string) {
  return `mycases:hidden:${username}`;
}

function loadHiddenIds(username: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(hiddenStorageKey(username));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveHiddenIds(username: string, ids: Set<number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(hiddenStorageKey(username), JSON.stringify(Array.from(ids)));
  } catch {
    // Storage full/unavailable — hiding just won't persist across reloads.
  }
}

export default function MyCasesPage() {
  const { cases, addCase, isLoading, loadError, refetch } = useCases();
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatusSummary>("All");
  const [progressFilter, setProgressFilter] = useState<"All" | StageProgress>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewItem, setViewItem] = useState<CaseItem | null>(null);

  // Hidden-from-view case ids (per current user), plus whether the "Hidden
  // cases" panel is expanded so removed cases aren't just gone forever
  // without a way back.
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  const [hideConfirmItem, setHideConfirmItem] = useState<CaseItem | null>(null);

  // Create Case modal state — same draft/save flow as the Dashboard.
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draft, setDraft] = useState<CaseDraft>(EMPTY_CASE);
  const [confirmCreate, setConfirmCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) {
          setCurrentUserName(user.full_name);
          setHiddenIds(loadHiddenIds(user.full_name));
        }
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

  function persistHidden(next: Set<number>) {
    setHiddenIds(next);
    if (currentUserName) saveHiddenIds(currentUserName, next);
  }

  function requestHide(item: CaseItem) {
    setHideConfirmItem(item);
  }

  function confirmHide() {
    if (!hideConfirmItem) return;
    const next = new Set(hiddenIds);
    next.add(hideConfirmItem.id);
    persistHidden(next);
    setHideConfirmItem(null);
  }

  function unhide(id: number) {
    const next = new Set(hiddenIds);
    next.delete(id);
    persistHidden(next);
  }

  // Cases created by the logged-in user, excluding archived ones (archived
  // cases still live under /system/archive regardless of who created them).
  const myCases = useMemo(
    () => cases.filter((item) => !item.archived && item.createdBy === currentUserName),
    [cases, currentUserName]
  );

  const visibleMyCases = useMemo(
    () => myCases.filter((item) => !hiddenIds.has(item.id)),
    [myCases, hiddenIds]
  );

  const hiddenMyCases = useMemo(
    () => myCases.filter((item) => hiddenIds.has(item.id)),
    [myCases, hiddenIds]
  );

  const filteredCases = useMemo(() => {
    const keyword = search.toLowerCase();
    return visibleMyCases
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
  }, [visibleMyCases, search, statusFilter, progressFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const paginatedCases = filteredCases.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, progressFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const isBusy = isLoading || userLoading;

  // ---- Create Case ----------------------------------------------------

  function openCreate() {
    setDraft(cloneDraft(EMPTY_CASE));
    setShowCreateModal(true);
  }

  function cancelCreate() {
    setShowCreateModal(false);
  }

  function requestSaveCreate() {
    const errors = getCaseDraftErrors(draft);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
    setConfirmCreate(true);
  }

  async function confirmSaveCreate() {
    const nextId = Math.max(0, ...cases.map((item) => item.id)) + 1;
    const today = new Date().toISOString().slice(0, 10);

    const newCase: CaseItem = {
      ...draft,
      id: nextId,
      date: today,
      createdBy: currentUserName ?? "",
      createdAt: today,
      totalPaid: {
        ...draft.totalPaid,
        amount: getTotalJudgmentAward(draft),
      },
    };

    try {
      await addCase(newCase);
      setConfirmCreate(false);
      setShowCreateModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to create the case.");
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden bg-[#F5F1E3] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-lg font-medium tracking-tight text-[#12331F] md:text-xl">My Cases</h1>
          <p className="mt-0.5 text-xs text-slate-500">Cases you created.</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-lg bg-[#12331F] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1B4A2C] hover:shadow-md sm:self-auto"
        >
          <Plus size={15} />
          Create Case
        </button>
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Cases Created by You</p>
            <p className="text-lg font-semibold tabular-nums text-[#12331F]">{myCases.length}</p>
          </div>
        </div>

        {hiddenMyCases.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHiddenPanel((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-4 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <EyeOff size={14} className="text-slate-400" />
            {hiddenMyCases.length} hidden from this view
            <span className="ml-1 text-slate-400 underline">{showHiddenPanel ? "Hide" : "Show"}</span>
          </button>
        )}
      </div>

      {/* HIDDEN CASES PANEL */}
      {showHiddenPanel && hiddenMyCases.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Hidden from My Cases only — still active everywhere else in the app.
          </p>
          <div className="flex flex-col divide-y divide-slate-100">
            {hiddenMyCases.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{item.caseNo}</p>
                  <p className="truncate text-xs text-slate-400">{item.company}</p>
                </div>
                <button
                  type="button"
                  onClick={() => unhide(item.id)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <Undo2 size={13} />
                  Unhide
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          Showing {filteredCases.length} of {visibleMyCases.length} cases
          {hiddenMyCases.length > 0 ? ` (${hiddenMyCases.length} hidden)` : ""}
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
            Create a case here, or from the Dashboard, and it will appear in this list.
          </p>
        </div>
      )}

      {!isBusy && myCases.length > 0 && visibleMyCases.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#12331F]/5">
            <EyeOff className="h-5 w-5 text-[#12331F]/40" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">All your cases are hidden from this view</p>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Use "Show" above to bring them back.
          </p>
        </div>
      )}

      {isBusy && myCases.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-sm text-slate-400 shadow-sm">
          Loading your cases…
        </div>
      )}

      {/* TABLE — Update stays off here (edits happen from the Dashboard);
          Archive column's action is repurposed as "Remove from My Cases",
          a view-only hide, via onToggleArchive. */}
      {visibleMyCases.length > 0 && (
        <>
          <CaseTable
            cases={paginatedCases}
            onView={(item) => setViewItem(item)}
            onEdit={() => {}}
            onToggleArchive={requestHide}
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

      {/* CREATE CASE MODAL */}
      {showCreateModal && (
        <CaseFormModal
          mode="create"
          activeCase={null}
          draft={draft}
          onChange={setDraft}
          companies={[]}
          onCancel={cancelCreate}
          onSave={requestSaveCreate}
        />
      )}

      {confirmCreate && (
        <SaveConfirmDialog
          mode="create"
          draft={draft}
          activeCase={null}
          onConfirm={confirmSaveCreate}
          onCancel={() => setConfirmCreate(false)}
        />
      )}

      {/* HIDE (REMOVE FROM MY CASES) CONFIRMATION */}
      {hideConfirmItem && (
        <ConfirmDialog
          title="Remove from My Cases"
          message={`Remove "${hideConfirmItem.caseNo} · ${hideConfirmItem.company}" from this My Cases view? It will stay active everywhere else (Dashboard, Archive, Analytics) and you can unhide it anytime.`}
          confirmLabel="Remove from view"
          onConfirm={confirmHide}
          onCancel={() => setHideConfirmItem(null)}
        />
      )}
    </div>
  );
}