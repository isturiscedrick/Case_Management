import type { CaseDraft } from "@/types/case";

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