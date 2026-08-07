import { Handshake, Gavel, Building2, Landmark, Scale, User } from "lucide-react";
import type { CaseItem } from "@/types/case";
import { formatDate, formatCurrency, getTotalJudgementReward } from "@/lib/caseHelpers";
import { getStageGates } from "@/lib/caseValidation";
import { DetailRow } from "./DetailRow";
import { StatusBadge } from "./StatusBadge";

const TO_BE_COMPUTED = "To be computed";

// Same color coding used on the Analytics page (STAGE_META) and CaseForm
// (STAGE_STYLES) so a stage reads as the same color everywhere in the app.
// Presentational only.
const STAGE_STYLES = {
  sena: { icon: Handshake, ring: "border-teal-200", chip: "bg-teal-50 text-teal-700", text: "text-teal-700" },
  la: { icon: Gavel, ring: "border-sky-200", chip: "bg-sky-50 text-sky-700", text: "text-sky-700" },
  nlrc: { icon: Building2, ring: "border-violet-200", chip: "bg-violet-50 text-violet-700", text: "text-violet-700" },
  ca: { icon: Landmark, ring: "border-fuchsia-200", chip: "bg-fuchsia-50 text-fuchsia-700", text: "text-fuchsia-700" },
  sc: { icon: Scale, ring: "border-rose-200", chip: "bg-rose-50 text-rose-700", text: "text-rose-700" },
} as const;

function SectionHeader({ stage, title }: { stage: keyof typeof STAGE_STYLES; title: string }) {
  const meta = STAGE_STYLES[stage];
  const Icon = meta.icon;
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.chip}`}>
        <Icon size={14} />
      </div>
      <h3 className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}>{title}</h3>
    </div>
  );
}

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
    <div className="space-y-4">
      <div className={`rounded-xl border ${STAGE_STYLES.sena.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="sena" title="Single Entry Approach (SEnA)" />
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
      </div>

      {laEnabled && (
      <div className={`rounded-xl border ${STAGE_STYLES.la.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="la" title="Labor Arbiter (LA)" />
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
      <div className={`rounded-xl border ${STAGE_STYLES.nlrc.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="nlrc" title="NLRC" />
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
      <div className={`rounded-xl border ${STAGE_STYLES.ca.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="ca" title="Court of Appeals (CA)" />
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
      <div className={`rounded-xl border ${STAGE_STYLES.sc.ring} bg-white p-4 shadow-sm sm:p-5`}>
        <SectionHeader stage="sc" title="Supreme Court (SC)" />
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

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          <Landmark size={13} />
          Total Judgement Reward
        </h3>
        <div className="max-w-sm space-y-3">
          <DetailRow label="Amount" value={formatCurrency(totalJudgementReward)} />
          <DetailRow label="Category" value={item.totalPaid?.category || "-"} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <User size={12} className="text-slate-300" />
        <p>
          Created by <span className="font-medium text-slate-600">{item.createdBy || "-"}</span>
          {item.createdAt && <> on {formatDate(item.createdAt)}</>}
        </p>
      </div>
    </div>
  );
}