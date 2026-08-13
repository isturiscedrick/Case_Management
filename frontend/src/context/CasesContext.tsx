"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { CaseItem } from "@/types/case";
import { initialCases } from "@/data/initialCases";
import { sampleHistory, type HistoryEntry, type HistoryAction } from "@/data/historyEvents";
import { CURRENT_USER } from "@/constants/caseOptions";

type CasesContextValue = {
  cases: CaseItem[];
  historyLog: HistoryEntry[];
  addCase: (newCase: CaseItem) => void;
  updateCase: (updatedCase: CaseItem) => void;
  toggleArchive: (id: number) => void;
};

const CasesContext = createContext<CasesContextValue | null>(null);

// Simple incrementing id for entries generated during this session, distinct
// from the seeded sample history ids (h1, h2, ...).
let historyIdCounter = 0;
function nextHistoryId() {
  historyIdCounter += 1;
  return `h-live-${historyIdCounter}`;
}

function logEntry(item: CaseItem, action: HistoryAction, detail?: string): HistoryEntry {
  return {
    id: nextHistoryId(),
    caseNo: item.caseNo,
    company: item.company,
    action,
    performedBy: CURRENT_USER,
    timestamp: new Date().toISOString(),
    detail,
  };
}

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>(sampleHistory);

  const addCase = useCallback((newCase: CaseItem) => {
    setCases((prev) => [...prev, newCase]);
    setHistoryLog((prev) => [logEntry(newCase, "created"), ...prev]);
  }, []);

  const updateCase = useCallback((updatedCase: CaseItem) => {
    setCases((prev) => prev.map((item) => (item.id === updatedCase.id ? updatedCase : item)));
    setHistoryLog((prev) => [logEntry(updatedCase, "updated", "Case details updated."), ...prev]);
  }, []);

  const toggleArchive = useCallback(
    (id: number) => {
      const target = cases.find((item) => item.id === id);
      if (!target) return;

      const updatedItem = { ...target, archived: !target.archived };

      setCases((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
      setHistoryLog((prev) => [
        logEntry(updatedItem, updatedItem.archived ? "archived" : "restored"),
        ...prev,
      ]);
    },
    [cases]
  );

  const value = useMemo(
    () => ({ cases, historyLog, addCase, updateCase, toggleArchive }),
    [cases, historyLog, addCase, updateCase, toggleArchive]
  );

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) {
    throw new Error("useCases must be used within a CasesProvider");
  }
  return ctx;
}