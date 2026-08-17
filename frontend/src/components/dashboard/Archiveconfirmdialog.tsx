import type { CaseItem } from "@/types/case";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
export function ArchiveConfirmDialog({
  item,
  onConfirm,
  onCancel,
}: {
  item: CaseItem;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const title = item.archived ? "Restore Case" : "Archive Case";
  const confirmLabel = item.archived ? "Restore" : "Archive";
  const confirmPhrase = item.archived ? "RESTORE" : "ARCHIVE";
  const message = item.archived
    ? `Restore "${item.caseNo} · ${item.company}" to the active case list?`
    : `Archive "${item.caseNo} · ${item.company}"? You can restore it later from the Archived Cases page.`;

  return (
    <ConfirmDialog
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      confirmPhrase={confirmPhrase}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}