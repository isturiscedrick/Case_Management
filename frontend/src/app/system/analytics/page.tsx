"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Users,
  PieChart as PieChartIcon,
  CalendarRange,
  Layers,
  Landmark,
  RefreshCw,
} from "lucide-react";

import type { CaseItem, TotalPaidCategory } from "@/types/case";
import { useCases } from "@/context/CasesContext";
import { formatCurrency, getCaseStatusSummary } from "@/lib/caseHelpers";
import { STAGE_STYLES, type StageKey } from "@/components/dashboard/form/shared/SectionHeader";
import { SummaryCards } from "@/components/shared/SummaryCards";

type StatusBucket = "Pending" | "Settled" | "Not Settled" | "Closed";

const STAGE_KEYS: StageKey[] = ["sena", "la", "nlrc", "ca", "sc"];
const BUCKETS: StatusBucket[] = ["Pending", "Settled", "Not Settled", "Closed"];

const STAGE_LABELS: Record<StageKey, string> = {
  sena: "SENA",
  la: "Labor Arbiter",
  nlrc: "NLRC",
  ca: "Court of Appeals",
  sc: "Supreme Court",
};

const BUCKET_STYLES: Record<StatusBucket, { dot: string; bar: string; text: string }> = {
  Pending: { dot: "bg-amber-400", bar: "bg-amber-400", text: "text-amber-700" },
  Settled: { dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-700" },
  "Not Settled": { dot: "bg-rose-500", bar: "bg-rose-500", text: "text-rose-700" },
  Closed: { dot: "bg-slate-400", bar: "bg-slate-400", text: "text-slate-700" },
};

const CATEGORY_ORDER: TotalPaidCategory[] = ["Judgment-Award-W", "Judgment-Award-L", "Settlement"];

const CATEGORY_META: Record<TotalPaidCategory, { label: string; dot: string; hex: string; text: string }> = {
  "Judgment-Award-W": { label: "Judgment (In Favor)", dot: "bg-emerald-500", hex: "#10b981", text: "text-emerald-700" },
  "Judgment-Award-L": { label: "Judgment (Not In Favor)", dot: "bg-rose-500", hex: "#f43f5e", text: "text-rose-700" },
  Settlement: { label: "Settlement", dot: "bg-amber-500", hex: "#f59e0b", text: "text-amber-700" },
};

// Cycled through for the per-company chart, since the number of companies
// is dynamic and can't be given fixed Tailwind classes ahead of time.
const COMPANY_CHART_COLORS = [
  "#0ea5e9", // sky
  "#f59e0b", // amber
  "#10b981", // emerald
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#ec4899", // fuchsia
  "#14b8a6", // teal
  "#64748b", // slate
];

function isStageFilled(stage: CaseItem["la"]) {
  return !!(
    stage.date ||
    stage.status ||
    stage.judgmentAward ||
    stage.judgmentAwardSpecification ||
    stage.judgmentAwardComputedSpecification ||
    stage.remarks ||
    stage.remarksSpecification
  );
}

function getCurrentStage(item: CaseItem): StageKey {
  const laFilled = isStageFilled(item.la);
  const nlrcFilled = isStageFilled(item.nlrc);
  const caFilled = isStageFilled(item.ca);
  const scFilled = isStageFilled(item.sc);

  if (scFilled) return "sc";
  if (caFilled) return "ca";
  if (nlrcFilled) return "nlrc";
  if (laFilled) return "la";
  return "sena";
}

function getStageProgressValue(item: CaseItem, stage: StageKey): string {
  if (stage === "sena") return item.remarks;
  return item.caseProgress[stage];
}

// "Closed" is the case-level lock flag (set via "Close Case" in the form,
// see CaseForm.tsx -> setTop("closed", true)). It takes priority over
// stage/remarks progress, mirroring how getCaseStatusSummary() in
// caseHelpers.ts treats it — a closed case's current stage should read
// "Closed" regardless of what progress value that stage was left at.
function classifyStatus(item: CaseItem, stage: StageKey): StatusBucket {
  if (item.closed) return "Closed";

  const progress = getStageProgressValue(item, stage);
  if (progress === "Settled") return "Settled";
  if (progress === "Not Settled" || progress === "Others") return "Not Settled";
  return "Pending";
}

function parseAmount(value: string | number | undefined | null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Date range comparison assumes ISO-ish (yyyy-mm-dd) strings, which is what
// the date inputs elsewhere in the app (filingDate, stage dates) produce.
function isWithinRange(dateStr: string | undefined, start: string, end: string) {
  if (!dateStr) return !start && !end;
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

// Renders a set of value/color segments as a crisp SVG ring — used in place
// of a CSS conic-gradient string so edges stay sharp at any size/zoom and
// there's a single source of truth (no separate gradient string to keep in
// sync with the segment data).
function DonutChart({
  segments,
  size = 144,
  strokeWidth = 16,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cumulativeFraction = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      {total > 0 &&
        segments.map((segment, index) => {
          if (segment.value <= 0) return null;
          const fraction = segment.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const offset = -cumulativeFraction * circumference;
          cumulativeFraction += fraction;
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          );
        })}
    </svg>
  );
}

// Shared section header — icon chip + serif title + one-line subtitle.
// Matches the pattern already used elsewhere in the app (Add User form,
// Notifications panel) instead of the three different ad hoc header
// treatments this page previously had.
function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon size={15} />
      </div>
      <div>
        <h2 className="font-serif text-sm font-medium tracking-tight text-[#12331F]">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { cases: allCases, isLoading, refetch } = useCases();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const cases = useMemo(
    () =>
      allCases.filter((c) => {
        if (c.archived) return false;
        const referenceDate = c.filingDate || c.date;
        if (!isWithinRange(referenceDate, startDate, endDate)) return false;
        return true;
      }),
    [allCases, startDate, endDate]
  );

  // Stage -> bucket -> count
  const stageBreakdown = useMemo(() => {
    const result: Record<StageKey, Record<StatusBucket, number>> = {
      sena: { Pending: 0, Settled: 0, "Not Settled": 0, Closed: 0 },
      la: { Pending: 0, Settled: 0, "Not Settled": 0, Closed: 0 },
      nlrc: { Pending: 0, Settled: 0, "Not Settled": 0, Closed: 0 },
      ca: { Pending: 0, Settled: 0, "Not Settled": 0, Closed: 0 },
      sc: { Pending: 0, Settled: 0, "Not Settled": 0, Closed: 0 },
    };

    cases.forEach((item) => {
      const stage = getCurrentStage(item);
      const bucket = classifyStatus(item, stage);
      result[stage][bucket] += 1;
    });

    return result;
  }, [cases]);

  const grandTotal = useMemo(
    () => cases.reduce((sum, c) => sum + parseAmount(c.totalPaid?.amount), 0),
    [cases]
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<TotalPaidCategory, { amount: number; count: number }> = {
      "Judgment-Award-W": { amount: 0, count: 0 },
      "Judgment-Award-L": { amount: 0, count: 0 },
      Settlement: { amount: 0, count: 0 },
    };

    cases.forEach((item) => {
      const category = item.totalPaid?.category;
      if (category && category in totals) {
        totals[category as TotalPaidCategory].amount += parseAmount(item.totalPaid.amount);
        totals[category as TotalPaidCategory].count += 1;
      }
    });

    return totals;
  }, [cases]);

  const categoryGrandTotal = useMemo(
    () => CATEGORY_ORDER.reduce((sum, cat) => sum + categoryTotals[cat].amount, 0),
    [categoryTotals]
  );

  const categoryCaseTotal = useMemo(
    () => CATEGORY_ORDER.reduce((sum, cat) => sum + categoryTotals[cat].count, 0),
    [categoryTotals]
  );

  const categorySegments = useMemo(
    () => CATEGORY_ORDER.map((cat) => ({ value: categoryTotals[cat].count, color: CATEGORY_META[cat].hex })),
    [categoryTotals]
  );

  // Case count per company, for the "Cases by Company" chart below.
  const companyBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((item) => {
      const name = item.company?.trim() || "Unspecified";
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count], index) => ({
        name,
        count,
        color: COMPANY_CHART_COLORS[index % COMPANY_CHART_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  const companySegments = useMemo(
    () => companyBreakdown.map((c) => ({ value: c.count, color: c.color })),
    [companyBreakdown]
  );

  // Cases handled per personnel — name plus the case titles they're on
  const personnelBreakdown = useMemo(() => {
    const map = new Map<string, { caseTitle: string; caseNo: string }[]>();
    cases.forEach((item) => {
      const name = item.handlingPersonnel?.trim() || "Unassigned";
      const list = map.get(name) ?? [];
      list.push({ caseTitle: item.caseTitle, caseNo: item.caseNo });
      map.set(name, list);
    });
    return Array.from(map.entries())
      .map(([name, caseList]) => ({ name, count: caseList.length, caseList }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  return (
    <div className="h-full min-w-0 space-y-5 overflow-y-auto bg-[#F5F1E3] p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Reporting</p>
          <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-[#12331F]">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Case status and judgment award breakdown by stage.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            <CalendarRange size={14} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-38 bg-transparent outline-none"
              aria-label="Start date"
            />
            <span className="text-slate-300">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-38 bg-transparent outline-none"
              aria-label="End date"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="ml-1 text-[11px] text-slate-400 underline hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={refetch}
            disabled={isLoading}
            aria-label="Refresh analytics"
            title="Refresh analytics"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* TOP SUMMARY */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Briefcase size={18} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Cases Analyzed</p>
          <p className="text-lg font-semibold tabular-nums text-[#12331F]">{cases.length}</p>
        </div>
      </div>

      {/* STATUS BREAKDOWN PER STAGE */}
      <div>
        <SectionTitle icon={Layers} title="Case Status by Stage" subtitle="Where each case currently sits, and its outcome at that stage." />

        {/* Overall totals — same rollup used on the dashboard, scoped to the
            cases currently in view (date range applied above). */}
        <div className="mb-3">
          <SummaryCards cases={cases} hideTotal />
        </div>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {STAGE_KEYS.map((stage) => {
            const meta = STAGE_STYLES[stage];
            const Icon = meta.icon;
            const counts = stageBreakdown[stage];
            const total = BUCKETS.reduce((sum, b) => sum + counts[b], 0);

            return (
              <div key={stage} className={`rounded-xl border ${meta.ring} bg-white p-4 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.bar} ${meta.text}`}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${meta.text}`}>{STAGE_LABELS[stage]}</p>
                      <p className="text-[10px] tabular-nums text-slate-400">{total} case{total === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                </div>

                {/* stacked bar */}
                <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  {total === 0 ? null : (
                    BUCKETS.map((bucket) =>
                      counts[bucket] > 0 ? (
                        <div
                          key={bucket}
                          className={BUCKET_STYLES[bucket].bar}
                          style={{ width: `${(counts[bucket] / total) * 100}%` }}
                          title={`${bucket}: ${counts[bucket]}`}
                        />
                      ) : null
                    )
                  )}
                </div>

                {/* legend */}
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {BUCKETS.map((bucket) => (
                    <div key={bucket} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${BUCKET_STYLES[bucket].dot}`} />
                        {bucket}
                      </span>
                      <span className={`font-medium tabular-nums ${BUCKET_STYLES[bucket].text}`}>{counts[bucket]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AWARD OUTCOME BREAKDOWN */}
      <div>
        <SectionTitle icon={BarChart3} title="Award Outcome Breakdown" subtitle="How judgment awards resolved — in favor, against, or by settlement." />

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          {/* Category cards + bars */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-3">
              {CATEGORY_ORDER.map((cat) => {
                const meta = CATEGORY_META[cat];
                const { amount, count } = categoryTotals[cat];
                const pct = categoryGrandTotal > 0 ? (amount / categoryGrandTotal) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="flex w-40 shrink-0 items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
                    </div>
                    <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                      <div
                        className={`h-full rounded-md ${meta.dot} opacity-80`}
                        style={{ width: `${amount > 0 ? Math.max(pct, 3) : 0}%` }}
                      />
                    </div>
                    <div className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700">
                      {formatCurrency(String(amount))}
                    </div>
                    <div className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
                      {count} case{count === 1 ? "" : "s"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut chart (by case count) */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5 self-start text-[11px] uppercase tracking-wide text-slate-400">
              <PieChartIcon size={13} />
              By case count
            </div>
            <div className="relative h-36 w-36">
              <DonutChart segments={categorySegments} size={144} strokeWidth={16} />
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-lg font-semibold tabular-nums text-[#12331F]">{categoryCaseTotal}</span>
                <span className="text-[10px] text-slate-400">cases</span>
              </div>
            </div>
            <div className="w-full space-y-1">
              {CATEGORY_ORDER.map((cat) => {
                const meta = CATEGORY_META[cat];
                const { count } = categoryTotals[cat];
                const pct = categoryCaseTotal > 0 ? Math.round((count / categoryCaseTotal) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className={`font-medium tabular-nums ${meta.text}`}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TOTAL JUDGMENT AWARDS PAID */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Landmark size={18} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Judgment Awards Paid</p>
          <p className="text-lg font-semibold tabular-nums text-[#12331F]">{formatCurrency(String(grandTotal))}</p>
        </div>
      </div>

      {/* CASES BY COMPANY */}
      <div>
        <SectionTitle icon={Building2} title="Cases by Company" subtitle="Case volume across the companies in the selected range." />

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          {/* Company bars */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {companyBreakdown.length === 0 ? (
              <p className="text-xs italic text-slate-400">No cases match the current filters.</p>
            ) : (
              <div className="space-y-3">
                {companyBreakdown.map(({ name, count, color }) => {
                  const pct = cases.length > 0 ? (count / cases.length) * 100 : 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div className="flex w-40 shrink-0 items-center gap-1.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="truncate text-xs font-medium text-slate-700" title={name}>
                          {name}
                        </span>
                      </div>
                      <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                        <div
                          className="h-full rounded-md opacity-80"
                          style={{ width: `${count > 0 ? Math.max(pct, 3) : 0}%`, backgroundColor: color }}
                        />
                      </div>
                      <div className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
                        {count} case{count === 1 ? "" : "s"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Donut chart (by case count) */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5 self-start text-[11px] uppercase tracking-wide text-slate-400">
              <PieChartIcon size={13} />
              Total No. of Cases
            </div>
            <div className="relative h-36 w-36">
              <DonutChart segments={companySegments} size={144} strokeWidth={16} />
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-lg font-semibold tabular-nums text-[#12331F]">{cases.length}</span>
                <span className="text-[10px] text-slate-400">cases</span>
              </div>
            </div>
            <div className="w-full space-y-1">
              {companyBreakdown.map(({ name, count, color }) => {
                const pct = cases.length > 0 ? Math.round((count / cases.length) * 100) : 0;
                return (
                  <div key={name} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-500">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="truncate" title={name}>{name}</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-slate-700">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CASES HANDLED PER PERSONNEL */}
      <div>
        <SectionTitle icon={Users} title="Cases Handled per Personnel" subtitle="Caseload distribution across handling personnel." />

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {personnelBreakdown.length === 0 ? (
            <p className="text-xs italic text-slate-400">No cases match the current filters.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {personnelBreakdown.map(({ name, count, caseList }) => (
                <div key={name} className="rounded-lg border border-slate-200 bg-[#FAFAF7] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-[#12331F]" title={name}>
                      {name}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#12331F]/10 px-2 py-0.5 text-[10px] font-medium tabular-nums text-[#12331F]">
                      {count} case{count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {caseList.map((c, i) => (
                      <li key={`${c.caseNo}-${i}`} className="truncate text-[11px] text-slate-500" title={c.caseTitle}>
                        <span className="font-medium text-slate-600">{c.caseNo || "No case no."}</span>
                        {c.caseTitle ? ` — ${c.caseTitle}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}