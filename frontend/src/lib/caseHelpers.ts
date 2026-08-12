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

// Money fields are stored as plain numeric strings (e.g. "150000") so
// <input type="number"> can bind to them directly. This formats them
// with a peso sign and thousands separators for display. Judgement
// Reward/Award fields can also hold the literal "To be computed" sentinel
// (see JudgementRewardField) — that's displayed as-is rather than parsed.
export function formatCurrency(value: string): string {
  if (!value) return "-";
  if (value === "To be computed") return value;
  const num = Number(value);
  if (Number.isNaN(num)) return value; // fallback for legacy non-numeric values
  return `₱${num.toLocaleString()}`;
}

// The amount shown while creating or editing a case reflects the LATEST
// stage's Judgement Reward/Award — not a sum across stages. As a case
// escalates (LA -> NLRC -> CA -> SC), each new stage's outcome supersedes
// the earlier one rather than adding to it, so this picks the most
// advanced stage that actually has a value (SC first, then CA, NLRC, LA).
// If that stage is "To be computed", this returns that string as-is —
// formatCurrency already knows how to display it.
export function getTotalJudgementReward(draft: CaseDraft): string {
  const stagesLatestFirst = [draft.sc, draft.ca, draft.nlrc, draft.la];
  const latestStage = stagesLatestFirst.find((stage) => stage.judgementReward.trim() !== "");
  return latestStage ? latestStage.judgementReward : "";
}

export type CaseStatusSummary = "Settled" | "Not Settled" | "Pending";

// Overall case status across all stages, separate from item.status (which
// is SEnA's own Filed/Pending/Execution/Closed field). Display-only — never
// written back to the case, doesn't affect stage gating or validation.
export function getCaseStatusSummary(item: CaseItem): CaseStatusSummary {
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