import type { ReactNode } from "react";
import {
  Info,
  AlertTriangle,
} from "lucide-react";

export type InfoBannerTone =
  | "warning"
  | "info";

export function InfoBanner({
  tone,
  children,
}: {
  tone: InfoBannerTone;
  children: ReactNode;
}) {
  if (tone === "warning") {
    return (
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
        <AlertTriangle
          size={13}
          className="mt-0.5 shrink-0"
        />

        <p>{children}</p>
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
      <Info
        size={13}
        className="mt-0.5 shrink-0 text-slate-400"
      />

      <p>{children}</p>
    </div>
  );
}