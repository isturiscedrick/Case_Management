import type { CaseDraft, CaseItem } from "@/types/case";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
export function SaveConfirmDialog({
  mode,
  draft,
  activeCase,
  onConfirm,
  onCancel,
}: {
  mode: "create" | "edit";
  draft: CaseDraft;
  activeCase: CaseItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const title = mode === "create" ? "Create Case" : "Save Changes";
  const confirmLabel = mode === "create" ? "Create Case" : "Save Changes";
  const message =
    mode === "create"
      ? `Create a new case for "${draft.company || "this company"}" with Case No. "${draft.caseNo}"?`
      : `Save changes to "${activeCase?.caseNo} · ${activeCase?.company}"?`;

  return (
    <ConfirmDialog title={title} message={message} confirmLabel={confirmLabel} onConfirm={onConfirm} onCancel={onCancel} />
  );
}