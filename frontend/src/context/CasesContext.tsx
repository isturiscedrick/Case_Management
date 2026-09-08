"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { CaseItem } from "@/types/case";
import type { HistoryEntry } from "@/data/historyEvents";
import { fetchCases, fetchHistory, UnauthorizedError } from "@/lib/api";
import { mapCaseOutToCaseItem } from "@/lib/caseMapper";

type CasesContextValue = {
  cases: CaseItem[];
  historyLog: HistoryEntry[];
  isLoading: boolean;
  loadError: string | null;
  refetch: () => void;
  addCase: (newCase: CaseItem) => void;
  updateCase: (updatedCase: CaseItem) => void;
  toggleArchive: (id: number) => void;
};

const CasesContext = createContext<CasesContextValue | null>(null);

function mapHistory(out: Awaited<ReturnType<typeof fetchHistory>>[number]): HistoryEntry {
  return {
    id: String(out.history_id),
    caseNo: out.case_no,
    company: out.company,
    action: out.action,
    performedBy: out.performed_by_username ?? "-",
    timestamp: out.created_at ?? "",
    detail: out.detail ?? undefined,
  };
}

export function CasesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [activeCases, archivedCases, historyOut] = await Promise.all([
          fetchCases(false),
          fetchCases(true),
          fetchHistory(),
        ]);

        if (cancelled) return;

        setCases([...activeCases, ...archivedCases].map(mapCaseOutToCaseItem));
        setHistoryLog(historyOut.map(mapHistory));
      } catch (err) {
        if (cancelled) return;

        if (err instanceof UnauthorizedError) {
          router.push("/login");
          return;
        }

        console.error("Failed to load cases/history:", err);
        setLoadError("Unable to load cases right now. Please check your connection and try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken, router]);

  // TEMPORARY (Phase 2 is read-only): these still mutate local state only.
  // Phase 3/4/5 will replace these bodies with real POST/PUT/toggle-archive
  // calls followed by a refetch(), instead of optimistic local edits.
  const addCase = useCallback((newCase: CaseItem) => {
    setCases((prev) => [...prev, newCase]);
  }, []);

  const updateCase = useCallback((updatedCase: CaseItem) => {
    setCases((prev) => prev.map((item) => (item.id === updatedCase.id ? updatedCase : item)));
  }, []);

  const toggleArchive = useCallback((id: number) => {
    setCases((prev) =>
      prev.map((item) => (item.id === id ? { ...item, archived: !item.archived } : item))
    );
  }, []);

  const value = useMemo(
    () => ({ cases, historyLog, isLoading, loadError, refetch, addCase, updateCase, toggleArchive }),
    [cases, historyLog, isLoading, loadError, refetch, addCase, updateCase, toggleArchive]
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