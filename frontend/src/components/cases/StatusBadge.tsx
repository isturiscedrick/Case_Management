import type { CaseStatus } from "@/types/case";
import { STATUS_STYLES, DEFAULT_STATUS_STYLE } from "@/constants/caseOptions";

export function StatusBadge({ status }: { status: CaseStatus }) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}