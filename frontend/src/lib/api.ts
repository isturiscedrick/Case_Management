// Minimal API client. Auth uses a plain (non-httpOnly) "session" cookie
// holding the JWT access token — simple, but readable by JS, which is a
// known tradeoff until a proper backend-for-frontend proxy exists. Every
// authenticated call should go through authHeaders()/authFetch() below.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SESSION_COOKIE_NAME = "session";
// Mirrors settings.ACCESS_TOKEN_EXPIRE_MINUTES default (60) in
// backend/app/core/config.py. If that default changes, update this too —
// it only controls how long the browser keeps the cookie, not the token's
// actual validity (the backend still rejects an expired JWT regardless).
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60;

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

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export class LoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginError";
  }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new LoginError("Incorrect username or password.");
    }
    if (res.status === 403) {
      throw new LoginError("This account has been deactivated.");
    }
    throw new LoginError("Unable to sign in right now. Please try again.");
  }

  return res.json();
}

export function setSessionToken(token: string) {
  // Not httpOnly — this cookie is only a signal for app/page.tsx's
  // server-side redirect check and for reading the token back out on the
  // client to build Authorization headers. It is never sent to the
  // FastAPI backend as a cookie; the backend only ever sees it via the
  // Bearer header built in authHeaders().
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${SESSION_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearSessionToken() {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}

export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null; // SSR guard
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Used by later phases (case/history fetches) to attach the bearer token.
export function authHeaders(): HeadersInit {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
// ---------------------------------------------------------------------
// Cases / History (read-only for now — Phase 2)
// ---------------------------------------------------------------------

import type { CaseDraft } from "@/types/case";
import { mapCaseDraftToPayload, type CaseOut } from "./caseMapper";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated.");
    this.name = "UnauthorizedError";
  }
}

function formatApiError(detail: unknown, statusCode: number): string {
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "msg" in item) {
        const location = "loc" in item && Array.isArray(item.loc) ? ` (${item.loc.join(" > ")})` : "";
        return `${String(item.msg)}${location}`;
      }
      return JSON.stringify(item);
    });
    return messages.join("\n");
  }

  if (detail && typeof detail === "object" && "msg" in detail) {
    return String(detail.msg);
  }

  return `Request failed: ${statusCode}`;
}

async function authFetch(path: string): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: { ...authHeaders() },
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res;
}

export async function fetchCases(archived: boolean): Promise<CaseOut[]> {
  const res = await authFetch(`/api/cases?archived=${archived}&page_size=500`);
  return res.json();
}

export interface HistoryOut {
  history_id: number;
  case_id: number;
  case_no: string;
  company: string;
  action: "created" | "updated" | "archived" | "restored";
  performed_by_username: string | null;
  detail: string | null;
  created_at: string | null;
}

export async function fetchHistory(): Promise<HistoryOut[]> {
  const res = await authFetch(`/api/history?page_size=500`);
  return res.json();
}

async function authMutation(path: string, method: "POST" | "PUT", body?: unknown): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(formatApiError(detail?.detail, res.status));
  }
  return res;
}

export async function createCase(draft: CaseDraft): Promise<CaseOut> {
  const res = await authMutation("/api/cases", "POST", mapCaseDraftToPayload(draft));
  return res.json();
}

export async function updateCase(id: number, draft: CaseDraft): Promise<CaseOut> {
  const res = await authMutation(`/api/cases/${id}`, "PUT", mapCaseDraftToPayload(draft));
  return res.json();
}

export async function toggleArchiveCase(id: number): Promise<CaseOut> {
  const res = await authMutation(`/api/cases/${id}/toggle-archive`, "POST");
  return res.json();
}

export async function setCaseClosed(id: number, closed: boolean): Promise<CaseOut> {
  const path = closed ? `/api/cases/${id}/close` : `/api/cases/${id}/unclose`;
  const res = await authMutation(path, "POST");
  return res.json();
}

export interface CurrentUser {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture: string | null;
  role: "admin" | "handling_personnel" | "viewer";
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await authFetch("/api/auth/me");
  return res.json();
}

export async function fetchUsers(): Promise<CurrentUser[]> {
  const res = await authFetch("/api/auth/users");
  return res.json();
}

export type UserRole = CurrentUser["role"];

export interface UserCreatePayload {
  username: string;
  full_name: string;
  password: string;
  role: UserRole;
}

export async function registerUser(payload: UserCreatePayload): Promise<CurrentUser> {
  const res = await authMutation("/api/auth/register", "POST", payload);
  return res.json();
}

export interface UserProfileUpdate {
  username: string;
  full_name: string;
  current_password?: string;
  password?: string;
  profile_picture: string | null;
}

export async function updateCurrentUser(payload: UserProfileUpdate): Promise<CurrentUser> {
  const res = await authMutation("/api/auth/me", "PUT", payload);
  return res.json();
}

export async function resetUserPassword(userId: number, password: string): Promise<void> {
  await authMutation(`/api/auth/users/${userId}/password`, "PUT", { password });
}

export interface PasswordResetNotification {
  notification_id: number;
  user_id: number;
  notification_type: string;
  message: string;
  status: string;
  created_at: string | null;
  resolved_at: string | null;
}

export async function requestPasswordReset(): Promise<void> {
  await authMutation("/api/auth/me/password-reset-request", "POST");
}

export async function fetchPendingNotifications(): Promise<PasswordResetNotification[]> {
  const res = await authFetch("/api/notifications/pending");
  return res.json();
}

export async function fetchMyNotifications(): Promise<PasswordResetNotification[]> {
  const res = await authFetch("/api/notifications/me");
  return res.json();
}

export async function decideNotification(id: number, decision: "approve" | "decline"): Promise<PasswordResetNotification> {
  const res = await authMutation(`/api/notifications/${id}/${decision}`, "POST");
  return res.json();
}

export async function fetchMyHistory(): Promise<HistoryOut[]> {
  const res = await authFetch("/api/history/me?page_size=100");
  return res.json();
}

export async function fetchCaseHistory(caseId: number): Promise<HistoryOut[]> {
  const res = await authFetch(`/api/history/case/${caseId}`);
  return res.json();
}