"use client";

import { useState } from "react";

// Types
import type { CaseDraft, CaseItem, CaseStatus, ModalType, StageProgress } from "@/types/case";

// Constants
import { CURRENT_USER, EMPTY_CASE } from "@/constants/caseOptions";

// Data
import { initialCases, initialCompanies } from "@/data/initialCases";

// Helpers
import { cloneDraft, getTotalJudgementReward } from "@/lib/caseHelpers";
import { getCaseDraftErrors, getStageGates } from "@/lib/caseValidation";
import { isSenaOnlyCase } from "@/components/dashboard/Dashboardhelpers";

// Dashboard components
import { DashboardHeader } from "@/components/dashboard/Dashboardheader";
import { SummaryCards } from "@/components/dashboard/Summarycards ";
import { CaseFilters } from "@/components/dashboard/Casefilters ";
import { CaseTable } from "@/components/dashboard/Casetable";
import { CaseFormModal } from "@/components/dashboard/Caseformmodal";
import { ViewCaseModal } from "@/components/dashboard/Viewcasemodal";
import { SaveConfirmDialog } from "@/components/dashboard/Saveconfirmdialog";
import { ArchiveConfirmDialog } from "@/components/dashboard/Archiveconfirmdialog";

/* =========================================================
   PAGE
========================================================= */

export default function CasesPage() {
  /* =======================================================
     CASE DATA
  ======================================================= */

  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [companies] = useState<string[]>(initialCompanies);

  /* =======================================================
     FILTER STATE
  ======================================================= */

  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatus>("All");
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [progressFilter, setProgressFilter] = useState<"All" | StageProgress>("All");
  const [search, setSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showArchived] = useState(false);
  const [filingDateStart, setFilingDateStart] = useState<string>("");
  const [filingDateEnd, setFilingDateEnd] = useState<string>("");

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

  const filteredCases = cases
    .filter((item) => {
      const matchesArchived = showArchived ? item.archived : !item.archived;

      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

      const matchesCompany = companyFilter === "All" || item.company === companyFilter;

      const matchesProgress =
        progressFilter === "All" || Object.values(item.caseProgress).some((stage) => stage === progressFilter);

      const matchesFilingDateRange =
        (!filingDateStart || item.filingDate >= filingDateStart) &&
        (!filingDateEnd || item.filingDate <= filingDateEnd);

      const keyword = search.toLowerCase();

      const matchesSearch =
        item.company.toLowerCase().includes(keyword) ||
        item.caseNo.toLowerCase().includes(keyword) ||
        item.complainants.some((name) => name.toLowerCase().includes(keyword)) ||
        item.cause.some((cause) => cause.toLowerCase().includes(keyword));

      return matchesArchived && matchesStatus && matchesCompany && matchesProgress && matchesFilingDateRange && matchesSearch;
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const activeFilterCount =
    [statusFilter, companyFilter, progressFilter].filter((filter) => filter !== "All").length +
    (search ? 1 : 0) +
    (filingDateStart || filingDateEnd ? 1 : 0);

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
    setFilingDateStart("");
    setFilingDateEnd("");
    setSearch("");
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
    // Resolved cases are locked.
    if (item.totalPaid?.category) {
      return;
    }

    const gates = getStageGates(item);

    const laProgressIsPending = gates.laFilled && item.caseProgress.la === "";
    const nlrcProgressIsPending = gates.nlrcFilled && item.caseProgress.nlrc === "";
    const caProgressIsPending = gates.caFilled && item.caseProgress.ca === "";

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
    setRestrictNlrcProgressEditing(gates.nlrcFilled && !nlrcProgressIsPending);

    /* CA */
    setRestrictCaDetailsEditing(gates.caFilled);
    setRestrictCaProgressOnly(caProgressIsPending);
    setRestrictCaProgressEditing(gates.caFilled && !caProgressIsPending);

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

  const saveCreate = () => {
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
        amount: getTotalJudgementReward(draft),
      },
    };

    setCases((prev) => [...prev, newCase]);

    setConfirmSave(null);
    closeModal();
  };

  const saveEdit = () => {
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
        amount: getTotalJudgementReward(draft),
      },
    };

    setCases((prev) => prev.map((item) => (item.id === activeCase.id ? updatedCase : item)));

    setConfirmSave(null);
    closeModal();
  };

  const confirmSaveAction = () => {
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

  const confirmToggleArchive = () => {
    if (!confirmArchiveItem) {
      return;
    }

    setCases((prev) =>
      prev.map((item) => (item.id === confirmArchiveItem.id ? { ...item, archived: !item.archived } : item))
    );

    setConfirmArchiveItem(null);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden bg-[#F5F1E3] p-4">
      <DashboardHeader onCreate={openCreate} />

      <SummaryCards cases={cases} />

      <CaseFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        companyFilter={companyFilter}
        onCompanyFilterChange={setCompanyFilter}
        companyOptions={companyOptions}
        progressFilter={progressFilter}
        onProgressFilterChange={setProgressFilter}
        showMoreFilters={showMoreFilters}
        onToggleMoreFilters={() => setShowMoreFilters((current) => !current)}
        filingDateStart={filingDateStart}
        onFilingDateStartChange={setFilingDateStart}
        filingDateEnd={filingDateEnd}
        onFilingDateEndChange={setFilingDateEnd}
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
          mode="edit"
          activeCase={activeCase}
          draft={draft}
          onChange={setDraft}
          companies={companies}
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