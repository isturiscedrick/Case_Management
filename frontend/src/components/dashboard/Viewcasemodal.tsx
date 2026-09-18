import type { CaseItem } from "@/types/case";
import { Archive, ArchiveRestore, Lock, RefreshCw } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { ViewCaseContent } from "@/components/shared/ViewCaseContent";

export function ViewCaseModal({
  item,
  onClose,
  lockedByUsername,
  onEdit,
  onToggleArchive,
  canEditClosed = false,
}: {
  item: CaseItem;
  onClose: () => void;
  // When set, this case is being viewed read-only because another user
  // currently holds the edit lock (see case_lock_service.py). Renders a
  // banner explaining why editing isn't available right now.
  lockedByUsername?: string;
  // + NEW — header action buttons. Omit either to hide that button.
  onEdit?: (item: CaseItem) => void;
  onToggleArchive?: (item: CaseItem) => void;
  // Admins can still update a closed case (mirrors CaseTableRow).
  canEditClosed?: boolean;
}) {
  const isUpdateLocked = !!item.closed && !canEditClosed;

  const headerActions = (onEdit || onToggleArchive) && (
    <div className="flex items-center gap-2">
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(item)}
          disabled={isUpdateLocked}
          title={isUpdateLocked ? "This case is closed and can no longer be updated." : undefined}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isUpdateLocked
              ? "cursor-not-allowed border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <RefreshCw size={13} />
          Update
        </button>
      )}

      {onToggleArchive && (
        <button
          type="button"
          onClick={() => onToggleArchive(item)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
        >
          {item.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
          {item.archived ? "Restore" : "Archive"}
        </button>
      )}
    </div>
  );

  return (
    <Modal title={`${item.caseNo} · ${item.company}`} onClose={onClose} wide headerActions={headerActions}>
      {lockedByUsername && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
          <Lock size={15} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">{lockedByUsername}</span> is currently editing this case. You can view it, but editing is locked until they finish or their session times out.
          </p>
        </div>
      )}
      <ViewCaseContent item={item} />
    </Modal>
  );
}