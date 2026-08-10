import type { CaseDraft, CaseItem } from "@/types/case";
import { Modal } from "@/components/cases/Modal";
import { CaseForm } from "@/components/dashboard/form/CaseForm";

type EditRestrictions = {
  restrictSenaEditing: boolean;
  restrictSenaRemarksEditing: boolean;
  restrictLaDetailsEditing: boolean;
  restrictLaProgressOnly: boolean;
  restrictLaProgressEditing: boolean;
  restrictNlrcDetailsEditing: boolean;
  restrictNlrcProgressOnly: boolean;
  restrictNlrcProgressEditing: boolean;
  restrictCaDetailsEditing: boolean;
  restrictCaProgressOnly: boolean;
  restrictCaProgressEditing: boolean;
};

export function CaseFormModal({
  mode,
  activeCase,
  draft,
  onChange,
  companies,
  editRestrictions,
  onCancel,
  onSave,
}: {
  mode: "create" | "edit";
  activeCase: CaseItem | null;
  draft: CaseDraft;
  onChange: (next: CaseDraft) => void;
  companies: string[];
  // Only required (and applied) in edit mode.
  editRestrictions?: EditRestrictions;
  onCancel: () => void;
  onSave: () => void;
}) {
  const title = mode === "create" ? "Create Case" : `Edit Case · ${activeCase?.caseNo ?? ""}`;
  const saveLabel = mode === "create" ? "Create Case" : "Save Changes";

  return (
    <Modal
      title={title}
      onClose={onCancel}
      wide
      footer={
        <>
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="rounded-lg bg-[#12331F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1B4A2C]"
          >
            {saveLabel}
          </button>
        </>
      }
    >
      <CaseForm
        value={draft}
        onChange={onChange}
        companies={companies}
        {...(mode === "edit" && editRestrictions ? editRestrictions : {})}
      />
    </Modal>
  );
}