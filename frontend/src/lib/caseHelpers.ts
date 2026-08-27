import type { CaseDraft, CaseItem } from "@/types/case";
export function cloneDraft(draft: CaseDraft): CaseDraft {
  return JSON.parse(JSON.stringify(draft));
}

// Dates are stored as ISO strings ("YYYY-MM-DD") so <input type="date"> can bind
// to them directly. This formats them as MM/DD/YYYY for display in the table/view.
export function formatDate(iso: string): string {
  if (!iso) return "-";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso; // fallback for legacy non-ISO values
  const [y, m, d] = parts;
  return `${m}/${d}/${y}`;
}

export function formatCurrency(value: string): string {
  if (!value) return "-";
  if (value === "To be computed") return value;
  const num = Number(value);
  if (Number.isNaN(num)) return value; // fallback for legacy non-numeric values
  return `₱${num.toLocaleString()}`;
}

export function getTotalJudgmentAward(draft: CaseDraft): string {
  const stagesLatestFirst = [draft.sc, draft.ca, draft.nlrc, draft.la];
  const latestStage = stagesLatestFirst.find((stage) => stage.judgmentAward.trim() !== "");
  return latestStage ? latestStage.judgmentAward : "";
}

export type CaseStatusSummary = "Settled" | "Not Settled" | "Pending" | "Closed";

export function getCaseStatusSummary(item: CaseItem): CaseStatusSummary {
  // "Closed" is the standalone lock flag set via "Close Case" in the form
  // (CaseForm.tsx -> setTop("closed", true)). It takes priority over
  // stage/remarks progress, since a closed case's Case Status column should
  // read "Closed" regardless of what state its stages were in at the
  // moment it was closed.
  if (item.closed) return "Closed";

  const values = [
    item.status === "Closed" ? "Settled" : "",
    item.remarks,
    item.caseProgress.la,
    item.caseProgress.nlrc,
    item.caseProgress.ca,
    item.caseProgress.sc,
  ];

  if (values.includes("Settled")) return "Settled";
  if (values.includes("Not Settled") || values.includes("Others")) return "Not Settled";
  return "Pending";
}
// Friendly display label for a Total Paid category value. Keeps the raw
// TotalPaidCategory values ("Judgment-Award-W" / "Judgment-Award-L") intact
// everywhere they're used as keys/filters — this only affects what's shown.
export function formatTotalPaidCategory(category: string | undefined): string {
  if (category === "Judgment-Award-W") return "Judgment (In Favor)";
  if (category === "Judgment-Award-L") return "Judgment (Not In Favor)";
  if (category === "Settlement") return "Settlement";
  return category || "-";
}