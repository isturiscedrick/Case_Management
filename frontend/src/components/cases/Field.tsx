import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="flex items-start gap-1 text-[11px] font-medium text-rose-600">
      <CircleAlert size={11} className="mt-0.5 shrink-0" />
      {message}
    </span>
  );
}

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label
      className={`flex flex-col gap-1.5 ${
        error
          ? "[&_input]:border-rose-300 [&_select]:border-rose-300 [&_textarea]:border-rose-300 [&_input]:bg-rose-50/40 [&_select]:bg-rose-50/40 [&_textarea]:bg-rose-50/40"
          : ""
      }`}
    >
      <span className="text-xs font-medium text-slate-500">{label}</span>

      {children}

      <FieldError message={error} />
    </label>
  );
}