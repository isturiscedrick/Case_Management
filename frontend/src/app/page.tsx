"use client";

import { useEffect, useState } from "react";

interface CaseItem {
  id: number;
  title: string;
  status: string;
}

interface ApiResponse {
  cases: CaseItem[];
}

export default function Home() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/cases")
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        setCases(data.cases);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching cases:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">
          Case Management System
        </h1>
      </div>
    </main>
  );
}