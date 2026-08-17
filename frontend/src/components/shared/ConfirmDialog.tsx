import { useState } from "react";
import { X } from "lucide-react";

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmPhrase,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmPhrase?: string;
}) {
  const [typedValue, setTypedValue] = useState("");

  const requiresTyping = !!confirmPhrase;
  const isMatch =
    !requiresTyping ||
    typedValue.trim().toLowerCase() === confirmPhrase!.trim().toLowerCase();

  const handleConfirm = () => {
    if (!isMatch) return;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-[#12331F]">{title}</h2>
          <button onClick={onCancel} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">{message}</p>

          {requiresTyping && (
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Type <span className="font-semibold text-slate-700">&quot;{confirmPhrase}&quot;</span> to confirm
              </label>
              <input
                autoFocus
                type="text"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isMatch) {
                    handleConfirm();
                  }
                }}
                placeholder={confirmPhrase}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMatch}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium text-white transition ${
              isMatch
                ? "bg-[#0B1D3A] hover:bg-[#1B4A2C]"
                : "cursor-not-allowed bg-slate-300"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}