"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Handshake,
  Gavel,
  Building2,
  Landmark,
  Scale,
  Briefcase,
} from "lucide-react";

import type { CaseItem } from "@/types/case";
import { initialCases } from "@/data/initialCases";
import { formatCurrency } from "@/lib/caseHelpers";

type StageKey = "sena" | "la" | "nlrc" | "ca" | "sc";
type StatusBucket = "Pending" | "Settled" | "Not Settled" | "Closed";

const STAGE_KEYS: StageKey[] = ["sena", "la", "nlrc", "ca", "sc"];
const BUCKETS: StatusBucket[] = ["Pending", "Settled", "Not Settled", "Closed"];

const STAGE_META: Record<StageKey, { label: string; icon: typeof Handshake; ring: string; bar: string; text: string }> = {
  sena: { label: "SEnA", icon: Handshake, ring: "border-teal-200", bar: "bg-teal-50/60", text: "text-teal-700" },
  la: { label: "Labor Arbiter", icon: Gavel, ring: "border-sky-200", bar: "bg-sky-50/60", text: "text-sky-700" },
  nlrc: { label: "NLRC", icon: Building2, ring: "border-violet-200", bar: "bg-violet-50/60", text: "text-violet-700" },
  ca: { label: "Court of Appeals", icon: Landmark, ring: "border-fuchsia-200", bar: "bg-fuchsia-50/60", text: "text-fuchsia-700" },
  sc: { label: "Supreme Court", icon: Scale, ring: "border-rose-200", bar: "bg-rose-50/60", text: "text-rose-700" },
};

const BUCKET_STYLES: Record<StatusBucket, { dot: string; bar: string; text: string }> = {
  Pending: { dot: "bg-amber-400", bar: "bg-amber-400", text: "text-amber-700" },
  Settled: { dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-700" },
  "Not Settled": { dot: "bg-rose-500", bar: "bg-rose-500", text: "text-rose-700" },
  Closed: { dot: "bg-slate-500", bar: "bg-slate-500", text: "text-slate-700" },
};

function isStageFilled(stage: CaseItem["la"]) {
  return !!(stage.date || stage.status || stage.judgementReward || stage.remarks || stage.remarksSpecification);
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
  if (item.status === "Closed") return "Closed";
  const progress = getStageProgressValue(item, stage);
  if (progress === "Settled") return "Settled";
  if (progress === "Not Settled" || progress === "Others") return "Not Settled";
  return "Pending";
}

function parseAmount(value: string | number | undefined | null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function AnalyticsPage() {
  const [includeArchived, setIncludeArchived] = useState(false);

  const cases = useMemo(
    () => initialCases.filter((c) => includeArchived || !c.archived),
    [includeArchived]
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

  // Total judgement award per stage (SEnA excluded — not tracked numerically)
  const stageAwards = useMemo(() => {
    const totals: Record<Exclude<StageKey, "sena">, number> = { la: 0, nlrc: 0, ca: 0, sc: 0 };
    cases.forEach((item) => {
      totals.la += parseAmount(item.la.judgementReward);
      totals.nlrc += parseAmount(item.nlrc.judgementReward);
      totals.ca += parseAmount(item.ca.judgementReward);
      totals.sc += parseAmount(item.sc.judgementReward);
    });
    return totals;
  }, [cases]);

  const grandTotal = useMemo(
    () => cases.reduce((sum, c) => sum + parseAmount(c.totalPaid?.amount), 0),
    [cases]
  );

  const maxAward = Math.max(stageAwards.la, stageAwards.nlrc, stageAwards.ca, stageAwards.sc, 1);

  return (
    <div className="h-full min-w-0 space-y-4 overflow-y-auto bg-[#F7F5F0] p-4">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-lg font-medium tracking-tight text-[#0B1D3A] md:text-xl">Analytics</h1>
          <p className="mt-0.5 text-xs text-slate-500">Case status and judgement award breakdown by stage.</p>
        </div>

        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Include archived cases
        </label>
      </div>

      {/* TOP SUMMARY */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Cases Analyzed</p>
            <p className="text-lg font-semibold text-[#0B1D3A]">{cases.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Judgement Awards Paid</p>
            <p className="text-lg font-semibold text-[#0B1D3A]">{formatCurrency(String(grandTotal))}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Handshake size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Cases Still at SEnA</p>
            <p className="text-lg font-semibold text-[#0B1D3A]">
              {stageBreakdown.sena.Pending + stageBreakdown.sena.Settled + stageBreakdown.sena["Not Settled"]}
            </p>
          </div>
        </div>
      </div>

      {/* STATUS BREAKDOWN PER STAGE */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-[#0B1D3A]">Case Status by Stage</h2>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {STAGE_KEYS.map((stage) => {
            const meta = STAGE_META[stage];
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
                      <p className={`text-xs font-semibold ${meta.text}`}>{meta.label}</p>
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

      {/* TOTAL JUDGEMENT AWARD PER STAGE */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-[#0B1D3A]">Total Judgement Award by Stage</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            {/* SEnA — not tracked numerically */}
            <div className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-xs font-medium text-teal-700">SEnA</div>
              <div className="flex-1 text-[11px] italic text-slate-400">Not tracked at SEnA level (conciliation stage, no formal award)</div>
            </div>

            {(["la", "nlrc", "ca", "sc"] as const).map((stage) => {
              const meta = STAGE_META[stage];
              const amount = stageAwards[stage];
              const pct = (amount / maxAward) * 100;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`w-32 shrink-0 text-xs font-medium ${meta.text}`}>{meta.label}</div>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                    <div
                      className={`h-full rounded-md ${BUCKET_STYLES.Settled.bar} opacity-80`}
                      style={{ width: `${amount > 0 ? Math.max(pct, 3) : 0}%` }}
                    />
                  </div>
                  <div className="w-28 shrink-0 text-right text-xs font-semibold text-slate-700">
                    {formatCurrency(String(amount))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}