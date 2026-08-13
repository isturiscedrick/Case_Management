import { Field } from "./Field";

export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10";

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

const TO_BE_COMPUTED = "To be computed";

export function JudgmentAwardField({
  label,
  value,
  onChange,
  amountSpecValue,
  onAmountSpecChange,
  computedSpecValue,
  onComputedSpecChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  // Manual entry shown when mode is "Amount".
  amountSpecValue?: string;
  onAmountSpecChange?: (v: string) => void;
  // Manual entry shown when mode is "To be computed".
  computedSpecValue?: string;
  onComputedSpecChange?: (v: string) => void;
}) {
  const isComputed = value === TO_BE_COMPUTED;

  return (
    <Field label={label}>
      <div className="space-y-2">
        <select
          className={inputCls}
          value={isComputed ? TO_BE_COMPUTED : "Amount"}
          onChange={(e) => {
            onChange(e.target.value === TO_BE_COMPUTED ? TO_BE_COMPUTED : "");
          }}
        >
          <option value="Amount">Amount</option>
          <option value={TO_BE_COMPUTED}>{TO_BE_COMPUTED}</option>
        </select>

        {!isComputed && (
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
        )}

        {isComputed ? (
          <input
            required
            type="text"
            className={inputCls}
            value={computedSpecValue ?? ""}
            onChange={(e) => onComputedSpecChange?.(e.target.value)}
            placeholder="Enter computation basis"
          />
        ) : (
          <input
            required
            type="text"
            className={inputCls}
            value={amountSpecValue ?? ""}
            onChange={(e) => onAmountSpecChange?.(e.target.value)}
            placeholder="Enter remarks/basis for this amount"
          />
        )}
      </div>
    </Field>
  );
}