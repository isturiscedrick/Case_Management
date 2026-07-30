"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Eye,
  RefreshCw,
  Archive,
  ArchiveRestore,
  Briefcase,
  FileCheck2,
  Clock3,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

import type { CaseItem, CaseDraft, CaseStatus, StageProgress, ModalType } from "@/types/case";
import { STATUS_OPTIONS, PROGRESS_OPTIONS, EMPTY_CASE, TABLE_COLUMN_COUNT, CURRENT_USER } from "@/constants/caseOptions";
import { initialCases, initialCompanies } from "@/data/initialCases";
import { cloneDraft, formatDate, formatCurrency } from "@/lib/caseHelpers";
import { getCaseDraftErrors } from "@/lib/caseValidation";

import { StatusBadge } from "@/components/cases/StatusBadge";
import { SummaryCard } from "@/components/cases/SummaryCard";
import { CaseProgressStepper } from "@/components/cases/CaseProgressStepper";
import { CaseForm } from "@/components/cases/CaseForm";
import { Modal } from "@/components/cases/Modal";
import { ConfirmDialog } from "@/components/cases/ConfirmDialog";
import { ViewCaseContent } from "@/components/cases/ViewCaseContent";

// A case is "SEnA-only" if none of LA/NLRC/CA/SC have any data yet —
// meaning it was created (or last saved) without escalating past SEnA.
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

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [companies] = useState<string[]>(initialCompanies);

  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatus>("All");
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [venueFilter, setVenueFilter] = useState<string>("All");
  const [progressFilter, setProgressFilter] = useState<"All" | StageProgress>("All");
  const [search, setSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [modal, setModal] = useState<ModalType>(null);
  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [draft, setDraft] = useState<CaseDraft>(EMPTY_CASE);
  // True when the case being edited has no data in LA/NLRC/CA/SC — i.e. it
  // hasn't escalated past SEnA yet. In that case, only SEnA's Remarks field
  // stays editable; the rest of SEnA locks to protect the original filing.
  const [restrictSenaEditing, setRestrictSenaEditing] = useState(false);

  const [confirmSave, setConfirmSave] = useState<"create" | "edit" | null>(null);
  const [confirmArchiveItem, setConfirmArchiveItem] = useState<CaseItem | null>(null);

  const companyOptions = ["All", ...companies];
  const venueOptions = useMemo(
    () => ["All", ...Array.from(new Set(cases.map((c) => c.venue).filter(Boolean)))],
    [cases]
  );

  const filteredCases = cases.filter((item) => {
    const matchesArchived = showArchived ? item.archived : !item.archived;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesCompany = companyFilter === "All" || item.company === companyFilter;
    const matchesVenue = venueFilter === "All" || item.venue === venueFilter;
    const matchesProgress =
      progressFilter === "All" || Object.values(item.caseProgress).some((stage) => stage === progressFilter);

    const keyword = search.toLowerCase();
    const matchesSearch =
      item.company.toLowerCase().includes(keyword) ||
      item.caseNo.toLowerCase().includes(keyword) ||
      item.complainants.some((name) => name.toLowerCase().includes(keyword)) ||
      item.cause.toLowerCase().includes(keyword);

    return matchesArchived && matchesStatus && matchesCompany && matchesVenue && matchesProgress && matchesSearch;
  });

  const resetFilters = () => {
    setStatusFilter("All");
    setCompanyFilter("All");
    setVenueFilter("All");
    setProgressFilter("All");
    setSearch("");
  };

  const openCreate = () => {
    setDraft(cloneDraft(EMPTY_CASE));
    setRestrictSenaEditing(false);
    setModal("create");
  };

  const openView = (item: CaseItem) => {
    setActiveCase(item);
    setModal("view");
  };

  const openEdit = (item: CaseItem) => {
    setActiveCase(item);
    setDraft(cloneDraft(item));
    setRestrictSenaEditing(isSenaOnlyCase(item));
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setActiveCase(null);
    setRestrictSenaEditing(false);
  };

  // Shared validation: checks SEnA, and — for every stage that's unlocked
  // (LA always once SEnA qualifies; NLRC/CA/SC once the prior stage is
  // filled AND its Progress is "Not Settled" or "Others") — requires that
  // stage's fields (Date, Status, Judgement Reward/Award, Remarks) to be
  // filled. Progress dropdowns are always optional and never block this.
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

  const saveCreate = () => {
    const nextId = Math.max(0, ...cases.map((c) => c.id)) + 1;
    const today = new Date().toISOString().slice(0, 10);
    setCases((prev) => [...prev, { ...draft, id: nextId, date: today, createdBy: CURRENT_USER, createdAt: today }]);
    setConfirmSave(null);
    closeModal();
  };

  const saveEdit = () => {
    if (!activeCase) return;
    const today = new Date().toISOString().slice(0, 10);
    setCases((prev) => prev.map((c) => (c.id === activeCase.id ? { ...draft, id: activeCase.id, date: today } : c)));
    setConfirmSave(null);
    closeModal();
  };

  const confirmSaveAction = () => {
    if (confirmSave === "create") saveCreate();
    if (confirmSave === "edit") saveEdit();
  };

  const requestToggleArchive = (item: CaseItem) => {
    setConfirmArchiveItem(item);
  };

  const confirmToggleArchive = () => {
    if (!confirmArchiveItem) return;
    setCases((prev) => prev.map((c) => (c.id === confirmArchiveItem.id ? { ...c, archived: !c.archived } : c)));
    setConfirmArchiveItem(null);
  };

  const activeFilterCount =
    [statusFilter, companyFilter, venueFilter, progressFilter].filter((f) => f !== "All").length + (search ? 1 : 0);

  return (
    <div className="h-full min-w-0 space-y-4 overflow-y-auto bg-[#F7F5F0] p-4">      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-lg font-medium tracking-tight text-[#0B1D3A] md:text-xl">Case Management</h1>
          <p className="mt-0.5 text-xs text-slate-500">Track cases from Labor Arbiter through the Supreme Court.</p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-lg bg-[#0B1D3A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#132a4d]"
        >
          <Plus size={15} />
          Create Case
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Cases" value={cases.length} icon={Briefcase} accent="bg-slate-100 text-slate-700" />
        <SummaryCard
          label="Filed"
          value={cases.filter((x) => x.status === "Filed").length}
          icon={FileCheck2}
          accent="bg-sky-50 text-sky-600"
        />
        <SummaryCard
          label="Pending"
          value={cases.filter((x) => x.status === "Pending").length}
          icon={Clock3}
          accent="bg-amber-50 text-amber-600"
        />
        <SummaryCard
          label="Closed"
          value={cases.filter((x) => x.status === "Closed").length}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-600"
        />
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "All" | CaseStatus)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All Status" : status}
              </option>
            ))}
          </select>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
          >
            {companyOptions.map((company) => (
              <option key={company} value={company}>
                {company === "All" ? "All Company" : company}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowMoreFilters((s) => !s)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              showMoreFilters ? "border-[#0B1D3A] bg-[#0B1D3A] text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            <SlidersHorizontal size={13} />
            More Filters
          </button>
        </div>

        {showMoreFilters && (
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row">
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white sm:w-48"
            >
              {venueOptions.map((venue) => (
                <option key={venue} value={venue}>
                  {venue === "All" ? "All Venue" : venue}
                </option>
              ))}
            </select>

            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value as "All" | StageProgress)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white sm:w-48"
            >
              {PROGRESS_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p === "All" ? "Any Stage Progress" : `Any stage: ${p}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Showing {filteredCases.length} of {cases.filter((c) => c.archived === showArchived).length}{" "}
            {showArchived ? "archived" : "active"} cases
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

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-[11px] table-fixed">
            <colgroup>
              <col className="w-32" />
              <col className="w-16" />
              <col className="w-16" />
              <col className="w-28" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-20" />
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
                  Cause of Action
                </th>
                <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                  Filing Date
                </th>
                <th rowSpan={2} className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-2 text-left">
                  Remarks
                </th>
                <th colSpan={4} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center text-sky-700">
                  Labor Arbiter
                </th>
                <th colSpan={4} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center text-violet-700">
                  National Labor Relations Commission
                </th>
                <th colSpan={4} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center text-fuchsia-700">
                  Court of Appeals
                </th>
                <th colSpan={4} className="sticky top-0 z-20 h-9 border-b border-r border-slate-200 bg-rose-50/60 p-1.5 text-center text-rose-700">
                  Supreme Court
                </th>
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
                <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                  Case Progress
                </th>
                <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                  Actions
                </th>
              </tr>
              <tr>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Date</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Status</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Judgement Reward</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Remarks</th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Date</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Status</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Judgement Reward</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Remarks</th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Date</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Status</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Judgement Award</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Remarks</th>

                <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Date</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Status</th>
                <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Judgement Award</th>
                <th className="sticky top-9 z-20 border-b border-r border-slate-200 bg-rose-50/60 p-1.5 text-center">Remarks</th>
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
                    {item.cause}
                    {item.causeSpecification && <div className="text-[10px] text-slate-500">({item.causeSpecification})</div>}
                  </td>
                  <td className="p-2 text-slate-600">{formatDate(item.filingDate)}</td>
                  <td className="truncate border-r border-slate-100 p-2 text-slate-600">
                    {item.remarks}
                    {item.remarkSpecification && <div className="text-[10px] text-slate-500">({item.remarkSpecification})</div>}
                  </td>

                  <td className="bg-sky-50/30 p-2 text-slate-600">{formatDate(item.la.date)}</td>
                  <td className="truncate bg-sky-50/30 p-2 text-slate-600">{item.la.status}</td>
                  <td className="truncate bg-sky-50/30 p-2 font-medium text-slate-700">{formatCurrency(item.la.judgementReward)}</td>
                  <td className="truncate bg-sky-50/30 p-2 text-slate-600">
                    {item.la.remarks}
                    {item.la.remarks === "Other" && item.la.remarksSpecification && (
                      <div className="text-[10px] text-slate-500">({item.la.remarksSpecification})</div>
                    )}
                  </td>

                  <td className="bg-violet-50/30 p-2 text-slate-600">{formatDate(item.nlrc.date)}</td>
                  <td className="truncate bg-violet-50/30 p-2 text-slate-600">{item.nlrc.status}</td>
                  <td className="truncate bg-violet-50/30 p-2 font-medium text-slate-700">{formatCurrency(item.nlrc.judgementReward)}</td>
                  <td className="truncate bg-violet-50/30 p-2 text-slate-600">
                    {item.nlrc.remarks}
                    {item.nlrc.remarks === "Other" && item.nlrc.remarksSpecification && (
                      <div className="text-[10px] text-slate-500">({item.nlrc.remarksSpecification})</div>
                    )}
                  </td>

                  <td className="bg-fuchsia-50/30 p-2 text-slate-600">{formatDate(item.ca.date)}</td>
                  <td className="truncate bg-fuchsia-50/30 p-2 text-slate-600">{item.ca.status}</td>
                  <td className="truncate bg-fuchsia-50/30 p-2 font-medium text-slate-700">{formatCurrency(item.ca.judgementReward)}</td>
                  <td className="truncate bg-fuchsia-50/30 p-2 text-slate-600">
                    {item.ca.remarks}
                    {item.ca.remarks === "Other" && item.ca.remarksSpecification && (
                      <div className="text-[10px] text-slate-500">({item.ca.remarksSpecification})</div>
                    )}
                  </td>

                  <td className="bg-rose-50/30 p-2 text-slate-600">{formatDate(item.sc.date)}</td>
                  <td className="truncate bg-rose-50/30 p-2 text-slate-600">{item.sc.status}</td>
                  <td className="truncate bg-rose-50/30 p-2 font-medium text-slate-700">{formatCurrency(item.sc.judgementReward)}</td>
                  <td className="truncate border-r border-slate-100 bg-rose-50/30 p-2 text-slate-600">
                    {item.sc.remarks}
                    {item.sc.remarks === "Other" && item.sc.remarksSpecification && (
                      <div className="text-[10px] text-slate-500">({item.sc.remarksSpecification})</div>
                    )}
                  </td>

                  <td className="bg-emerald-50/30 p-2 font-medium text-slate-700">
  {item.totalPaid ? formatCurrency(item.totalPaid.amount) : "-"}
</td>

<td className="border-r border-slate-200 bg-emerald-50/30 p-2 text-slate-600">
  {item.totalPaid?.category || "-"}
</td>

                  <td className="p-2">
                    <CaseProgressStepper progress={item.caseProgress} />
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <button
                        aria-label="View case"
                        onClick={() => openView(item)}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        aria-label="Update case"
                        onClick={() => openEdit(item)}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                      >
                        <RefreshCw size={13} />
                      </button>
                      <button
                        aria-label={item.archived ? "Restore case" : "Archive case"}
                        onClick={() => requestToggleArchive(item)}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                      >
                        {item.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={TABLE_COLUMN_COUNT} className="p-8 text-center text-sm text-slate-400">
                    No cases match your filters. Try a different search or reset the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {modal === "create" && (
        <Modal
          title="Create Case"
          onClose={closeModal}
          wide
          footer={
            <>
              <button onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={requestSaveCreate} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-900">
                Create Case
              </button>
            </>
          }
        >
          <CaseForm value={draft} onChange={setDraft} companies={companies} />
        </Modal>
      )}

      {/* VIEW MODAL */}
      {modal === "view" && activeCase && (
        <Modal title={`${activeCase.caseNo} · ${activeCase.company}`} onClose={closeModal} wide>
          <ViewCaseContent item={activeCase} />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {modal === "edit" && activeCase && (
        <Modal
          title={`Edit Case · ${activeCase.caseNo}`}
          onClose={closeModal}
          wide
          footer={
            <>
              <button onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={requestSaveEdit} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-900">
                Save Changes
              </button>
            </>
          }
        >
          <CaseForm value={draft} onChange={setDraft} companies={companies} restrictSenaEditing={restrictSenaEditing} />
        </Modal>
      )}

      {/* CREATE / EDIT SAVE CONFIRMATION */}
      {confirmSave && (
        <ConfirmDialog
          title={confirmSave === "create" ? "Create Case" : "Save Changes"}
          message={
            confirmSave === "create"
              ? `Create a new case for "${draft.company || "this company"}" with Case No. "${draft.caseNo}"?`
              : `Save changes to "${activeCase?.caseNo} · ${activeCase?.company}"?`
          }
          confirmLabel={confirmSave === "create" ? "Create Case" : "Save Changes"}
          onConfirm={confirmSaveAction}
          onCancel={() => setConfirmSave(null)}
        />
      )}

      {/* ARCHIVE / RESTORE CONFIRMATION */}
      {confirmArchiveItem && (
        <ConfirmDialog
          title={confirmArchiveItem.archived ? "Restore Case" : "Archive Case"}
          message={
            confirmArchiveItem.archived
              ? `Restore "${confirmArchiveItem.caseNo} · ${confirmArchiveItem.company}" to the active case list?`
              : `Archive "${confirmArchiveItem.caseNo} · ${confirmArchiveItem.company}"? You can restore it later from the Archived Cases page.`
          }
          confirmLabel={confirmArchiveItem.archived ? "Restore" : "Archive"}
          onConfirm={confirmToggleArchive}
          onCancel={() => setConfirmArchiveItem(null)}
        />
      )}
    </div>
  );
}