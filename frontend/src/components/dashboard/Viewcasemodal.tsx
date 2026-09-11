import type { CaseItem } from "@/types/case";
import { Lock } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { ViewCaseContent } from "@/components/shared/ViewCaseContent";

export function ViewCaseModal({
  item,
  onClose,
  lockedByUsername,
}: {
  item: CaseItem;
  onClose: () => void;
  // When set, this case is being viewed read-only because another user
  // currently holds the edit lock (see case_lock_service.py). Renders a
  // banner explaining why editing isn't available right now.
  lockedByUsername?: string;
}) {
  return (
    <Modal title={`${item.caseNo} · ${item.company}`} onClose={onClose} wide>
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