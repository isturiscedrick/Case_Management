"use client";

import { useEffect, useRef, useState } from "react";
import type { CaseDraft, CaseItem, ModalType, StageProgress, EditRestrictions } from "@/types/case";
import { CURRENT_USER, EMPTY_CASE } from "@/constants/caseOptions";
import { initialCompanies } from "@/data/initialCases";
import { useCases } from "@/context/CasesContext";
import { loadSavedIds, saveSavedIds } from "@/lib/savedCases";  
import {
  fetchCompanies,
  fetchCurrentUser,
  acquireCaseLock,
  heartbeatCaseLock,
  releaseCaseLock,
  LockConflictError,
} from "@/lib/api"; 

import { cloneDraft, getCaseStatusSummary, getTotalJudgmentAward, type CaseStatusSummary } from "@/lib/caseHelpers";
import { getCaseDraftErrors, getStageGates } from "@/lib/caseValidation";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SummaryCards } from "@/components/shared/SummaryCards";
import { CaseFilters, type StageFilterKey } from "@/components/dashboard/CaseFilters";
import { CaseTable } from "@/components/dashboard/CaseTable";
import { CaseFormModal } from "@/components/dashboard/CaseFormModal";
import { ViewCaseModal } from "@/components/dashboard/ViewCaseModal";
import { SaveConfirmDialog } from "@/components/dashboard/SaveConfirmDialog";
import { ArchiveConfirmDialog } from "@/components/dashboard/ArchiveConfirmDialog";
import { isSenaOnlyCase } from "@/components/shared/caseTableHelpers";

const HEARTBEAT_INTERVAL_MS = 20_000;

// + NEW — pagination page size for the case table.
const PAGE_SIZE = 10;

/* =========================================================
   PAGE
========================================================= */

export default function CasesPage() {
  /* =======================================================
     CASE DATA
  ======================================================= */

  const { cases, addCase, updateCase, toggleArchive, setCaseClosed, isLoading, loadError, refetch } = useCases(); 
  const [companies, setCompanies] = useState<string[]>(initialCompanies);

  useEffect(() => {
    let cancelled = false;

    fetchCompanies()
      .then((data) => {
        if (cancelled) return;
        const names = data.map((c) => c.company_name);
        if (names.length > 0) setCompanies(names);
      })
      .catch((err) => {
        console.error("Failed to fetch companies, using fallback list:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);

  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setIsAdmin(user.role === "admin");
        setCurrentUserName(user.full_name);
        setSavedIds(loadSavedIds(user.full_name));
      })
      .catch(() => {
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSave = (item: CaseItem) => {
    if (!currentUserName) return;
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      saveSavedIds(currentUserName, next);
      return next;
    });
  };
  /* =======================================================
     EDIT LOCK STATE  (+ NEW)
  ======================================================= */

  const [lockedByUsername, setLockedByUsername] = useState<string | null>(null);

  const lockedCaseIdRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current !== null) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const startHeartbeat = (caseId: number) => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        await heartbeatCaseLock(caseId);
      } catch (error) {
        stopHeartbeat();
        lockedCaseIdRef.current = null;
        alert(
          error instanceof LockConflictError
            ? `${error.message} Your unsaved changes were not saved — please reopen the case to see the latest version.`
            : "Lost the edit lock for this case. Please reopen it."
        );
        setModal(null);
        setActiveCase(null);
        resetEditRestrictions();
      }
    }, HEARTBEAT_INTERVAL_MS);
  };

  const releaseLockIfHeld = async () => {
    const caseId = lockedCaseIdRef.current;
    if (caseId === null) return;
    lockedCaseIdRef.current = null;
    stopHeartbeat();
    try {
      await releaseCaseLock(caseId);
    } catch {
    }
  };

  useEffect(() => {
    return () => {
      void releaseLockIfHeld();
    };
  }, []);

  /* =======================================================
     FILTER STATE
  ======================================================= */

  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatusSummary>("All");
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [progressFilter, setProgressFilter] = useState<"All" | StageProgress>("All");
  const [stageFilter, setStageFilter] = useState<StageFilterKey>("All");
  const [search, setSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showArchived] = useState(false);
  const [filingDateStart, setFilingDateStart] = useState<string>("");
  const [filingDateEnd, setFilingDateEnd] = useState<string>("");
  const [closedDateStart, setClosedDateStart] = useState<string>("");
  const [closedDateEnd, setClosedDateEnd] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  /* =======================================================
     MODAL STATE
  ======================================================= */

  const [modal, setModal] = useState<ModalType>(null);
  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [draft, setDraft] = useState<CaseDraft>(EMPTY_CASE);

  /* =======================================================
     EDIT RESTRICTIONS
  ======================================================= */

  const [restrictSenaEditing, setRestrictSenaEditing] = useState(false);
  const [restrictSenaRemarksEditing, setRestrictSenaRemarksEditing] = useState(false);
  const [restrictLaDetailsEditing, setRestrictLaDetailsEditing] = useState(false);
  const [restrictLaProgressOnly, setRestrictLaProgressOnly] = useState(false);
  const [restrictLaProgressEditing, setRestrictLaProgressEditing] = useState(false);
  const [restrictNlrcDetailsEditing, setRestrictNlrcDetailsEditing] = useState(false);
  const [restrictNlrcProgressOnly, setRestrictNlrcProgressOnly] = useState(false);
  const [restrictNlrcProgressEditing, setRestrictNlrcProgressEditing] = useState(false);
  const [restrictCaDetailsEditing, setRestrictCaDetailsEditing] = useState(false);
  const [restrictCaProgressOnly, setRestrictCaProgressOnly] = useState(false);
  const [restrictCaProgressEditing, setRestrictCaProgressEditing] = useState(false);

  /* =======================================================
     CONFIRMATION STATE
  ======================================================= */

  const [confirmSave, setConfirmSave] = useState<"create" | "edit" | null>(null);
  const [confirmArchiveItem, setConfirmArchiveItem] = useState<CaseItem | null>(null);

  /* =======================================================
     DERIVED VALUES
  ======================================================= */

  const companyOptions = ["All", ...companies];

  const activeCases = cases.filter((item) => !item.archived);

  const filteredCases = cases
    .filter((item) => {
      const matchesArchived = showArchived ? item.archived : !item.archived;

      const matchesStatus = statusFilter === "All" || getCaseStatusSummary(item) === statusFilter;

      const matchesCompany = companyFilter === "All" || item.company === companyFilter;

      const matchesProgress =
        progressFilter === "All" ||
        (stageFilter === "All"
          ? item.remarks === progressFilter ||
            Object.values(item.caseProgress).some((stage) => stage === progressFilter)
          : stageFilter === "sena"
          ? item.remarks === progressFilter
          : item.caseProgress[stageFilter] === progressFilter);

      const matchesFilingDateRange =
        (!filingDateStart || item.filingDate >= filingDateStart) &&
        (!filingDateEnd || item.filingDate <= filingDateEnd);

      const matchesClosedDateRange =
        !closedDateStart && !closedDateEnd
          ? true
          : !!item.closedDate &&
            (!closedDateStart || item.closedDate >= closedDateStart) &&
            (!closedDateEnd || item.closedDate <= closedDateEnd);

      const keyword = search.toLowerCase();

      const matchesSearch =
        item.company.toLowerCase().includes(keyword) ||
        item.caseNo.toLowerCase().includes(keyword) ||
        item.complainants.some((name) => name.toLowerCase().includes(keyword)) ||
        item.cause.some((cause) => cause.toLowerCase().includes(keyword));

      return matchesArchived && matchesStatus && matchesCompany && matchesProgress && matchesFilingDateRange && matchesClosedDateRange && matchesSearch;
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const activeFilterCount =
    [statusFilter, companyFilter, progressFilter, stageFilter].filter((filter) => filter !== "All").length +
    (search ? 1 : 0) +
    (filingDateStart || filingDateEnd ? 1 : 0) +
    (closedDateStart || closedDateEnd ? 1 : 0);

  const activeCaseCount = cases.filter((item) => item.archived === showArchived).length;

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    companyFilter,
    progressFilter,
    stageFilter,
    filingDateStart,
    filingDateEnd,
    closedDateStart,
    closedDateEnd,
  ]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  /* =======================================================
     RESET EDIT RESTRICTIONS
  ======================================================= */

  const resetEditRestrictions = () => {
    setRestrictSenaEditing(false);
    setRestrictSenaRemarksEditing(false);

    setRestrictLaDetailsEditing(false);
    setRestrictLaProgressOnly(false);
    setRestrictLaProgressEditing(false);

    setRestrictNlrcDetailsEditing(false);
    setRestrictNlrcProgressOnly(false);
    setRestrictNlrcProgressEditing(false);

    setRestrictCaDetailsEditing(false);
    setRestrictCaProgressOnly(false);
    setRestrictCaProgressEditing(false);
  };

  /* =======================================================
     FILTER ACTIONS
  ======================================================= */

  const resetFilters = () => {
    setStatusFilter("All");
    setCompanyFilter("All");
    setProgressFilter("All");
    setStageFilter("All");
    setFilingDateStart("");
    setFilingDateEnd("");
    setClosedDateStart("");
    setClosedDateEnd("");
    setSearch("");
  };

  const handleStatusFilterChange = (value: "All" | CaseStatusSummary) => {
    setStatusFilter(value);
    if (value !== "Closed") {
      setClosedDateStart("");
      setClosedDateEnd("");
    }
  };

  /* =======================================================
     MODAL ACTIONS
  ======================================================= */

  const openCreate = () => {
    setDraft(cloneDraft(EMPTY_CASE));
    resetEditRestrictions();

    setActiveCase(null);
    setModal("create");
  };

  const openView = (item: CaseItem) => {
    setLockedByUsername(null); 
    setActiveCase(item);
    setModal("view");
  };

  const openEdit = async (item: CaseItem) => {
    if (item.closed && !isAdmin) {   // + admin exemption
      return;
    }

    try {
      await acquireCaseLock(item.id);
    } catch (error) {
      if (error instanceof LockConflictError) {
        setLockedByUsername(error.lockedBy);
        setActiveCase(item);
        setModal("view");
        return;
      }
      alert(error instanceof Error ? error.message : "Unable to open this case for editing right now.");
      return;
    }

    lockedCaseIdRef.current = item.id;
    startHeartbeat(item.id);

    const gates = getStageGates(item);

    const laProgressIsPending = gates.laFilled && item.caseProgress.la === "";
    const nlrcProgressIsPending = gates.nlrcFilled && item.caseProgress.nlrc === "";
    const caProgressIsPending = gates.caFilled && item.caseProgress.ca === "";
    const nlrcHasMotionForReconsideration = item.nlrc.remarks === "Motion for Reconsideration";
    const caHasMotionForReconsideration = item.ca.remarks === "Motion for Reconsideration";

    setActiveCase(item);
    setDraft(cloneDraft(item));

    const bypassFieldLocks = isAdmin;

    /* SEnA */
    setRestrictSenaEditing(!bypassFieldLocks && (isSenaOnlyCase(item) || gates.laFilled));
    setRestrictSenaRemarksEditing(!bypassFieldLocks && gates.laFilled);

    /* LA */
    setRestrictLaDetailsEditing(!bypassFieldLocks && gates.laFilled);
    setRestrictLaProgressOnly(!bypassFieldLocks && laProgressIsPending);
    setRestrictLaProgressEditing(!bypassFieldLocks && gates.laFilled && !laProgressIsPending);

    /* NLRC */
    setRestrictNlrcDetailsEditing(!bypassFieldLocks && gates.nlrcFilled);
    setRestrictNlrcProgressOnly(!bypassFieldLocks && nlrcProgressIsPending);
    setRestrictNlrcProgressEditing(
      !bypassFieldLocks && gates.nlrcFilled && !nlrcProgressIsPending && !nlrcHasMotionForReconsideration
    );

    /* CA */
    setRestrictCaDetailsEditing(!bypassFieldLocks && gates.caFilled);
    setRestrictCaProgressOnly(!bypassFieldLocks && caProgressIsPending);
    setRestrictCaProgressEditing(
      !bypassFieldLocks && gates.caFilled && !caProgressIsPending && !caHasMotionForReconsideration
    );

    setModal("edit");
  };

  const closeModal = () => {
    void releaseLockIfHeld(); 
    setModal(null);
    setActiveCase(null);
    setLockedByUsername(null); 

    resetEditRestrictions();
  };

  /* =======================================================
     CREATE / EDIT VALIDATION
  ======================================================= */

  const requestSaveCreate = () => {
    const errors = getCaseDraftErrors(draft);

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    setConfirmSave("create");
  };

  const requestSaveEdit = () => {
    const errors = getCaseDraftErrors(draft);

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    setConfirmSave("edit");
  };

  /* =======================================================
     SAVE CASE
  ======================================================= */

  const saveCreate = async () => {
    const nextId = Math.max(0, ...cases.map((item) => item.id)) + 1;
    const today = new Date().toISOString().slice(0, 10);

    const newCase: CaseItem = {
      ...draft,
      id: nextId,
      date: today,
      createdBy: CURRENT_USER,
      createdAt: today,
      totalPaid: {
        ...draft.totalPaid,
        amount: getTotalJudgmentAward(draft),
      },
    };

    try {
      await addCase(newCase);
      setConfirmSave(null);
      closeModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to create the case.");
    }
  };

  const saveEdit = async () => {
    if (!activeCase) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const updatedCase: CaseItem = {
      ...draft,
      id: activeCase.id,
      date: today,
      totalPaid: {
        ...draft.totalPaid,
        amount: getTotalJudgmentAward(draft),
      },
    };

    try {
      await updateCase(updatedCase);
      if (!!updatedCase.closed !== !!activeCase.closed) {
        await setCaseClosed(updatedCase.id, !!updatedCase.closed);
      }
      setConfirmSave(null);
      closeModal(); 
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to save the case.");
    }
  };

  const confirmSaveAction = async () => {
    if (confirmSave === "create") {
      saveCreate();
      return;
    }

    if (confirmSave === "edit") {
      saveEdit();
    }
  };

  /* =======================================================
     ARCHIVE / RESTORE
  ======================================================= */

  const requestToggleArchive = (item: CaseItem) => {
    setConfirmArchiveItem(item);
  };

  const confirmToggleArchive = async () => {
    if (!confirmArchiveItem) {
      return;
    }

    try {
      await toggleArchive(confirmArchiveItem.id);
      setConfirmArchiveItem(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to update the archive status.");
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden bg-[#F5F1E3] p-4">
            {loadError && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{loadError}</span>
          <button
            onClick={refetch}
            className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && cases.length === 0 && !loadError && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-sm text-slate-400 shadow-sm">
          Loading cases…
        </div>
      )}
      <DashboardHeader onCreate={openCreate} />

      <SummaryCards cases={activeCases} />

      <CaseFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        companyFilter={companyFilter}
        onCompanyFilterChange={setCompanyFilter}
        companyOptions={companyOptions}
        progressFilter={progressFilter}
        onProgressFilterChange={setProgressFilter}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        showMoreFilters={showMoreFilters}
        onToggleMoreFilters={() => setShowMoreFilters((current) => !current)}
        filingDateStart={filingDateStart}
        onFilingDateStartChange={setFilingDateStart}
        filingDateEnd={filingDateEnd}
        onFilingDateEndChange={setFilingDateEnd}
        closedDateStart={closedDateStart}
        onClosedDateStartChange={setClosedDateStart}
        closedDateEnd={closedDateEnd}
        onClosedDateEndChange={setClosedDateEnd}
        filteredCount={filteredCases.length}
        totalCount={activeCaseCount}
        showArchived={showArchived}
        activeFilterCount={activeFilterCount}
        onResetFilters={resetFilters}
      />

      <CaseTable
        cases={paginatedCases}
        onView={openView}
        onEdit={openEdit}
        onToggleArchive={requestToggleArchive}
        canEditClosed={isAdmin}
        onToggleSave={toggleSave}  
        savedIds={savedIds}      
      />

      {/* + NEW — pagination controls (10 cases per page) */}
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

      {/* CREATE CASE MODAL */}
      {modal === "create" && (
        <CaseFormModal
          mode="create"
          activeCase={null}
          draft={draft}
          onChange={setDraft}
          companies={companies}
          onCancel={closeModal}
          onSave={requestSaveCreate}
        />
      )}

      {/* VIEW CASE MODAL (also used as the read-only "locked by X" view — + NEW) */}
      {modal === "view" && activeCase && (
        <ViewCaseModal
          item={activeCase}
          onClose={closeModal}
          lockedByUsername={lockedByUsername ?? undefined}
        />
      )}

      {/* EDIT CASE MODAL */}
      {modal === "edit" && activeCase && (
        <CaseFormModal
          key={activeCase.id}
          mode="edit"
          activeCase={activeCase}
          draft={draft}
          onChange={setDraft}
          companies={companies}
          isAdmin={isAdmin}   // + NEW
          editRestrictions={{
            restrictSenaEditing,
            restrictSenaRemarksEditing,
            restrictLaDetailsEditing,
            restrictLaProgressOnly,
            restrictLaProgressEditing,
            restrictNlrcDetailsEditing,
            restrictNlrcProgressOnly,
            restrictNlrcProgressEditing,
            restrictCaDetailsEditing,
            restrictCaProgressOnly,
            restrictCaProgressEditing,
          }}
          onCancel={closeModal}
          onSave={requestSaveEdit}
        />
      )}

      {/* CREATE / EDIT CONFIRMATION */}
      {confirmSave && (
        <SaveConfirmDialog
          mode={confirmSave}
          draft={draft}
          activeCase={activeCase}
          onConfirm={confirmSaveAction}
          onCancel={() => setConfirmSave(null)}
        />
      )}

      {/* ARCHIVE / RESTORE CONFIRMATION */}
      {confirmArchiveItem && (
        <ArchiveConfirmDialog
          item={confirmArchiveItem}
          onConfirm={confirmToggleArchive}
          onCancel={() => setConfirmArchiveItem(null)}
        />
      )}
    </div>
  );
}