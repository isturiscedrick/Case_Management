"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Handshake,
  Briefcase,
  Building2,
  Users,
  PieChart as PieChartIcon,
  CalendarRange,
} from "lucide-react";

import type { CaseItem, TotalPaidCategory } from "@/types/case";
import { initialCases } from "@/data/initialCases";
import { formatCurrency } from "@/lib/caseHelpers";
import { STAGE_STYLES, type StageKey } from "@/components/dashboard/form/shared/SectionHeader";
import { SummaryCards } from "@/components/dashboard/SummaryCards ";

type StatusBucket = "Pending" | "Settled" | "Not Settled";

const STAGE_KEYS: StageKey[] = ["sena", "la", "nlrc", "ca", "sc"];
const BUCKETS: StatusBucket[] = ["Pending", "Settled", "Not Settled"];

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
};

const CATEGORY_ORDER: TotalPaidCategory[] = ["Judgment-Award-W", "Judgment-Award-L", "Settlement"];

const CATEGORY_META: Record<TotalPaidCategory, { label: string; dot: string; hex: string; text: string }> = {
  "Judgment-Award-W": { label: "Judgment Award (Won)", dot: "bg-emerald-500", hex: "#10b981", text: "text-emerald-700" },
  "Judgment-Award-L": { label: "Judgment Award (Lost)", dot: "bg-rose-500", hex: "#f43f5e", text: "text-rose-700" },
  Settlement: { label: "Settlement", dot: "bg-amber-500", hex: "#f59e0b", text: "text-amber-700" },
};

// Cycled through for the per-company pie/bar chart, since the number of
// companies is dynamic and can't be given fixed Tailwind classes ahead of time.
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

function classifyStatus(item: CaseItem, stage: StageKey): StatusBucket {
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

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const cases = useMemo(
    () =>
      initialCases.filter((c) => {
        if (c.archived) return false;
        const referenceDate = c.filingDate || c.date;
        if (!isWithinRange(referenceDate, startDate, endDate)) return false;
        return true;
      }),
    [startDate, endDate]
  );

  // Stage -> bucket -> count
  const stageBreakdown = useMemo(() => {
    const result: Record<StageKey, Record<StatusBucket, number>> = {
      sena: { Pending: 0, Settled: 0, "Not Settled": 0 },
      la: { Pending: 0, Settled: 0, "Not Settled": 0 },
      nlrc: { Pending: 0, Settled: 0, "Not Settled": 0 },
      ca: { Pending: 0, Settled: 0, "Not Settled": 0 },
      sc: { Pending: 0, Settled: 0, "Not Settled": 0 },
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

  // Conic-gradient pie (by case count) for the Won / Lost / Settlement split.
  const pieGradient = useMemo(() => {
    if (categoryCaseTotal === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";
    let cursor = 0;
    const stops = CATEGORY_ORDER.map((cat) => {
      const count = categoryTotals[cat].count;
      const start = cursor;
      const sliceDeg = (count / categoryCaseTotal) * 360;
      cursor += sliceDeg;
      return `${CATEGORY_META[cat].hex} ${start}deg ${cursor}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [categoryTotals, categoryCaseTotal]);

  // Case count per company, for the "Cases by Company" pie/bar chart below.
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

  const companyPieGradient = useMemo(() => {
    if (cases.length === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";
    let cursor = 0;
    const stops = companyBreakdown.map(({ count, color }) => {
      const start = cursor;
      const sliceDeg = (count / cases.length) * 360;
      cursor += sliceDeg;
      return `${color} ${start}deg ${cursor}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [companyBreakdown, cases.length]);

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
    <div className="h-full min-w-0 space-y-4 overflow-y-auto bg-[#F5F1E3] p-4">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-lg font-medium tracking-tight text-[#12331F] md:text-xl">Analytics</h1>
          <p className="mt-0.5 text-xs text-slate-500">Case status and judgment award breakdown by stage.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
        </div>
      </div>

      {/* TOP SUMMARY */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Cases Analyzed</p>
            <p className="text-lg font-semibold text-[#12331F]">{cases.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Judgment Awards Paid</p>
            <p className="text-lg font-semibold text-[#12331F]">{formatCurrency(String(grandTotal))}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Handshake size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Cases Still at SEnA</p>
            <p className="text-lg font-semibold text-[#12331F]">
              {stageBreakdown.sena.Pending + stageBreakdown.sena.Settled + stageBreakdown.sena["Not Settled"]}
            </p>
          </div>
        </div>
      </div>

      {/* STATUS BREAKDOWN PER STAGE */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-[#12331F]">Case Status by Stage</h2>

        {/* Overall totals — same rollup used on the dashboard, scoped to the
            cases currently in view (date range applied above). */}
        <div className="mb-3">
          <SummaryCards cases={cases} />
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
                      <p className="text-[10px] text-slate-400">{total} case{total === 1 ? "" : "s"}</p>
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
                      <span className={`font-medium ${BUCKET_STYLES[bucket].text}`}>{counts[bucket]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-[#12331F]">Award Outcome Breakdown</h2>
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
                    <div className="w-24 shrink-0 text-right text-xs font-semibold text-slate-700">
                      {formatCurrency(String(amount))}
                    </div>
                    <div className="w-16 shrink-0 text-right text-[11px] text-slate-400">
                      {count} case{count === 1 ? "" : "s"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pie chart (by case count) */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5 self-start text-[11px] uppercase tracking-wide text-slate-400">
              <PieChartIcon size={13} />
              By case count
            </div>
            <div className="relative h-36 w-36">
              <div className="h-36 w-36 rounded-full" style={{ background: pieGradient }} />
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-lg font-semibold text-[#12331F]">{categoryCaseTotal}</span>
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
                    <span className={`font-medium ${meta.text}`}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CASES BY COMPANY */}
      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#12331F]">
          <Building2 size={14} className="text-slate-400" />
          Cases by Company
        </h2>
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
                      <div className="w-16 shrink-0 text-right text-[11px] text-slate-400">
                        {count} case{count === 1 ? "" : "s"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pie chart (by case count) */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5 self-start text-[11px] uppercase tracking-wide text-slate-400">
              <PieChartIcon size={13} />
              By case count
            </div>
            <div className="relative h-36 w-36">
              <div className="h-36 w-36 rounded-full" style={{ background: companyPieGradient }} />
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-lg font-semibold text-[#12331F]">{cases.length}</span>
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
                    <span className="shrink-0 font-medium text-slate-700">
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
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#12331F]">
          <Users size={14} className="text-slate-400" />
          Cases Handled per Personnel
        </h2>
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
                    <span className="shrink-0 rounded-full bg-[#12331F]/10 px-2 py-0.5 text-[10px] font-medium text-[#12331F]">
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