import type { CaseItem } from "@/types/case";
import { formatDate, formatCurrency } from "@/lib/caseHelpers";
import { DetailRow } from "./DetailRow";
import { StatusBadge } from "./StatusBadge";
import { CaseProgressStepper } from "./CaseProgressStepper";

export function ViewCaseContent({ item }: { item: CaseItem }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-x-6 sm:grid-cols-2">
        <DetailRow label="Company" value={item.company} />
        <DetailRow label="Status" value={<StatusBadge status={item.status} />} />
        <DetailRow label="Last Updated" value={formatDate(item.date)} />
        <DetailRow label="Filing Date" value={formatDate(item.filingDate)} />
        <DetailRow label="Case Title" value={item.caseTitle} />
        <DetailRow label="Case No." value={item.caseNo} />
        <DetailRow
          label="Complainants"
          value={
            <ul className="list-disc pl-5">
              {item.complainants.map((person, index) => (
                <li key={index}>{person}</li>
              ))}
            </ul>
          }
        />
        <DetailRow label="Venue" value={item.venue} />
        <DetailRow
          label="Cause of Action"
          value={item.causeSpecification ? `${item.cause} (${item.causeSpecification})` : item.cause}
        />
        <DetailRow
          label="Remarks"
          value={item.remarkSpecification ? `${item.remarks} (${item.remarkSpecification})` : item.remarks}
        />
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-600">Labor Arbiter (LA)</h3>
        <div className="grid gap-x-6 sm:grid-cols-4">
          <DetailRow label="Date" value={formatDate(item.la.date)} />
          <DetailRow label="Status" value={item.la.status} />
          <DetailRow label="Judgement Reward" value={formatCurrency(item.la.judgementReward)} />
          <DetailRow
            label="Remarks"
            value={
              item.la.remarks === "Other" && item.la.remarksSpecification
                ? `${item.la.remarks} (${item.la.remarksSpecification})`
                : item.la.remarks
            }
          />
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-600">NLRC</h3>
        <div className="grid gap-x-6 sm:grid-cols-4">
          <DetailRow label="Date" value={formatDate(item.nlrc.date)} />
          <DetailRow label="Status" value={item.nlrc.status} />
          <DetailRow label="Judgement Award" value={formatCurrency(item.nlrc.judgementReward)} />
          <DetailRow
            label="Remarks"
            value={
              item.nlrc.remarks === "Other" && item.nlrc.remarksSpecification
                ? `${item.nlrc.remarks} (${item.nlrc.remarksSpecification})`
                : item.nlrc.remarks
            }
          />
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Court of Appeals (CA)</h3>
        <div className="grid gap-x-6 sm:grid-cols-4">
          <DetailRow label="Date" value={formatDate(item.ca.date)} />
          <DetailRow label="Status" value={item.ca.status} />
          <DetailRow label="Judgement Award" value={formatCurrency(item.ca.judgementReward)} />
          <DetailRow
            label="Remarks"
            value={
              item.ca.remarks === "Other" && item.ca.remarksSpecification
                ? `${item.ca.remarks} (${item.ca.remarksSpecification})`
                : item.ca.remarks
            }
          />
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-600">Supreme Court (SC)</h3>
        <div className="grid gap-x-6 sm:grid-cols-4">
          <DetailRow label="Date" value={formatDate(item.sc.date)} />
          <DetailRow label="Status" value={item.sc.status} />
          <DetailRow label="Judgement Award" value={formatCurrency(item.sc.judgementReward)} />
          <DetailRow
            label="Remarks"
            value={
              item.sc.remarks === "Other" && item.sc.remarksSpecification
                ? `${item.sc.remarks} (${item.sc.remarksSpecification})`
                : item.sc.remarks
            }
          />
        </div>
      </div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Total Amount Paid
        </h3>

<div className="grid grid-cols-2 gap-4 mt-3">
  <DetailRow
    label="Amount"
    value={
      item.totalPaid
        ? formatCurrency(item.totalPaid.amount)
        : "-"
    }
  />

  <DetailRow
    label="Category"
    value={item.totalPaid?.category || "-"}
  />
</div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Progress</h3>
        <CaseProgressStepper progress={item.caseProgress} />
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          Created by <span className="font-medium text-slate-600">{item.createdBy || "-"}</span>
          {item.createdAt && <> on {formatDate(item.createdAt)}</>}
        </p>
      </div>
    </div>
  );
}