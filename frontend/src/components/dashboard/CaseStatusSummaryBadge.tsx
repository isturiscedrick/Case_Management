import type { CaseStatusSummary } from "@/lib/caseHelpers";
import { CASE_STATUS_SUMMARY_STYLES } from "@/constants/caseOptions";

export function CaseStatusSummaryBadge({ status }: { status: CaseStatusSummary }) {
  const style = CASE_STATUS_SUMMARY_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}