export type HistoryAction = "created" | "updated" | "archived" | "restored";

export interface HistoryEntry {
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
export const sampleHistory: HistoryEntry[] = [
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