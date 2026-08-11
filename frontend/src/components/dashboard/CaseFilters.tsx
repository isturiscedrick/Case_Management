import { Search, SlidersHorizontal } from "lucide-react";

import type { CaseStatus, StageProgress } from "@/types/case";
import { PROGRESS_OPTIONS, STATUS_OPTIONS } from "@/constants/caseOptions";

export function CaseFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  companyFilter,
  onCompanyFilterChange,
  companyOptions,
  progressFilter,
  onProgressFilterChange,
  showMoreFilters,
  onToggleMoreFilters,
  filingDateStart,
  onFilingDateStartChange,
  filingDateEnd,
  onFilingDateEndChange,
  filteredCount,
  totalCount,
  showArchived,
  activeFilterCount,
  onResetFilters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "All" | CaseStatus;
  onStatusFilterChange: (value: "All" | CaseStatus) => void;
  companyFilter: string;
  onCompanyFilterChange: (value: string) => void;
  companyOptions: string[];
  progressFilter: "All" | StageProgress;
  onProgressFilterChange: (value: "All" | StageProgress) => void;
  showMoreFilters: boolean;
  onToggleMoreFilters: () => void;
  filingDateStart: string;
  onFilingDateStartChange: (value: string) => void;
  filingDateEnd: string;
  onFilingDateEndChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  showArchived: boolean;
  activeFilterCount: number;
  onResetFilters: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
      {/* MAIN FILTER ROW */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search company, case no., complainant, or cause"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-950/10"
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as "All" | CaseStatus)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "All" ? "All Status" : status}
            </option>
          ))}
        </select>

        {/* Company */}
        <select
          value={companyFilter}
          onChange={(event) => onCompanyFilterChange(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
        >
          {companyOptions.map((company) => (
            <option key={company} value={company}>
              {company === "All" ? "All Company" : company}
            </option>
          ))}
        </select>

        {/* More Filters */}
        <button
          onClick={onToggleMoreFilters}
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
            onChange={(event) => onProgressFilterChange(event.target.value as "All" | StageProgress)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white sm:w-48"
          >
            {PROGRESS_OPTIONS.map((progress) => (
              <option key={progress} value={progress}>
                {progress === "All" ? "Any Stage Progress" : `Any stage: ${progress}`}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-medium text-slate-500">Date Range</label>

            <input
              type="date"
              value={filingDateStart}
              onChange={(event) => onFilingDateStartChange(event.target.value)}
              max={filingDateEnd || undefined}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            />

            <span className="text-[11px] text-slate-400">to</span>

            <input
              type="date"
              value={filingDateEnd}
              onChange={(event) => onFilingDateEndChange(event.target.value)}
              min={filingDateStart || undefined}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* FILTER FOOTER */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          Showing {filteredCount} of {totalCount} {showArchived ? "archived" : "active"} cases
        </p>

        {activeFilterCount > 0 && (
          <button
            onClick={onResetFilters}
            className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-blue-950 hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
