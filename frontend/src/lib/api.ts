// Minimal API client for endpoints that don't require auth yet. Once real
// login/session handling exists, this is the place to attach the bearer
// token to requests.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface CompanyOut {
  company_id: number;
  company_name: string;
  company_group: string | null;
  company_group2: string | null;
}

export async function fetchCompanies(): Promise<CompanyOut[]> {
  const res = await fetch(`${API_BASE_URL}/api/companies`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch companies: ${res.status}`);
  }

  return res.json();
}