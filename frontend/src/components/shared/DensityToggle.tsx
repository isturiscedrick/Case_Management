"use client";

import { useEffect, useState } from "react";

type Density = "comfortable" | "compact";

const STORAGE_KEY = "cmi:table-density";

const OPTIONS: Array<{ value: Density; label: string }> = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

function applyDensity(next: Density) {
  document.documentElement.dataset.density = next;
}

export function DensityToggle() {
  const [density, setDensity] = useState<Density>("comfortable");

  // Read the saved choice after mount so server and client markup match.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: fall back to the default.
    }
    const next: Density = saved === "compact" ? "compact" : "comfortable";
    setDensity(next);
    applyDensity(next);
  }, []);

  const choose = (next: Density) => {
    setDensity(next);
    applyDensity(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saved across reloads, but still applies for this session.
    }
  };

  return (
    <div
      role="group"
      aria-label="Table density"
      className="hidden items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs sm:inline-flex"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={density === option.value}
          onClick={() => choose(option.value)}
          className={`rounded-md px-2.5 py-1.5 font-medium transition ${
            density === option.value
              ? "bg-[#12331F] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}