import { Briefcase, CheckCircle2, Clock3, XCircle } from "lucide-react";

import type { CaseItem } from "@/types/case";
import { SummaryCard } from "@/components/cases/SummaryCard";
import { getCaseStatusSummary } from "@/lib/caseHelpers";

export function SummaryCards({ cases, hideTotal = false }: { cases: CaseItem[]; hideTotal?: boolean }) {
  return (
    <div className={`grid gap-2.5 sm:grid-cols-2 ${hideTotal ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
      {!hideTotal && (
        <SummaryCard
          label="Total Cases"
          value={cases.length}
          icon={Briefcase}
          accent="bg-slate-100 text-slate-700"
        />
      )}

      <SummaryCard
        label="Settled"
        value={cases.filter((item) => getCaseStatusSummary(item) === "Settled").length}
        icon={CheckCircle2}
        accent="bg-emerald-50 text-emerald-600"
      />

      <SummaryCard
        label="Pending"
        value={cases.filter((item) => getCaseStatusSummary(item) === "Pending").length}
        icon={Clock3}
        accent="bg-amber-50 text-amber-600"
      />

      <SummaryCard
        label="Not Settled"
        value={cases.filter((item) => getCaseStatusSummary(item) === "Not Settled").length}
        icon={XCircle}
        accent="bg-rose-50 text-rose-600"
      />
    </div>
  );
}