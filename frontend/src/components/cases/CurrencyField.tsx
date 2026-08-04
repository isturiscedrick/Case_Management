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

// Judgement Reward/Award field for LA/NLRC/CA/SC stages. Adds an
// "Amount" vs "To be computed" mode dropdown on top of the peso input.
// When "To be computed" is selected, the stored value becomes the literal
// string "To be computed" and the numeric input is hidden. Switching back
// to "Amount" clears the value so a stale "To be computed" string can't
// leak into a numeric field.
const TO_BE_COMPUTED = "To be computed";

export function JudgementRewardField({
  label,
  value,
  onChange,
  specValue,
  onSpecChange,
  onModeChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  // Manual entry shown below the number input — required regardless of
  // mode (Amount or To be computed).
  specValue?: string;
  onSpecChange?: (v: string) => void;
  // Fires ONE atomic update carrying both the new reward value and the
  // new spec value when the mode dropdown changes. Using onChange +
  // onSpecChange separately here would fire two state updates built from
  // the same stale snapshot, and the second would silently overwrite the
  // first — this keeps the switch reliable.
  onModeChange: (rewardValue: string, specValue: string) => void;
}) {
  const isComputed = value === TO_BE_COMPUTED;

  return (
    <Field label={label}>
      <div className="space-y-2">
        <select
          className={inputCls}
          value={isComputed ? TO_BE_COMPUTED : "Amount"}
          onChange={(e) => {
            const reward = e.target.value === TO_BE_COMPUTED ? TO_BE_COMPUTED : "";
            onModeChange(reward, specValue ?? "");
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

        <input
          required
          type="text"
          className={inputCls}
          value={specValue ?? ""}
          onChange={(e) => onSpecChange?.(e.target.value)}
          placeholder={isComputed ? "Enter computation basis" : "Enter remarks/basis for this amount"}
        />
      </div>
    </Field>
  );
}