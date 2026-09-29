import type { CaseDraft, CaseItem } from "@/types/case";
import { Modal } from "@/components/shared/Modal";
import { InlineAlert } from "@/components/shared/InlineAlert";
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
  isAdmin = false,   // + NEW
  errors = [],
  submitError = null,
  onDismissSubmitError,
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
  isAdmin?: boolean;   // + NEW
  // Live validation errors, shown in a banner pinned to the top of the
  // modal body. Empty = nothing shown.
  errors?: string[];
  // Error from the last save attempt (e.g. server-side rejection).
  submitError?: string | null;
  onDismissSubmitError?: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const title = mode === "create" ? "Create Case" : `Edit Case · ${activeCase?.caseNo ?? ""}`;
  const saveLabel = mode === "create" ? "Create Case" : "Save Changes";
  const submitMessages = submitError ? submitError.split("\n").filter(Boolean) : [];

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
      {(errors.length > 0 || submitMessages.length > 0) && (
        <div className="sticky top-0 z-10 -mx-6 -mt-5 mb-4 space-y-2 bg-white px-6 pb-3 pt-5">
          {errors.length > 0 && (
            <InlineAlert
              title="Please fix the following before saving:"
              messages={errors}
            />
          )}

          {submitMessages.length > 0 && (
            <InlineAlert
              messages={submitMessages}
              onDismiss={onDismissSubmitError}
            />
          )}
        </div>
      )}

      <CaseForm
        value={draft}
        onChange={onChange}
        companies={companies}
        {...(mode === "edit" && editRestrictions ? editRestrictions : {})}
        isNewUnsavedCase={mode === "create"}
        isAdmin={isAdmin}   // + NEW
      />
    </Modal>
  );
}