"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Briefcase,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

// Types
import type {
  CaseDraft,
  CaseItem,
  CaseStatus,
  ModalType,
  StageProgress,
} from "@/types/case";

// Constants
import {
  CURRENT_USER,
  EMPTY_CASE,
  PROGRESS_OPTIONS,
  STATUS_OPTIONS,
  TABLE_COLUMN_COUNT,
} from "@/constants/caseOptions";

// Data
import {
  initialCases,
  initialCompanies,
} from "@/data/initialCases";

// Helpers
import {
  cloneDraft,
  formatCurrency,
  formatDate,
  getTotalJudgementReward,
} from "@/lib/caseHelpers";

import {
  getCaseDraftErrors,
  getStageGates,
} from "@/lib/caseValidation";

// Components
import { ConfirmDialog } from "@/components/cases/ConfirmDialog";
import { Modal } from "@/components/cases/Modal";
import { StatusBadge } from "@/components/cases/StatusBadge";
import { SummaryCard } from "@/components/cases/SummaryCard";
import { ViewCaseContent } from "@/components/cases/ViewCaseContent";

import { CaseForm } from "@/components/form/CaseForm";

/* =========================================================
   HELPERS
========================================================= */

/**
 * Returns true when the case has no information yet
 * in LA, NLRC, CA, or SC.
 *
 * This means the case is still SEnA-only.
 */
function isSenaOnlyCase(item: CaseItem) {
  return (
    !item.la.date &&
    !item.la.status &&
    !item.la.judgementReward &&
    !item.la.remarks &&
    !item.la.remarksSpecification &&
    !item.nlrc.date &&
    !item.nlrc.status &&
    !item.nlrc.judgementReward &&
    !item.nlrc.remarks &&
    !item.nlrc.remarksSpecification &&
    !item.ca.date &&
    !item.ca.status &&
    !item.ca.judgementReward &&
    !item.ca.remarks &&
    !item.ca.remarksSpecification &&
    !item.sc.date &&
    !item.sc.status &&
    !item.sc.judgementReward &&
    !item.sc.remarks &&
    !item.sc.remarksSpecification
  );
}

/**
 * Displays stage progress together with its
 * specification when applicable.
 */
function formatProgress(
  value: string,
  specification?: string
) {
  if (
    (value === "Others" || value === "Not Settled") &&
    specification
  ) {
    return `${value} (${specification})`;
  }

  return value || "-";
}

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

  const [statusFilter, setStatusFilter] = useState<
    "All" | CaseStatus
  >("All");

  const [companyFilter, setCompanyFilter] =
    useState<string>("All");

  const [progressFilter, setProgressFilter] = useState<
    "All" | StageProgress
  >("All");

  const [search, setSearch] = useState("");

  const [showMoreFilters, setShowMoreFilters] =
    useState(false);

  const [showArchived] = useState(false);

  const [filingDateStart, setFilingDateStart] =
    useState<string>("");

  const [filingDateEnd, setFilingDateEnd] =
    useState<string>("");

  /* =======================================================
     MODAL STATE
  ======================================================= */

  const [modal, setModal] =
    useState<ModalType>(null);

  const [activeCase, setActiveCase] =
    useState<CaseItem | null>(null);

  const [draft, setDraft] =
    useState<CaseDraft>(EMPTY_CASE);

  /* =======================================================
     EDIT RESTRICTIONS
  ======================================================= */

  const [restrictSenaEditing, setRestrictSenaEditing] =
    useState(false);

  const [restrictSenaRemarksEditing, setRestrictSenaRemarksEditing] =
    useState(false);

  const [restrictLaDetailsEditing, setRestrictLaDetailsEditing] =
    useState(false);

  const [restrictLaProgressOnly, setRestrictLaProgressOnly] =
    useState(false);

  const [restrictLaProgressEditing, setRestrictLaProgressEditing] =
    useState(false);

  const [restrictNlrcDetailsEditing, setRestrictNlrcDetailsEditing] =
    useState(false);

  const [restrictNlrcProgressOnly, setRestrictNlrcProgressOnly] =
    useState(false);

  const [restrictNlrcProgressEditing, setRestrictNlrcProgressEditing] =
    useState(false);

  const [restrictCaDetailsEditing, setRestrictCaDetailsEditing] =
    useState(false);

  const [restrictCaProgressOnly, setRestrictCaProgressOnly] =
    useState(false);

  const [restrictCaProgressEditing, setRestrictCaProgressEditing] =
    useState(false);

  /* =======================================================
     CONFIRMATION STATE
  ======================================================= */

  const [confirmSave, setConfirmSave] =
    useState<"create" | "edit" | null>(null);

  const [confirmArchiveItem, setConfirmArchiveItem] =
    useState<CaseItem | null>(null);

  /* =======================================================
     DERIVED VALUES
  ======================================================= */

  const companyOptions = [
    "All",
    ...companies,
  ];

  const filteredCases = cases
    .filter((item) => {
      /* -----------------------------------------------
         Archive
      ------------------------------------------------ */
      const matchesArchived = showArchived
        ? item.archived
        : !item.archived;

      /* -----------------------------------------------
         Status
      ------------------------------------------------ */
      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      /* -----------------------------------------------
         Company
      ------------------------------------------------ */
      const matchesCompany =
        companyFilter === "All" ||
        item.company === companyFilter;

      /* -----------------------------------------------
         Progress
      ------------------------------------------------ */
      const matchesProgress =
        progressFilter === "All" ||
        Object.values(item.caseProgress).some(
          (stage) => stage === progressFilter
        );

      /* -----------------------------------------------
         Filing Date
      ------------------------------------------------ */
      const matchesFilingDateRange =
        (!filingDateStart ||
          item.filingDate >= filingDateStart) &&
        (!filingDateEnd ||
          item.filingDate <= filingDateEnd);

      /* -----------------------------------------------
         Search
      ------------------------------------------------ */
      const keyword = search.toLowerCase();

      const matchesSearch =
        item.company
          .toLowerCase()
          .includes(keyword) ||
        item.caseNo
          .toLowerCase()
          .includes(keyword) ||
        item.complainants.some((name) =>
          name.toLowerCase().includes(keyword)
        ) ||
        item.cause.some((cause) =>
          cause.toLowerCase().includes(keyword)
        );

      return (
        matchesArchived &&
        matchesStatus &&
        matchesCompany &&
        matchesProgress &&
        matchesFilingDateRange &&
        matchesSearch
      );
    })
    .sort((a, b) =>
      a.date < b.date
        ? 1
        : a.date > b.date
          ? -1
          : 0
    );

  const activeFilterCount =
    [statusFilter, companyFilter, progressFilter].filter(
      (filter) => filter !== "All"
    ).length +
    (search ? 1 : 0) +
    (filingDateStart || filingDateEnd ? 1 : 0);

  const activeCaseCount = cases.filter(
    (item) =>
      item.archived === showArchived
  ).length;

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

    const laProgressIsPending =
      gates.laFilled &&
      item.caseProgress.la === "";

    const nlrcProgressIsPending =
      gates.nlrcFilled &&
      item.caseProgress.nlrc === "";

    const caProgressIsPending =
      gates.caFilled &&
      item.caseProgress.ca === "";

    setActiveCase(item);
    setDraft(cloneDraft(item));

    /* -----------------------------------------------
       SEnA
    ------------------------------------------------ */
    setRestrictSenaEditing(
      isSenaOnlyCase(item) ||
        gates.laFilled
    );

    setRestrictSenaRemarksEditing(
      gates.laFilled
    );

    /* -----------------------------------------------
       LA
    ------------------------------------------------ */
    setRestrictLaDetailsEditing(
      gates.laFilled
    );

    setRestrictLaProgressOnly(
      laProgressIsPending
    );

    setRestrictLaProgressEditing(
      gates.laFilled &&
        !laProgressIsPending
    );

    /* -----------------------------------------------
       NLRC
    ------------------------------------------------ */
    setRestrictNlrcDetailsEditing(
      gates.nlrcFilled
    );

    setRestrictNlrcProgressOnly(
      nlrcProgressIsPending
    );

    setRestrictNlrcProgressEditing(
      gates.nlrcFilled &&
        !nlrcProgressIsPending
    );

    /* -----------------------------------------------
       CA
    ------------------------------------------------ */
    setRestrictCaDetailsEditing(
      gates.caFilled
    );

    setRestrictCaProgressOnly(
      caProgressIsPending
    );

    setRestrictCaProgressEditing(
      gates.caFilled &&
        !caProgressIsPending
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

  const saveCreate = () => {
    const nextId =
      Math.max(
        0,
        ...cases.map((item) => item.id)
      ) + 1;

    const today = new Date()
      .toISOString()
      .slice(0, 10);

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

    setCases((prev) => [
      ...prev,
      newCase,
    ]);

    setConfirmSave(null);
    closeModal();
  };

  const saveEdit = () => {
    if (!activeCase) {
      return;
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const updatedCase: CaseItem = {
      ...draft,
      id: activeCase.id,
      date: today,
      totalPaid: {
        ...draft.totalPaid,
        amount: getTotalJudgementReward(draft),
      },
    };

    setCases((prev) =>
      prev.map((item) =>
        item.id === activeCase.id
          ? updatedCase
          : item
      )
    );

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

  const requestToggleArchive = (
    item: CaseItem
  ) => {
    setConfirmArchiveItem(item);
  };

  const confirmToggleArchive = () => {
    if (!confirmArchiveItem) {
      return;
    }

    setCases((prev) =>
      prev.map((item) =>
        item.id === confirmArchiveItem.id
          ? {
              ...item,
              archived: !item.archived,
            }
          : item
      )
    );

    setConfirmArchiveItem(null);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden bg-[#F5F1E3] p-4">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-lg font-medium tracking-tight text-[#12331F] md:text-xl">
            Case Management
          </h1>

          <p className="mt-0.5 text-xs text-slate-500">
            Track cases from Labor Arbiter through the Supreme Court.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#12331F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1B4A2C]"
        >
          <Plus size={15} />
          Create Case
        </button>
      </div>

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Cases"
          value={cases.length}
          icon={Briefcase}
          accent="bg-slate-100 text-slate-700"
        />

        <SummaryCard
          label="Filed"
          value={
            cases.filter(
              (item) => item.status === "Filed"
            ).length
          }
          icon={FileCheck2}
          accent="bg-sky-50 text-sky-600"
        />

        <SummaryCard
          label="Pending"
          value={
            cases.filter(
              (item) => item.status === "Pending"
            ).length
          }
          icon={Clock3}
          accent="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          label="Closed"
          value={
            cases.filter(
              (item) => item.status === "Closed"
            ).length
          }
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* ===================================================
          SEARCH & FILTERS
      =================================================== */}

      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">

        {/* MAIN FILTER ROW */}

        <div className="flex flex-col gap-2 sm:flex-row">

          {/* Search */}

          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search company, case no., complainant, or cause"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-950/10"
            />
          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "All"
                  | CaseStatus
              )
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
          >
            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status === "All"
                    ? "All Status"
                    : status}
                </option>
              )
            )}
          </select>

          {/* Company */}

          <select
            value={companyFilter}
            onChange={(event) =>
              setCompanyFilter(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
          >
            {companyOptions.map(
              (company) => (
                <option
                  key={company}
                  value={company}
                >
                  {company === "All"
                    ? "All Company"
                    : company}
                </option>
              )
            )}
          </select>

          {/* More Filters */}

          <button
            onClick={() =>
              setShowMoreFilters(
                (current) => !current
              )
            }
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              showMoreFilters
                ? "border-[#12331F] bg-[#12331F] text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            <SlidersHorizontal size={13} />
            More Filters
          </button>
        </div>

        {/* MORE FILTERS */}

        {showMoreFilters && (
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row sm:items-center">

            {/* Progress */}

            <select
              value={progressFilter}
              onChange={(event) =>
                setProgressFilter(
                  event.target.value as
                    | "All"
                    | StageProgress
                )
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white sm:w-48"
            >
              {PROGRESS_OPTIONS.map(
                (progress) => (
                  <option
                    key={progress}
                    value={progress}
                  >
                    {progress === "All"
                      ? "Any Stage Progress"
                      : `Any stage: ${progress}`}
                  </option>
                )
              )}
            </select>

            {/* Filing Date */}

            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-medium text-slate-500">
                Filing Date
              </label>

              <input
                type="date"
                value={filingDateStart}
                onChange={(event) =>
                  setFilingDateStart(
                    event.target.value
                  )
                }
                max={
                  filingDateEnd || undefined
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
              />

              <span className="text-[11px] text-slate-400">
                to
              </span>

              <input
                type="date"
                value={filingDateEnd}
                onChange={(event) =>
                  setFilingDateEnd(
                    event.target.value
                  )
                }
                min={
                  filingDateStart || undefined
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* FILTER FOOTER */}

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Showing {filteredCases.length} of{" "}
            {activeCaseCount}{" "}
            {showArchived
              ? "archived"
              : "active"}{" "}
            cases
          </p>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-blue-950 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* ===================================================
          CASE TABLE
      =================================================== */}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">

          <table className="min-w-full table-fixed border-separate border-spacing-0 text-[11px]">

            {/* =================================================
                COLUMN WIDTHS
            ================================================= */}

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

            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>

                {/* Main fields */}

                <th
                  rowSpan={2}
                  className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Company
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Status
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Last Updated
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Case Title
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Case No.
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Complainants
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Venue
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Handling Personnel
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Cause of Action
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Filing Date
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Remarks
                </th>

                {/* LA */}

                <th
                  colSpan={5}
                  className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center text-sky-700"
                >
                  Labor Arbiter
                </th>

                {/* NLRC */}

                <th
                  colSpan={5}
                  className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center text-violet-700"
                >
                  National Labor Relations Commission
                </th>

                {/* CA */}

                <th
                  colSpan={5}
                  className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center text-fuchsia-700"
                >
                  Court of Appeals
                </th>

                {/* SC */}

                <th
                  colSpan={5}
                  className="sticky top-0 z-20 h-9 border-b border-r border-slate-200 bg-rose-50/60 p-1.5 text-center text-rose-700"
                >
                  Supreme Court
                </th>

                {/* Total Paid */}

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-emerald-50/60 p-2 text-center text-emerald-700"
                >
                  Amount
                </th>

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-r border-slate-200 bg-emerald-50/60 p-2 text-center text-emerald-700"
                >
                  Category
                </th>

                {/* Actions */}

                <th
                  rowSpan={2}
                  className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left"
                >
                  Actions
                </th>
              </tr>

              {/* =================================================
                  SECOND HEADER ROW
              ================================================= */}

              <tr>

                {/* LA */}

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">
                  Date
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">
                  Status
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">
                  Judgement Reward
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">
                  Remarks
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">
                  Progress
                </th>

                {/* NLRC */}

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">
                  Date
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">
                  Status
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">
                  Judgement Reward
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">
                  Remarks
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">
                  Progress
                </th>

                {/* CA */}

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">
                  Date
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">
                  Status
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">
                  Judgement Award
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">
                  Remarks
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">
                  Progress
                </th>

                {/* SC */}

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">
                  Date
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">
                  Status
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">
                  Judgement Award
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">
                  Remarks
                </th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">
                  Progress
                </th>
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {filteredCases.map((item) => (
                <tr
                  key={item.id}
                  className="group border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >

                  {/* Company */}

                  <td
                    title={item.company}
                    className="sticky left-0 z-10 truncate border-r border-slate-200 bg-white p-2 font-medium text-slate-900 group-hover:bg-slate-50"
                  >
                    {item.company}
                  </td>

                  {/* Status */}

                  <td className="p-2">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Last Updated */}

                  <td className="p-2 text-slate-600">
                    {formatDate(item.date)}
                  </td>

                  {/* Case Title */}

                  <td className="truncate p-2 text-slate-600">
                    {item.caseTitle}
                  </td>

                  {/* Case Number */}

                  <td className="truncate p-2 font-mono text-[11px] text-slate-500">
                    {item.caseNo}
                  </td>

                  {/* Complainants */}

                  <td className="p-2 text-slate-600">
                    {item.complainants.join(", ")}
                  </td>

                  {/* Venue */}

                  <td className="truncate p-2 text-slate-600">
                    {item.venue}
                  </td>

                  {/* Handling Personnel */}

                  <td className="truncate p-2 text-slate-600">
                    {item.handlingPersonnel}

                    {item.handlingPersonnel === "Others" &&
                      item.handlingPersonnelSpecification && (
                        <div className="text-[10px] text-slate-500">
                          ({item.handlingPersonnelSpecification})
                        </div>
                      )}
                  </td>

                  {/* Cause of Action */}

                  <td className="truncate p-2 text-slate-600">
                    {item.cause.join(", ")}

                    {item.causeSpecification && (
                      <div className="text-[10px] text-slate-500">
                        ({item.causeSpecification})
                      </div>
                    )}
                  </td>

                  {/* Filing Date */}

                  <td className="p-2 text-slate-600">
                    {formatDate(item.filingDate)}
                  </td>

                  {/* Remarks */}

                  <td className="truncate border-r border-slate-100 p-2 text-slate-600">
                    {item.remarks}

                    {item.remarkSpecification && (
                      <div className="text-[10px] text-slate-500">
                        ({item.remarkSpecification})
                      </div>
                    )}
                  </td>

                  {/* =================================================
                      LABOR ARBITER
                  ================================================= */}

                  <td className="bg-sky-50/30 p-2 text-slate-600">
                    {formatDate(item.la.date)}
                  </td>

                  <td className="truncate bg-sky-50/30 p-2 text-slate-600">
                    {item.la.status}
                  </td>

                  <td className="truncate bg-sky-50/30 p-2 font-medium text-slate-700">
                    {formatCurrency(
                      item.la.judgementReward
                    )}
                  </td>

                  <td className="truncate bg-sky-50/30 p-2 text-slate-600">
                    {item.la.remarks}

                    {item.la.remarks === "Other" &&
                      item.la.remarksSpecification && (
                        <div className="text-[10px] text-slate-500">
                          ({item.la.remarksSpecification})
                        </div>
                      )}
                  </td>

                  <td className="truncate bg-sky-50/30 p-2 text-slate-600">
                    {formatProgress(
                      item.caseProgress.la,
                      item.caseProgress.laSpecification
                    )}
                  </td>

                  {/* =================================================
                      NLRC
                  ================================================= */}

                  <td className="bg-violet-50/30 p-2 text-slate-600">
                    {formatDate(item.nlrc.date)}
                  </td>

                  <td className="truncate bg-violet-50/30 p-2 text-slate-600">
                    {item.nlrc.status}
                  </td>

                  <td className="truncate bg-violet-50/30 p-2 font-medium text-slate-700">
                    {formatCurrency(
                      item.nlrc.judgementReward
                    )}
                  </td>

                  <td className="truncate bg-violet-50/30 p-2 text-slate-600">
                    {item.nlrc.remarks}

                    {item.nlrc.remarks === "Other" &&
                      item.nlrc.remarksSpecification && (
                        <div className="text-[10px] text-slate-500">
                          ({item.nlrc.remarksSpecification})
                        </div>
                      )}
                  </td>

                  <td className="truncate bg-violet-50/30 p-2 text-slate-600">
                    {formatProgress(
                      item.caseProgress.nlrc,
                      item.caseProgress.nlrcSpecification
                    )}
                  </td>

                  {/* =================================================
                      COURT OF APPEALS
                  ================================================= */}

                  <td className="bg-fuchsia-50/30 p-2 text-slate-600">
                    {formatDate(item.ca.date)}
                  </td>

                  <td className="truncate bg-fuchsia-50/30 p-2 text-slate-600">
                    {item.ca.status}
                  </td>

                  <td className="truncate bg-fuchsia-50/30 p-2 font-medium text-slate-700">
                    {formatCurrency(
                      item.ca.judgementReward
                    )}
                  </td>

                  <td className="truncate bg-fuchsia-50/30 p-2 text-slate-600">
                    {item.ca.remarks}

                    {item.ca.remarks === "Other" &&
                      item.ca.remarksSpecification && (
                        <div className="text-[10px] text-slate-500">
                          ({item.ca.remarksSpecification})
                        </div>
                      )}
                  </td>

                  <td className="truncate bg-fuchsia-50/30 p-2 text-slate-600">
                    {formatProgress(
                      item.caseProgress.ca,
                      item.caseProgress.caSpecification
                    )}
                  </td>

                  {/* =================================================
                      SUPREME COURT
                  ================================================= */}

                  <td className="bg-rose-50/30 p-2 text-slate-600">
                    {formatDate(item.sc.date)}
                  </td>

                  <td className="truncate bg-rose-50/30 p-2 text-slate-600">
                    {item.sc.status}
                  </td>

                  <td className="truncate bg-rose-50/30 p-2 font-medium text-slate-700">
                    {formatCurrency(
                      item.sc.judgementReward
                    )}
                  </td>

                  <td className="truncate bg-rose-50/30 p-2 text-slate-600">
                    {item.sc.remarks}

                    {item.sc.remarks === "Other" &&
                      item.sc.remarksSpecification && (
                        <div className="text-[10px] text-slate-500">
                          ({item.sc.remarksSpecification})
                        </div>
                      )}
                  </td>

                  <td className="truncate bg-rose-50/30 p-2 text-slate-600">
                    {formatProgress(
                      item.caseProgress.sc,
                      item.caseProgress.scSpecification
                    )}
                  </td>

                  {/* =================================================
                      TOTAL PAID
                  ================================================= */}

                  <td className="bg-emerald-50/30 p-2 font-medium text-slate-700">
                    {item.totalPaid
                      ? formatCurrency(
                          item.totalPaid.amount
                        )
                      : "-"}
                  </td>

                  <td className="border-r border-slate-200 bg-emerald-50/30 p-2 text-slate-600">
                    {item.totalPaid?.category || "-"}
                  </td>

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <td className="p-2">
                    <div className="flex gap-1">

                      {/* View */}

                      <button
                        aria-label="View case"
                        onClick={() =>
                          openView(item)
                        }
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                      >
                        <Eye size={13} />
                      </button>

                      {/* Edit */}

                      <button
                        aria-label={
                          item.totalPaid?.category
                            ? "Case resolved — updates locked"
                            : "Update case"
                        }
                        onClick={() =>
                          openEdit(item)
                        }
                        disabled={
                          !!item.totalPaid?.category
                        }
                        title={
                          item.totalPaid?.category
                            ? "This case is resolved and can no longer be updated."
                            : undefined
                        }
                        className={`rounded-md border p-1.5 transition ${
                          item.totalPaid?.category
                            ? "cursor-not-allowed border-slate-100 text-slate-300"
                            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <RefreshCw size={13} />
                      </button>

                      {/* Archive / Restore */}

                      <button
                        aria-label={
                          item.archived
                            ? "Restore case"
                            : "Archive case"
                        }
                        onClick={() =>
                          requestToggleArchive(item)
                        }
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                      >
                        {item.archived ? (
                          <ArchiveRestore size={13} />
                        ) : (
                          <Archive size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* =================================================
                  EMPTY STATE
              ================================================= */}

              {filteredCases.length === 0 && (
                <tr>
                  <td
                    colSpan={TABLE_COLUMN_COUNT}
                    className="p-8 text-center text-sm text-slate-400"
                  >
                    No cases match your filters.
                    Try a different search or reset
                    the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          CREATE CASE MODAL
      ===================================================== */}

      {modal === "create" && (
        <Modal
          title="Create Case"
          onClose={closeModal}
          wide
          footer={
            <>
              <button
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={requestSaveCreate}
                className="rounded-lg bg-[#12331F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1B4A2C]"
              >
                Create Case
              </button>
            </>
          }
        >
          <CaseForm
            value={draft}
            onChange={setDraft}
            companies={companies}
          />
        </Modal>
      )}

      {/* =====================================================
          VIEW CASE MODAL
      ===================================================== */}

      {modal === "view" && activeCase && (
        <Modal
          title={`${activeCase.caseNo} · ${activeCase.company}`}
          onClose={closeModal}
          wide
        >
          <ViewCaseContent
            item={activeCase}
          />
        </Modal>
      )}

      {/* =====================================================
          EDIT CASE MODAL
      ===================================================== */}

      {modal === "edit" && activeCase && (
        <Modal
          title={`Edit Case · ${activeCase.caseNo}`}
          onClose={closeModal}
          wide
          footer={
            <>
              <button
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={requestSaveEdit}
                className="rounded-lg bg-[#12331F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1B4A2C]"
              >
                Save Changes
              </button>
            </>
          }
        >
          <CaseForm
            value={draft}
            onChange={setDraft}
            companies={companies}

            restrictSenaEditing={
              restrictSenaEditing
            }

            restrictSenaRemarksEditing={
              restrictSenaRemarksEditing
            }

            restrictLaDetailsEditing={
              restrictLaDetailsEditing
            }

            restrictLaProgressOnly={
              restrictLaProgressOnly
            }

            restrictLaProgressEditing={
              restrictLaProgressEditing
            }

            restrictNlrcDetailsEditing={
              restrictNlrcDetailsEditing
            }

            restrictNlrcProgressOnly={
              restrictNlrcProgressOnly
            }

            restrictNlrcProgressEditing={
              restrictNlrcProgressEditing
            }

            restrictCaDetailsEditing={
              restrictCaDetailsEditing
            }

            restrictCaProgressOnly={
              restrictCaProgressOnly
            }

            restrictCaProgressEditing={
              restrictCaProgressEditing
            }
          />
        </Modal>
      )}

      {/* =====================================================
          CREATE / EDIT CONFIRMATION
      ===================================================== */}

      {confirmSave && (
        <ConfirmDialog
          title={
            confirmSave === "create"
              ? "Create Case"
              : "Save Changes"
          }

          message={
            confirmSave === "create"
              ? `Create a new case for "${
                  draft.company ||
                  "this company"
                }" with Case No. "${
                  draft.caseNo
                }"?`
              : `Save changes to "${
                  activeCase?.caseNo
                } · ${
                  activeCase?.company
                }"?`
          }

          confirmLabel={
            confirmSave === "create"
              ? "Create Case"
              : "Save Changes"
          }

          onConfirm={
            confirmSaveAction
          }

          onCancel={() =>
            setConfirmSave(null)
          }
        />
      )}

      {/* =====================================================
          ARCHIVE / RESTORE CONFIRMATION
      ===================================================== */}

      {confirmArchiveItem && (
        <ConfirmDialog
          title={
            confirmArchiveItem.archived
              ? "Restore Case"
              : "Archive Case"
          }

          message={
            confirmArchiveItem.archived
              ? `Restore "${confirmArchiveItem.caseNo} · ${confirmArchiveItem.company}" to the active case list?`
              : `Archive "${confirmArchiveItem.caseNo} · ${confirmArchiveItem.company}"? You can restore it later from the Archived Cases page.`
          }

          confirmLabel={
            confirmArchiveItem.archived
              ? "Restore"
              : "Archive"
          }

          onConfirm={
            confirmToggleArchive
          }

          onCancel={() =>
            setConfirmArchiveItem(null)
          }
        />
      )}
    </div>
  );
}