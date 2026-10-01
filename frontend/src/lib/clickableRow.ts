import type { KeyboardEvent, MouseEvent } from "react";

// Clicks that land on a real control inside the row (buttons, links, inputs)
// belong to that control, so they must not also open the details modal.
const INTERACTIVE = "button, a, input, select, textarea, label";

export function clickableRowProps(onOpen: () => void) {
  return {
    tabIndex: 0,
    onClick: (event: MouseEvent<HTMLElement>) => {
      if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
      onOpen();
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen();
      }
    },
  };
}

export const CLICKABLE_ROW_CLS =
  "cursor-pointer transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12331F]/30";