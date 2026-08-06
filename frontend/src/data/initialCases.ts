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
    cause: ["Money Claims"],
    causeSpecification: "",
    filingDate: "2026-07-22",
    remarks: "Initial Hearing",

    handlingPersonnel: "ATTY. ELFJ",
    handlingPersonnelSpecification: "",

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
      la: "Not Settled",
      nlrc: "Others",
      ca: "",
      sc: "",
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
    cause: ["Unpaid Benefits"],
    filingDate: "2026-07-18",
    remarks: "Resolved",

    handlingPersonnel: "ATTY. MBSA",
    handlingPersonnelSpecification: "",

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
      la: "Settled",
      nlrc: "Settled",
      ca: "Settled",
      sc: "Settled",
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
    cause: ["Non-payment of Wages"],
    filingDate: "2026-07-12",
    remarks: "Under Investigation",

    handlingPersonnel: "ATTY. MBSA",
    handlingPersonnelSpecification: "",

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
      la: "Not Settled",
      nlrc: "",
      ca: "",
      sc: "",
    },

    createdBy: "Maria Santos",
    createdAt: "2026-07-10",
    archived: false,
  },

  // ---- Archived examples --------------------------------------------------

  {
    id: 4,
    company: "GHI Logistics",
    status: "Closed",
    date: "2026-05-30",
    caseTitle: "Illegal Dismissal and Money Claims",
    caseNo: "NLRC-2026-004",
    complainants: ["Ramon Reyes", "Liza Fernandez"],
    venue: "NLRC RAB IV",
    cause: ["Illegal Dismissal", "Money Claims"],
    causeSpecification: "",
    filingDate: "2026-01-14",
    remarks: "Case closed after Supreme Court affirmed the award.",
    remarkSpecification: "",

    handlingPersonnel: "ATTY. ELFJ",
    handlingPersonnelSpecification: "",

    la: {
      date: "2026-02-22",
      status: "Illegal Dismissal",
      judgementReward: "185000",
      judgementRewardSpecification: "Backwages and separation pay",
      remarks: "Other",
      remarksSpecification: "Decision in favor of complainants",
    },

    nlrc: {
      date: "2026-03-18",
      status: "Affirmed",
      judgementReward: "185000",
      judgementRewardSpecification: "Affirmed in toto",
      remarks: "Other",
      remarksSpecification: "Appeal denied",
    },

    ca: {
      date: "2026-04-10",
      status: "Affirmed",
      judgementReward: "185000",
      judgementRewardSpecification: "Petition dismissed",
      remarks: "Other",
      remarksSpecification: "CA sustained NLRC ruling",
    },

    sc: {
      date: "2026-05-28",
      status: "Affirmed",
      judgementReward: "185000",
      judgementRewardSpecification: "Final and executory",
      remarks: "Other",
      remarksSpecification: "Petition denied with finality",
    },

    totalPaid: {
      amount: "185000",
      category: "Judgement-Award-W",
    },

    caseProgress: {
      la: "Not Settled",
      laSpecification: "Appealed to NLRC",
      nlrc: "Not Settled",
      nlrcSpecification: "Appealed to CA",
      ca: "Not Settled",
      caSpecification: "Appealed to SC",
      sc: "Settled",
      scSpecification: "",
    },

    createdBy: "admin",
    createdAt: "2026-01-14",
    archived: true,
  },

  {
    id: 5,
    company: "MNO Construction",
    status: "Closed",
    date: "2026-04-05",
    caseTitle: "Unpaid Overtime and 13th Month Pay",
    caseNo: "NLRC-2026-005",
    complainants: ["Ana Villanueva"],
    venue: "NLRC NCR",
    cause: ["Money Claims"],
    causeSpecification: "",
    filingDate: "2026-02-20",
    remarks: "Settled amicably before Labor Arbiter decision.",
    remarkSpecification: "",

    handlingPersonnel: "ATTY. MBSA",
    handlingPersonnelSpecification: "",

    la: {
      date: "2026-03-30",
      status: "Settled",
      judgementReward: "42000",
      judgementRewardSpecification: "Compromise agreement",
      remarks: "Other",
      remarksSpecification: "Parties reached amicable settlement",
    },

    nlrc: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "",
      remarksSpecification: "",
    },

    ca: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "",
      remarksSpecification: "",
    },

    sc: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "",
      remarksSpecification: "",
    },

    totalPaid: {
      amount: "42000",
      category: "Settlement",
    },

    caseProgress: {
      la: "Settled",
      laSpecification: "",
      nlrc: "",
      nlrcSpecification: "",
      ca: "",
      caSpecification: "",
      sc: "",
      scSpecification: "",
    },

    createdBy: "admin",
    createdAt: "2026-02-20",
    archived: true,
  },

  {
    id: 6,
    company: "PQR Services",
    status: "Closed",
    date: "2026-06-12",
    caseTitle: "Illegal Suspension",
    caseNo: "NLRC-2026-006",
    complainants: ["Carlos Mendoza"],
    venue: "NLRC RAB III",
    cause: ["Illegal Suspension"],
    causeSpecification: "",
    filingDate: "2026-03-02",
    remarks: "Settled",
    remarkSpecification: "",

    // "Others" requires the specification field, matching what CaseForm
    // enforces when Handling Personnel is set to "Others".
    handlingPersonnel: "Others",
    handlingPersonnelSpecification: "Outsourced counsel — Atty. R. Villamor",

    la: {
      date: "2026-05-20",
      status: "Illegal Dismissal",
      judgementReward: "60000",
      judgementRewardSpecification: "Reinstatement with backwages, later settled",
      remarks: "Other",
      remarksSpecification: "Settled via compromise agreement",
    },

    nlrc: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "",
      remarksSpecification: "",
    },

    ca: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "",
      remarksSpecification: "",
    },

    sc: {
      date: "",
      status: "",
      judgementReward: "",
      remarks: "",
      remarksSpecification: "",
    },

    totalPaid: {
      amount: "60000",
      category: "Settlement",
    },

    caseProgress: {
      la: "Settled",
      laSpecification: "",
      nlrc: "",
      nlrcSpecification: "",
      ca: "",
      caSpecification: "",
      sc: "",
      scSpecification: "",
    },

    createdBy: "admin",
    createdAt: "2026-03-02",
    archived: true,
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