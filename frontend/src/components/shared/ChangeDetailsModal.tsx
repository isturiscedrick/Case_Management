"use client";

import { Modal } from "@/components/shared/Modal";
import { formatDateTime } from "@/lib/caseHelpers";
import type { FieldChange, HistoryOut, PasswordResetNotification } from "@/lib/api";
import type { HistoryEntry } from "@/data/historyEvents";

export type ChangeDetails = {
  title: string;
  action?: string;
  caseNo?: string | null;
  company?: string | null;
  performedBy?: string | null;
  timestamp?: string | null;
  detail?: string | null;
  changes?: FieldChange[] | null;
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function historyEntryToDetails(entry: HistoryEntry): ChangeDetails {
  return {
    title: `${capitalize(entry.action)} · ${entry.caseNo}`,
    action: entry.action,
    caseNo: entry.caseNo,
    company: entry.company,
    performedBy: entry.performedBy,
    timestamp: entry.timestamp,
    detail: entry.detail,
    changes: entry.changes,
  };
}

export function historyOutToDetails(out: HistoryOut): ChangeDetails {
  return {
    title: `${capitalize(out.action)} · ${out.case_no}`,
    action: out.action,
    caseNo: out.case_no,
    company: out.company,
    performedBy: out.performed_by_username,
    timestamp: out.created_at,
    detail: out.detail,
    changes: out.changes,
  };
}

export function notificationToDetails(item: PasswordResetNotification): ChangeDetails {
  return {
    title: `Case updated${item.case_no ? ` · ${item.case_no}` : ""}`,
    action: "updated",
    caseNo: item.case_no,
    company: item.company,
    performedBy: item.actor_full_name,
    timestamp: item.created_at,
    detail: item.message,
    changes: item.changes,
  };
}

function MetaRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className="wrap-break-word text-sm text-slate-800">{value || "-"}</span>
    </div>
  );
}

function EmptyValue() {
  return <span className="italic text-slate-400">empty</span>;
}

export function ChangeDetailsModal({
  details,
  onClose,
}: {
  details: ChangeDetails;
  onClose: () => void;
}) {
  const changes = details.changes ?? [];
  const isCreated = details.action === "created";

  return (
    <Modal title={details.title} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid gap-x-6 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2 sm:grid-cols-2">
          <MetaRow label="Case No." value={details.caseNo} />
          <MetaRow label="Company" value={details.company} />
          <MetaRow label="Performed by" value={details.performedBy} />
          <MetaRow label="When" value={details.timestamp ? formatDateTime(details.timestamp) : null} />
          {details.detail && (
            <div className="sm:col-span-2">
              <MetaRow label="Note" value={details.detail} />
            </div>
          )}
        </div>

        {changes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            No field-level changes were recorded for this entry. Entries made before this feature
            was added don&apos;t have a comparison.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">
              {isCreated
                ? `${changes.length} field${changes.length === 1 ? "" : "s"} entered`
                : `${changes.length} field${changes.length === 1 ? "" : "s"} changed`}
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-1/4 p-2.5 font-semibold">Field</th>
                    {!isCreated && <th className="w-[37.5%] p-2.5 font-semibold">Previous</th>}
                    <th className={`p-2.5 font-semibold ${isCreated ? "" : "w-[37.5%]"}`}>
                      {isCreated ? "Value" : "Updated"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {changes.map((change, index) => (
                    <tr key={`${change.field}-${index}`}>
                      <td className="p-2.5 align-top font-medium text-slate-700">{change.field}</td>
                      {!isCreated && (
                        <td className="whitespace-pre-wrap wrap-break-word bg-rose-50/60 p-2.5 align-top text-rose-700">
                          {change.before || <EmptyValue />}
                        </td>
                      )}
                      <td className="whitespace-pre-wrap wrap-break-word bg-emerald-50/60 p-2.5 align-top text-emerald-700">
                        {change.after || <EmptyValue />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}