"use client";

import { useEffect, useState } from "react";

// Types
import type { CaseDraft, CaseItem, ModalType, StageProgress, EditRestrictions } from "@/types/case";

// Constants
import { CURRENT_USER, EMPTY_CASE } from "@/constants/caseOptions";

// Data
import { initialCompanies } from "@/data/initialCases";
import { useCases } from "@/context/CasesContext";
import { fetchCompanies, fetchCurrentUser } from "@/lib/api";   // + fetchCurrentUser added

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
/* =========================================================
   PAGE
========================================================= */

export default function CasesPage() {
  /* =======================================================
     CASE DATA
  ======================================================= */

  const { cases, addCase, updateCase, toggleArchive, setCaseClosed, isLoading, loadError, refetch } = useCases();  // Falls back to the bundled initialCompanies list (kept in sync with the
  // same seed CSV) if the API call fails, e.g. backend not running locally.
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

  // NEW — whether the current user is an admin (backend already enforces
  // this on update_case/unclose; this just drives what the UI allows).
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setIsAdmin(user.role === "admin");
      })
      .catch(() => {
        // Ignore — isAdmin stays false, closed-case editing stays locked.
      });

    return () => {
      cancelled = true;
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

  // Archived cases live on a separate page — the summary cards must reflect
  // only active (non-archived) cases, never archived ones.
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

      // Only constrains results when the item is actually closed; a case
      // with no closedDate set (not closed) is excluded once either bound
      // is set, since it has nothing to compare against.
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

  // Clear Closed Date whenever Status moves away from "Closed", since the
  // inputs are hidden and shouldn't silently keep filtering in the background.
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
    setActiveCase(item);
    setModal("view");
  };

  const openEdit = (item: CaseItem) => {
    // Only closed cases are locked from further edits now — "Close Case" is
    // the sole lock mechanism. A resolved (settled) case is no longer
    // auto-locked; the user closes it explicitly when they're done.
    // Admins are exempt from this lock (see case_service.py::update_case).
    if (item.closed && !isAdmin) {   // + admin exemption
      return;
    }

    const gates = getStageGates(item);

    const laProgressIsPending = gates.laFilled && item.caseProgress.la === "";
    const nlrcProgressIsPending = gates.nlrcFilled && item.caseProgress.nlrc === "";
    const caProgressIsPending = gates.caFilled && item.caseProgress.ca === "";

    // "Motion for Reconsideration" (NLRC/CA only — LA doesn't offer this
    // remark option) is an exception to the normal lock-once-filled rule:
    // the stage's Remarks and Progress must stay editable even after the
    // case is saved, since an MR can still be resolved/withdrawn later.
    // Date/Status/Judgment Award (the "details" fieldset) still lock as
    // usual — only the Remarks+Progress fieldset gets the exception.
    const nlrcHasMotionForReconsideration = item.nlrc.remarks === "Motion for Reconsideration";
    const caHasMotionForReconsideration = item.ca.remarks === "Motion for Reconsideration";

    setActiveCase(item);
    setDraft(cloneDraft(item));

    /* SEnA */
    setRestrictSenaEditing(isSenaOnlyCase(item) || gates.laFilled);
    setRestrictSenaRemarksEditing(gates.laFilled);

    /* LA */
    setRestrictLaDetailsEditing(gates.laFilled);
    setRestrictLaProgressOnly(laProgressIsPending);
    setRestrictLaProgressEditing(gates.laFilled && !laProgressIsPending);

    /* NLRC */
    setRestrictNlrcDetailsEditing(gates.nlrcFilled);
    setRestrictNlrcProgressOnly(nlrcProgressIsPending);
    setRestrictNlrcProgressEditing(
      gates.nlrcFilled && !nlrcProgressIsPending && !nlrcHasMotionForReconsideration
    );

    /* CA */
    setRestrictCaDetailsEditing(gates.caFilled);
    setRestrictCaProgressOnly(caProgressIsPending);
    setRestrictCaProgressEditing(
      gates.caFilled && !caProgressIsPending && !caHasMotionForReconsideration
    );

    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setActiveCase(null);

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
      <DashboardHeader onCreate={openCreate} onRefresh={refetch} isRefreshing={isLoading} />

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
        cases={filteredCases}
        onView={openView}
        onEdit={openEdit}
        onToggleArchive={requestToggleArchive}
        canEditClosed={isAdmin}   // + NEW
      />

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

      {/* VIEW CASE MODAL */}
      {modal === "view" && activeCase && <ViewCaseModal item={activeCase} onClose={closeModal} />}

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