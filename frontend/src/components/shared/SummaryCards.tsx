import { Briefcase, CheckCircle2, Clock3, XCircle, Lock } from "lucide-react";

import type { CaseItem } from "@/types/case";
import { SummaryCard } from "@/components/shared/SummaryCard";
import { getCaseStatusSummary, type CaseStatusSummary } from "@/lib/caseHelpers";

export function SummaryCards({
  cases,
  hideTotal = false,
  activeStatus = "All",
  onSelect,
}: {
  cases: CaseItem[];
  hideTotal?: boolean;
  // Optional: when onSelect is passed, the cards act as status filters.
  activeStatus?: "All" | CaseStatusSummary;
  onSelect?: (status: "All" | CaseStatusSummary) => void;
}) {
  const counts: Record<CaseStatusSummary, number> = {
    Settled: 0,
    Pending: 0,
    "Not Settled": 0,
    Closed: 0,
  };
  cases.forEach((item) => {
    counts[getCaseStatusSummary(item)] += 1;
  });

  const pick = (status: CaseStatusSummary) =>
    onSelect ? () => onSelect(activeStatus === status ? "All" : status) : undefined;

  return (
    <div className={`grid gap-2.5 sm:grid-cols-2 ${hideTotal ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
      {!hideTotal && (
        <SummaryCard
          label="Total Cases"
          value={cases.length}
          icon={Briefcase}
          accent="bg-slate-100 text-slate-700"
          onClick={onSelect ? () => onSelect("All") : undefined}
        />
      )}

      <SummaryCard
        label="Settled"
        value={counts.Settled}
        icon={CheckCircle2}
        accent="bg-emerald-50 text-emerald-600"
        onClick={pick("Settled")}
        active={activeStatus === "Settled"}
      />

      <SummaryCard
        label="Pending"
        value={counts.Pending}
        icon={Clock3}
        accent="bg-amber-50 text-amber-600"
        onClick={pick("Pending")}
        active={activeStatus === "Pending"}
      />

      <SummaryCard
        label="Not Settled"
        value={counts["Not Settled"]}
        icon={XCircle}
        accent="bg-rose-50 text-rose-600"
        onClick={pick("Not Settled")}
        active={activeStatus === "Not Settled"}
      />

      <SummaryCard
        label="Closed"
        value={counts.Closed}
        icon={Lock}
        accent="bg-slate-100 text-slate-600"
        onClick={pick("Closed")}
        active={activeStatus === "Closed"}
      />
    </div>
  );
}