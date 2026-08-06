import type { CaseItem } from "@/types/case";
import { formatDate, formatCurrency, getTotalJudgementReward } from "@/lib/caseHelpers";
import { getStageGates } from "@/lib/caseValidation";
import { DetailRow } from "./DetailRow";
import { StatusBadge } from "./StatusBadge";

const TO_BE_COMPUTED = "To be computed";

function formatProgress(value: string, specification?: string) {
  if ((value === "Others" || value === "Not Settled") && specification) {
    return `${value} (${specification})`;
  }

  return value || "-";
}

// Mirrors JudgementRewardField's two modes in CaseForm: a numeric "Amount"
// (with a required basis/remarks spec) or "To be computed" (with a
// required computation-basis spec). Falls back to "-" when nothing's set.
function formatJudgementReward(info: {
  judgementReward: string;
  judgementRewardSpecification?: string;
  judgementRewardComputedSpecification?: string;
}) {
  if (!info.judgementReward) return "-";

  if (info.judgementReward === TO_BE_COMPUTED) {
    return info.judgementRewardComputedSpecification
      ? `${TO_BE_COMPUTED} (${info.judgementRewardComputedSpecification})`
      : TO_BE_COMPUTED;
  }

  const amount = formatCurrency(info.judgementReward);
  return info.judgementRewardSpecification
    ? `${amount} (${info.judgementRewardSpecification})`
    : amount;
}

export function ViewCaseContent({ item }: { item: CaseItem }) {
  const totalJudgementReward = getTotalJudgementReward(item);
  // Same gating rules CaseForm uses to decide whether a stage's fields are
  // enabled/reachable yet — hide the whole section here if the stage isn't
  // enabled, rather than only when it has no data.
  const { laEnabled, nlrcEnabled, caEnabled, scEnabled } = getStageGates(item);

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
          label="Handling Personnel"
          value={
            item.handlingPersonnel === "Others" && item.handlingPersonnelSpecification
              ? `${item.handlingPersonnel} (${item.handlingPersonnelSpecification})`
              : item.handlingPersonnel || "-"
          }
        />
        <DetailRow
          label="Cause of Action"
          value={
            item.cause.length
              ? item.causeSpecification
                ? `${item.cause.join(", ")} (${item.causeSpecification})`
                : item.cause.join(", ")
              : "-"
          }
        />
        <DetailRow
          label="Remarks"
          value={item.remarkSpecification ? `${item.remarks} (${item.remarkSpecification})` : item.remarks}
        />
      </div>

      {laEnabled && (
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-600">Labor Arbiter (LA)</h3>
        <div className="grid gap-x-6 sm:grid-cols-5">
          <DetailRow label="Date" value={formatDate(item.la.date)} />
          <DetailRow label="Status" value={item.la.status} />
          <DetailRow label="Judgement Reward" value={formatJudgementReward(item.la)} />
          <DetailRow label="Progress" value={formatProgress(item.caseProgress.la, item.caseProgress.laSpecification)} />
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
      )}

      {nlrcEnabled && (
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-600">NLRC</h3>
        <div className="grid gap-x-6 sm:grid-cols-5">
          <DetailRow label="Date" value={formatDate(item.nlrc.date)} />
          <DetailRow label="Status" value={item.nlrc.status} />
          <DetailRow label="Judgement Award" value={formatJudgementReward(item.nlrc)} />
          <DetailRow label="Progress" value={formatProgress(item.caseProgress.nlrc, item.caseProgress.nlrcSpecification)} />
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
      )}

      {caEnabled && (
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Court of Appeals (CA)</h3>
        <div className="grid gap-x-6 sm:grid-cols-5">
          <DetailRow label="Date" value={formatDate(item.ca.date)} />
          <DetailRow label="Status" value={item.ca.status} />
          <DetailRow label="Judgement Award" value={formatJudgementReward(item.ca)} />
          <DetailRow label="Progress" value={formatProgress(item.caseProgress.ca, item.caseProgress.caSpecification)} />
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
      )}

      {scEnabled && (
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-600">Supreme Court (SC)</h3>
        <div className="grid gap-x-6 sm:grid-cols-5">
          <DetailRow label="Date" value={formatDate(item.sc.date)} />
          <DetailRow label="Status" value={item.sc.status} />
          <DetailRow label="Judgement Award" value={formatJudgementReward(item.sc)} />
          <DetailRow label="Progress" value={formatProgress(item.caseProgress.sc, item.caseProgress.scSpecification)} />
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
      )}
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Total Judgement Reward
        </h3>

      <div className="mt-3 max-w-sm space-y-3">
        <DetailRow label="Amount" value={formatCurrency(totalJudgementReward)} />
        <DetailRow label="Category" value={item.totalPaid?.category || "-"} />
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