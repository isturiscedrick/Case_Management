import { Briefcase, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";

import type { CaseItem } from "@/types/case";
import { SummaryCard } from "@/components/cases/SummaryCard";

export function SummaryCards({ cases }: { cases: CaseItem[] }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label="Total Cases"
        value={cases.length}
        icon={Briefcase}
        accent="bg-slate-100 text-slate-700"
      />

      <SummaryCard
        label="Filed"
        value={cases.filter((item) => item.status === "Filed").length}
        icon={FileCheck2}
        accent="bg-sky-50 text-sky-600"
      />

      <SummaryCard
        label="Pending"
        value={cases.filter((item) => item.status === "Pending").length}
        icon={Clock3}
        accent="bg-amber-50 text-amber-600"
      />

      <SummaryCard
        label="Closed"
        value={cases.filter((item) => item.status === "Closed").length}
        icon={CheckCircle2}
        accent="bg-emerald-50 text-emerald-600"
      />
    </div>
  );
}