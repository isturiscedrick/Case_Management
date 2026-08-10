import type { CaseItem } from "@/types/case";
import { TABLE_COLUMN_COUNT } from "@/constants/caseOptions";
import { CaseTableRow } from "@/components/dashboard/CaseTableRow"
export function CaseTable({
  cases,
  onView,
  onEdit,
  onToggleArchive,
}: {
  cases: CaseItem[];
  onView: (item: CaseItem) => void;
  onEdit: (item: CaseItem) => void;
  onToggleArchive: (item: CaseItem) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full table-fixed border-separate border-spacing-0 text-[11px]">
          <colgroup>
            <col className="w-32" />
            <col className="w-16" />
            <col className="w-16" />
            <col className="w-28" />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-20" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-16" />

            <col className="w-24" />

            {/* LA */}
            <col className="w-16" />
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-16" />

            {/* NLRC */}
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-16" />
            <col className="w-20" />

            {/* CA */}
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-16" />
            <col className="w-20" />

            {/* SC */}
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-16" />
            <col className="w-20" />

            {/* Total Paid */}
            <col className="w-28" />
            <col className="w-28" />

            {/* Actions */}
            <col className="w-16" />
          </colgroup>

          <thead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th rowSpan={2} className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-50 p-2 text-left">
                Company
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Status
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Last Updated
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Case Title
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Case No.
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Complainants
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Venue
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Handling Personnel
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Cause of Action
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Filing Date
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-2 text-left">
                Remarks
              </th>

              <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center text-sky-700">
                Labor Arbiter
              </th>
              <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center text-violet-700">
                National Labor Relations Commission
              </th>
              <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center text-fuchsia-700">
                Court of Appeals
              </th>
              <th colSpan={5} className="sticky top-0 z-20 h-9 border-b border-r border-slate-200 bg-rose-50/60 p-1.5 text-center text-rose-700">
                Supreme Court
              </th>

              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-emerald-50/60 p-2 text-center text-emerald-700">
                Amount
              </th>
              <th rowSpan={2} className="sticky top-0 z-20 border-b border-r border-slate-200 bg-emerald-50/60 p-2 text-center text-emerald-700">
                Category
              </th>

              <th rowSpan={2} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 p-2 text-left">
                Actions
              </th>
            </tr>

            <tr>
              {/* LA */}
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Date</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Status</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Judgement Reward</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Remarks</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-sky-50/60 p-1.5 text-center">Progress</th>

              {/* NLRC */}
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Date</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Status</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Judgement Reward</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Remarks</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-violet-50/60 p-1.5 text-center">Progress</th>

              {/* CA */}
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Date</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Status</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Judgement Award</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Remarks</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-fuchsia-50/60 p-1.5 text-center">Progress</th>

              {/* SC */}
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Date</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Status</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Judgement Award</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Remarks</th>
              <th className="sticky top-9 z-20 border-b border-slate-200 bg-rose-50/60 p-1.5 text-center">Progress</th>
            </tr>
          </thead>

          <tbody>
            {cases.map((item) => (
              <CaseTableRow key={item.id} item={item} onView={onView} onEdit={onEdit} onToggleArchive={onToggleArchive} />
            ))}

            {cases.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLUMN_COUNT} className="p-8 text-center text-sm text-slate-400">
                  No cases match your filters. Try a different search or reset the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}