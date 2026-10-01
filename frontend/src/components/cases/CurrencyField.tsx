import { Field, FieldError } from "./Field";

export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10";

// Trailing "!" (Tailwind v4 important) so it beats inputCls's border/bg regardless of CSS order.
const INVALID_CLS = "border-rose-300! bg-rose-50/40!";

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

function formatWithCommas(raw: string) {
  if (!raw) return "";
  const [int, dec] = raw.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas;
}

function sanitizeAmount(input: string) {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const [int, ...rest] = cleaned.split(".");
  if (rest.length === 0) return int;
  return `${int}.${rest.join("").slice(0, 2)}`;
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
  amountError,
  specError,
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
  // Inline validation messages (amount input / basis textarea).
  amountError?: string;
  specError?: string;
}) {
  const isComputed = value === TO_BE_COMPUTED;
  const specInvalid = specError ? INVALID_CLS : "";

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
          <div className="space-y-1.5">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                ₱
              </span>
              <input
                type="text"
                inputMode="decimal"
                className={`${inputCls} pl-7 ${amountError ? INVALID_CLS : ""}`}
                value={formatWithCommas(value)}
                onChange={(e) => onChange(sanitizeAmount(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <FieldError message={amountError} />
          </div>
        )}

        {isComputed ? (
          <textarea
            required
            rows={3}
            className={`${inputCls} ${specInvalid}`}
            value={computedSpecValue ?? ""}
            onChange={(e) => onComputedSpecChange?.(e.target.value)}
            placeholder="Enter computation basis"
          />
        ) : (
          <textarea
            required
            rows={3}
            className={`${inputCls} ${specInvalid}`}
            value={amountSpecValue ?? ""}
            onChange={(e) => onAmountSpecChange?.(e.target.value)}
            placeholder="Enter remarks/basis for this amount"
          />
        )}

        <FieldError message={specError} />
      </div>
    </Field>
  );
}