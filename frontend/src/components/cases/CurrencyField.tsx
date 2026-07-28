import { Field } from "./Field";

export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-900 focus:bg-white focus:ring-2 focus:ring-blue-950/10";

// Peso-prefixed, number-only input for money fields (Money Reward, Money
// Award). Stores a plain numeric string (e.g. "150000"); the peso sign is
// a visual prefix, not part of the stored value.
export function CurrencyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          ₱
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          className={`${inputCls} pl-7`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
        />
      </div>
    </Field>
  );
}