import { CircleAlert, X } from "lucide-react";

export function InlineAlert({
  messages,
  title,
  onDismiss,
  className = "",
}: {
  messages: string[];
  title?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ${className}`}
    >
      <CircleAlert size={15} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}

        {messages.length === 1 && !title ? (
          <p>{messages[0]}</p>
        ) : (
          <ul className={`list-disc space-y-0.5 pl-5 ${title ? "mt-1" : ""}`}>
            {messages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 rounded-md p-1 text-rose-400 transition hover:bg-rose-100 hover:text-rose-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}