"use client";

import { useMemo, useState } from "react";
import { Archive } from "lucide-react";

import type { CaseItem, StageProgress } from "@/types/case";
import { getCaseStatusSummary, type CaseStatusSummary } from "@/lib/caseHelpers";
import { useCases } from "@/context/CasesContext";
import { initialCompanies } from "@/data/initialCases";

import { Modal } from "@/components/cases/Modal";
import { ConfirmDialog } from "@/components/cases/ConfirmDialog";
import { ViewCaseContent } from "@/components/cases/ViewCaseContent";
import { CaseFilters, type StageFilterKey } from "@/components/dashboard/CaseFilters";
import { CaseTable } from "@/components/dashboard/CaseTable";

export default function ArchivePage() {
  const { cases, toggleArchive } = useCases();
  const [companies] = useState<string[]>(initialCompanies);

  /* =======================================================
     FILTER STATE — mirrors the dashboard's filters exactly,
     scoped to archived cases.
  ======================================================= */

  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatusSummary>("All");
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [progressFilter, setProgressFilter] = useState<"All" | StageProgress>("All");
  const [stageFilter, setStageFilter] = useState<StageFilterKey>("All");
  const [search, setSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filingDateStart, setFilingDateStart] = useState("");
  const [filingDateEnd, setFilingDateEnd] = useState("");

  const [viewItem, setViewItem] = useState<CaseItem | null>(null);
  const [restoreItem, setRestoreItem] = useState<CaseItem | null>(null);

  const companyOptions = ["All", ...companies];

  const archivedCases = useMemo(() => cases.filter((item) => item.archived), [cases]);

  const filteredCases = useMemo(() => {
    const keyword = search.toLowerCase();

    return archivedCases
      .filter((item) => {
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

        const matchesSearch =
          item.company.toLowerCase().includes(keyword) ||
          item.caseNo.toLowerCase().includes(keyword) ||
          item.complainants.some((name) => name.toLowerCase().includes(keyword)) ||
          item.cause.some((cause) => cause.toLowerCase().includes(keyword));

        return matchesStatus && matchesCompany && matchesProgress && matchesFilingDateRange && matchesSearch;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [archivedCases, statusFilter, companyFilter, progressFilter, stageFilter, filingDateStart, filingDateEnd, search]);

  const activeFilterCount =
    [statusFilter, companyFilter, progressFilter, stageFilter].filter((filter) => filter !== "All").length +
    (search ? 1 : 0) +
    (filingDateStart || filingDateEnd ? 1 : 0);

  const resetFilters = () => {
    setStatusFilter("All");
    setCompanyFilter("All");
    setProgressFilter("All");
    setStageFilter("All");
    setFilingDateStart("");
    setFilingDateEnd("");
    setSearch("");
  };

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

      {/* FILTERS — same component/behavior as the dashboard */}
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
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        showMoreFilters={showMoreFilters}
        onToggleMoreFilters={() => setShowMoreFilters((current) => !current)}
        filingDateStart={filingDateStart}
        onFilingDateStartChange={setFilingDateStart}
        filingDateEnd={filingDateEnd}
        onFilingDateEndChange={setFilingDateEnd}
        filteredCount={filteredCases.length}
        totalCount={archivedCases.length}
        showArchived
        activeFilterCount={activeFilterCount}
        onResetFilters={resetFilters}
      />

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

      {/* TABLE — same columns/layout as the dashboard; edit action hidden
          since archived cases are read-only until restored. */}
      {archivedCases.length > 0 && (
        <CaseTable
          cases={filteredCases}
          onView={setViewItem}
          onEdit={() => {}}
          onToggleArchive={requestRestore}
          hideEdit
        />
      )}

      {/* VIEW MODAL */}
      {viewItem && (
        <Modal title={`${viewItem.caseNo} · ${viewItem.company}`} onClose={() => setViewItem(null)} wide>
          <ViewCaseContent item={viewItem} />
        </Modal>
      )}

      {/* RESTORE CONFIRMATION */}
      {restoreItem && (
        <ConfirmDialog
          title="Restore Case"
          message={`Restore "${restoreItem.caseNo} · ${restoreItem.company}" to the active case list?`}
          confirmLabel="Restore"
          onConfirm={confirmRestore}
          onCancel={() => setRestoreItem(null)}
        />
      )}
    </div>
  );
}