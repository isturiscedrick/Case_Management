import type { CaseItem } from "@/types/case";

export const initialCases: CaseItem[] = [
  {
    id: 1,
    company: "ABC Corporation",
    status: "Filed",
    date: "2026-07-20",
    caseTitle: "Illegal Dismissal",
    caseNo: "NLRC-2026-001",
    complainants: ["Juan Dela Cruz"],
    venue: "NLRC Manila",
    cause: "Money Claims",
    causeSpecification: "",
    filingDate: "2026-07-22",
    remarks: "Initial Hearing",

    la: {
      date: "2026-08-01",
      status: "Illegal Dismissal",
      judgementReward: "150000",
      remarks: "Other",
      remarksSpecification: "Award Granted",
    },

    nlrc: {
      date: "2026-08-15",
      status: "Affirmed",
      judgementReward: "150000",
      remarks: "Other",
      remarksSpecification: "For Decision",
    },

    ca: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "Not Appealed",
    },

    sc: {
      date: "",
      status: "Affirmed",
      judgementReward: "200000",
      remarks: "Other",
      remarksSpecification: "Closed",
    },

    totalPaid: {
      amount: "200000",
      category: "Judgement-Award-L",
    },

    caseProgress: {
      la: "Completed",
      nlrc: "Pending",
      ca: "Not Started",
      sc: "Not Started",
    },

    createdBy: "Maria Santos",
    createdAt: "2026-07-20",
    archived: false,
  },

  {
    id: 2,
    company: "XYZ Industries",
    status: "Closed",
    date: "2026-07-15",
    caseTitle: "Money Claim",
    caseNo: "NLRC-2026-002",
    complainants: ["Pedro Santos"],
    venue: "NLRC Quezon",
    cause: "Unpaid Benefits",
    filingDate: "2026-07-18",
    remarks: "Resolved",

    la: {
      date: "2026-07-25",
      status: "Affirmed",
      judgementReward: "75000",
      remarks: "Other",
      remarksSpecification: "Settlement",
    },

    nlrc: {
      date: "2026-08-10",
      status: "Affirmed",
      judgementReward: "75000",
      remarks: "Other",
      remarksSpecification: "Decision Released",
    },

    ca: {
      date: "2026-08-20",
      status: "Dismissed",
      judgementReward: "75000",
      remarks: "Other",
      remarksSpecification: "Dismissed",
    },

    sc: {
      date: "2026-09-01",
      status: "Affirmed",
      judgementReward: "75000",
      remarks: "Other",
      remarksSpecification: "Completed",
    },

    totalPaid: {
      amount: "75000",
      category: "Settlement",
    },

    caseProgress: {
      la: "Completed",
      nlrc: "Completed",
      ca: "Completed",
      sc: "Completed",
    },

    createdBy: "John Dela Peña",
    createdAt: "2026-07-15",
    archived: false,
  },

  {
    id: 3,
    company: "DEF Manufacturing",
    status: "Pending",
    date: "2026-07-10",
    caseTitle: "Labor Standards Violation",
    caseNo: "NLRC-2026-003",
    complainants: ["Maria Reyes"],
    venue: "DOLE Region IV",
    cause: "Non-payment of Wages",
    filingDate: "2026-07-12",
    remarks: "Under Investigation",

    la: {
      date: "",
      status: "",
      judgementReward: "-",
      remarks: "Not Appealed",
    },

    nlrc: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "Other",
      remarksSpecification: "Not Filed",
    },

    ca: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "Other",
      remarksSpecification: "Not Started",
    },

    sc: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "Other",
      remarksSpecification: "-",
    },

    totalPaid: {
      amount: "",
      category: "",
    },

    caseProgress: {
      la: "Pending",
      nlrc: "Not Started",
      ca: "Not Started",
      sc: "Not Started",
    },

    createdBy: "Maria Santos",
    createdAt: "2026-07-10",
    archived: false,
  },
];

export const initialCompanies: string[] = [
  "ABC Corporation",
  "XYZ Industries",
  "DEF Manufacturing",
  "GHI Logistics",
  "MNO Construction",
  "PQR Services",
];