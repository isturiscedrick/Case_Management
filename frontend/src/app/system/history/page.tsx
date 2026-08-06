"use client";

import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";

type HistoryAction = "created" | "updated" | "archived" | "restored";

interface HistoryEntry {
  id: string;
  caseNo: string;
  company: string;
  action: HistoryAction;
  performedBy: string;
  timestamp: string; // ISO string
  detail?: string;
}

// ---- Sample data ------------------------------------------------------
// Mirrors the cases in data/initialCases.ts. Replace this with real logged
// actions once create/edit/archive/restore write into a shared store.
const sampleHistory: HistoryEntry[] = [
  // NLRC-2026-001 · ABC Corporation
  {
    id: "h1",
    caseNo: "NLRC-2026-001",
    company: "ABC Corporation",
    action: "updated",
    performedBy: "Maria Santos",
    timestamp: "2026-08-15T10:30:00Z",
    detail: "NLRC status set to Affirmed.",
  },
  {
    id: "h2",
    caseNo: "NLRC-2026-001",
    company: "ABC Corporation",
    action: "updated",
    performedBy: "Maria Santos",
    timestamp: "2026-08-01T09:10:00Z",
    detail: "LA decision recorded — award granted (₱150,000).",
  },
  {
    id: "h3",
    caseNo: "NLRC-2026-001",
    company: "ABC Corporation",
    action: "created",
    performedBy: "Maria Santos",
    timestamp: "2026-07-20T08:45:00Z",
  },

  // NLRC-2026-002 · XYZ Industries
  {
    id: "h4",
    caseNo: "NLRC-2026-002",
    company: "XYZ Industries",
    action: "updated",
    performedBy: "John Dela Peña",
    timestamp: "2026-09-01T13:20:00Z",
    detail: "SC decision completed — case closed.",
  },
  {
    id: "h5",
    caseNo: "NLRC-2026-002",
    company: "XYZ Industries",
    action: "updated",
    performedBy: "John Dela Peña",
    timestamp: "2026-08-20T11:05:00Z",
    detail: "CA petition dismissed.",
  },
  {
    id: "h6",
    caseNo: "NLRC-2026-002",
    company: "XYZ Industries",
    action: "updated",
    performedBy: "John Dela Peña",
    timestamp: "2026-08-10T15:40:00Z",
    detail: "NLRC decision released — affirmed.",
  },
  {
    id: "h7",
    caseNo: "NLRC-2026-002",
    company: "XYZ Industries",
    action: "updated",
    performedBy: "John Dela Peña",
    timestamp: "2026-07-25T09:55:00Z",
    detail: "LA settlement reached (₱75,000).",
  },
  {
    id: "h8",
    caseNo: "NLRC-2026-002",
    company: "XYZ Industries",
    action: "created",
    performedBy: "John Dela Peña",
    timestamp: "2026-07-15T08:30:00Z",
  },

  // NLRC-2026-003 · DEF Manufacturing
  {
    id: "h9",
    caseNo: "NLRC-2026-003",
    company: "DEF Manufacturing",
    action: "created",
    performedBy: "Maria Santos",
    timestamp: "2026-07-10T10:00:00Z",
  },

  // NLRC-2026-004 · GHI Logistics (archived)
  {
    id: "h10",
    caseNo: "NLRC-2026-004",
    company: "GHI Logistics",
    action: "archived",
    performedBy: "admin",
    timestamp: "2026-05-30T16:00:00Z",
    detail: "Case closed after Supreme Court affirmed the award.",
  },
  {
    id: "h11",
    caseNo: "NLRC-2026-004",
    company: "GHI Logistics",
    action: "updated",
    performedBy: "admin",
    timestamp: "2026-05-28T14:15:00Z",
    detail: "SC petition denied with finality.",
  },
  {
    id: "h12",
    caseNo: "NLRC-2026-004",
    company: "GHI Logistics",
    action: "updated",
    performedBy: "admin",
    timestamp: "2026-04-10T11:30:00Z",
    detail: "CA sustained the NLRC ruling.",
  },
  {
    id: "h13",
    caseNo: "NLRC-2026-004",
    company: "GHI Logistics",
    action: "updated",
    performedBy: "admin",
    timestamp: "2026-03-18T09:50:00Z",
    detail: "NLRC affirmed the LA decision; appeal denied.",
  },
  {
    id: "h14",
    caseNo: "NLRC-2026-004",
    company: "GHI Logistics",
    action: "updated",
    performedBy: "admin",
    timestamp: "2026-02-22T10:20:00Z",
    detail: "LA decision recorded — award granted (₱185,000).",
  },
  {
    id: "h15",
    caseNo: "NLRC-2026-004",
    company: "GHI Logistics",
    action: "created",
    performedBy: "admin",
    timestamp: "2026-01-14T08:15:00Z",
  },

  // NLRC-2026-005 · MNO Construction (archived)
  {
    id: "h16",
    caseNo: "NLRC-2026-005",
    company: "MNO Construction",
    action: "archived",
    performedBy: "admin",
    timestamp: "2026-04-05T15:45:00Z",
    detail: "Settled amicably before Labor Arbiter decision.",
  },
  {
    id: "h17",
    caseNo: "NLRC-2026-005",
    company: "MNO Construction",
    action: "updated",
    performedBy: "admin",
    timestamp: "2026-03-30T13:10:00Z",
    detail: "LA compromise agreement reached (₱42,000).",
  },
  {
    id: "h18",
    caseNo: "NLRC-2026-005",
    company: "MNO Construction",
    action: "created",
    performedBy: "admin",
    timestamp: "2026-02-20T09:00:00Z",
  },

  // NLRC-2026-006 · PQR Services (archived)
  {
    id: "h19",
    caseNo: "NLRC-2026-006",
    company: "PQR Services",
    action: "archived",
    performedBy: "admin",
    timestamp: "2026-06-12T14:30:00Z",
    detail: "Settled via compromise agreement.",
  },
  {
    id: "h20",
    caseNo: "NLRC-2026-006",
    company: "PQR Services",
    action: "updated",
    performedBy: "admin",
    timestamp: "2026-05-20T10:40:00Z",
    detail: "LA settlement reached (₱60,000).",
  },
  {
    id: "h21",
    caseNo: "NLRC-2026-006",
    company: "PQR Services",
    action: "created",
    performedBy: "admin",
    timestamp: "2026-03-02T08:20:00Z",
  },
];

const ACTION_STYLES: Record<HistoryAction, { label: string; badge: string; dot: string }> = {
  created: { label: "Created", badge: "bg-sky-50 text-sky-600 ring-sky-200", dot: "bg-sky-500" },
  updated: { label: "Updated", badge: "bg-amber-50 text-amber-600 ring-amber-200", dot: "bg-amber-500" },
  archived: { label: "Archived", badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  restored: { label: "Restored", badge: "bg-emerald-50 text-emerald-600 ring-emerald-200", dot: "bg-emerald-500" },
};

const ACTION_FILTERS: Array<"All" | HistoryAction> = ["All", "created", "updated", "archived", "restored"];

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [history] = useState<HistoryEntry[]>(sampleHistory);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"All" | HistoryAction>("All");

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return history
      .filter((entry) => {
        const matchesAction = actionFilter === "All" || entry.action === actionFilter;
        const matchesSearch =
          entry.company.toLowerCase().includes(keyword) ||
          entry.caseNo.toLowerCase().includes(keyword) ||
          entry.performedBy.toLowerCase().includes(keyword);
        return matchesAction && matchesSearch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, search, actionFilter]);

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden bg-[#F5F1E3] p-4">
      {/* HEADER */}
      <div>
        <h1 className="font-serif text-lg font-medium tracking-tight text-[#12331F] md:text-xl">History</h1>
        <p className="mt-0.5 text-xs text-slate-500">A record of changes made across all cases.</p>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, case no., or user"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as "All" | HistoryAction)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white sm:w-40"
          >
            {ACTION_FILTERS.map((a) => (
              <option key={a} value={a}>
                {a === "All" ? "All Actions" : ACTION_STYLES[a].label}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-2 text-[11px] text-slate-400">
          Showing {filtered.length} of {history.length} events
        </p>
      </div>

      {/* EMPTY STATE */}
      {history.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#12331F]/5">
            <History className="h-5 w-5 text-[#12331F]/40" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">No activity yet</p>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            Actions like creating, updating, archiving, and restoring cases will appear here.
          </p>
        </div>
      )}

      {/* TABLE */}
      {history.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-[11px]">
              <thead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 p-2 text-left">Action</th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 p-2 text-left">Case No.</th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 p-2 text-left">Company</th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 p-2 text-left">Detail</th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 p-2 text-left">Performed By</th>
                  <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 p-2 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const style = ACTION_STYLES[entry.action];
                  return (
                    <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="p-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${style.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-500">{entry.caseNo}</td>
                      <td className="p-2 text-slate-700">{entry.company}</td>
                      <td className="truncate p-2 text-slate-500">{entry.detail || "-"}</td>
                      <td className="p-2 text-slate-600">{entry.performedBy}</td>
                      <td className="p-2 text-slate-500">{formatTimestamp(entry.timestamp)}</td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                      No history events match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}