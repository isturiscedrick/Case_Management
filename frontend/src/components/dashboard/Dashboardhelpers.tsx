import type { CaseItem } from "@/types/case";

/**
 * Returns true when the case has no information yet in LA, NLRC, CA, or SC.
 * This means the case is still SEnA-only.
 */
export function isSenaOnlyCase(item: CaseItem) {
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

/**
 * Displays stage progress together with its specification when applicable.
 */
export function formatProgress(value: string, specification?: string) {
  if ((value === "Others" || value === "Not Settled") && specification) {
    return `${value} (${specification})`;
  }

  return value || "-";
}