import type { CaseItem } from "@/types/case";
import { Modal } from "@/components/cases/Modal";
import { ViewCaseContent } from "@/components/cases/ViewCaseContent";

export function ViewCaseModal({ item, onClose }: { item: CaseItem; onClose: () => void }) {
  return (
    <Modal title={`${item.caseNo} · ${item.company}`} onClose={onClose} wide>
      <ViewCaseContent item={item} />
    </Modal>
  );
}