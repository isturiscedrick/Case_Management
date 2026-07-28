import { X } from "lucide-react";

// Small, focused confirmation dialog for destructive/state-changing actions.
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-blue-950">{title}</h2>
          <button onClick={onCancel} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-[#0B1D3A] px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#132a4d]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}