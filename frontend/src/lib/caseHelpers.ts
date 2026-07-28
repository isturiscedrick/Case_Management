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

// Money fields are stored as plain numeric strings (e.g. "150000") so
// <input type="number"> can bind to them directly. This formats them
// with a peso sign and thousands separators for display.
export function formatCurrency(value: string): string {
  if (!value) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return value; // fallback for legacy non-numeric values
  return `₱${num.toLocaleString()}`;
}