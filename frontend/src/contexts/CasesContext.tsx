"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { CaseDraft, CaseItem } from "@/types/case";
import { CURRENT_USER } from "@/constants/caseOptions";
import { getTotalJudgementReward } from "@/lib/caseHelpers";
import { initialCases, initialCompanies } from "@/data/initialCases";

type CasesContextValue = {
  cases: CaseItem[];
  companies: string[];
  // Copied from dashboard/page.tsx's saveCreate — same id/date/createdBy
  // computation, same totalPaid.amount derivation.
  createCase: (draft: CaseDraft) => void;
  // Copied from dashboard/page.tsx's saveEdit — same date/totalPaid.amount
  // recomputation, id/other fields preserved from the existing case.
  updateCase: (id: number, draft: CaseDraft) => void;
  // Copied from dashboard/page.tsx's confirmToggleArchive — flips the
  // archived flag on the matching case.
  toggleArchive: (id: number) => void;
  // Copied from archive/page.tsx's confirmRestore — explicitly sets
  // archived to false (used from the Archive page's Restore action).
  restoreCase: (id: number) => void;
};

const CasesContext = createContext<CasesContextValue | null>(null);

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [companies] = useState<string[]>(initialCompanies);

  const createCase = (draft: CaseDraft) => {
    const nextId = Math.max(0, ...cases.map((item) => item.id)) + 1;
    const today = new Date().toISOString().slice(0, 10);

    const newCase: CaseItem = {
      ...draft,
      id: nextId,
      date: today,
      createdBy: CURRENT_USER,
      createdAt: today,
      totalPaid: {
        ...draft.totalPaid,
        amount: getTotalJudgementReward(draft),
      },
    };

    setCases((prev) => [...prev, newCase]);
  };

  const updateCase = (id: number, draft: CaseDraft) => {
    const today = new Date().toISOString().slice(0, 10);

    const updatedCase: CaseItem = {
      ...draft,
      id,
      date: today,
      totalPaid: {
        ...draft.totalPaid,
        amount: getTotalJudgementReward(draft),
      },
    };

    setCases((prev) => prev.map((item) => (item.id === id ? updatedCase : item)));
  };

  const toggleArchive = (id: number) => {
    setCases((prev) =>
      prev.map((item) => (item.id === id ? { ...item, archived: !item.archived } : item))
    );
  };

  const restoreCase = (id: number) => {
    setCases((prev) => prev.map((item) => (item.id === id ? { ...item, archived: false } : item)));
  };

  return (
    <CasesContext.Provider
      value={{ cases, companies, createCase, updateCase, toggleArchive, restoreCase }}
    >
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) {
    throw new Error("useCases must be used within a CasesProvider");
  }
  return ctx;
}