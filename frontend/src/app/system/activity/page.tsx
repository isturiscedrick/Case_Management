"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { fetchCurrentUser, fetchMyHistory, fetchMyNotifications, UnauthorizedError, type HistoryOut, type PasswordResetNotification } from "@/lib/api";

export default function ActivityPage() {
  const [items, setItems] = useState<PasswordResetNotification[]>([]);
  const [caseActions, setCaseActions] = useState<HistoryOut[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await fetchCurrentUser();
        const [notifications, history] = await Promise.all([fetchMyNotifications(), fetchMyHistory()]);
        setItems(notifications);
        setCaseActions(history);
      } catch (error) {
        if (error instanceof UnauthorizedError) window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const keyword = search.toLowerCase();
  const filteredNotifications = items.filter((item) => {
    const matchesSearch = item.message.toLowerCase().includes(keyword);
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const filteredActions = caseActions.filter((action) => {
    const matchesSearch = `${action.action} ${action.case_no} ${action.company} ${action.performed_by_username ?? ""}`.toLowerCase().includes(keyword);
    const matchesAction = actionFilter === "All" || action.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="min-h-full bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Account</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">Activity</h1>
        <p className="mt-1 text-sm text-slate-500">Track your password reset requests and account activity.</p>

        <div className="mt-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search activity" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity, case number, company, or user" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" /></div>
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} aria-label="Filter case actions" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white">
            <option value="All">All case actions</option><option value="created">Created</option><option value="updated">Updated</option><option value="archived">Archived</option><option value="restored">Restored</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter notification status" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white">
            <option value="All">All request statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="declined">Declined</option><option value="resolved">Resolved</option>
          </select>
        </div>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]"><ClipboardList className="h-4 w-4" /></div>
            <div><h2 className="text-sm font-semibold text-[#12331F]">Password reset requests</h2><p className="mt-1 text-xs text-slate-500">Requests sent to an administrator appear here.</p></div>
          </div>
          {loading ? <p className="text-sm text-slate-400">Loading activity...</p> : filteredNotifications.length === 0 ? <p className="text-sm text-slate-400">No password reset activity matches your filters.</p> : (
            <div className="space-y-2">
              {filteredNotifications.map((item) => <div key={item.notification_id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><p className="text-sm text-slate-600">{item.message}</p><span className={`ml-3 shrink-0 text-xs font-medium ${item.status === "pending" ? "text-amber-600" : item.status === "approved" ? "text-emerald-600" : item.status === "declined" ? "text-rose-600" : "text-slate-500"}`}>{item.status === "pending" ? "Pending" : item.status === "approved" ? "Approved" : item.status === "declined" ? "Declined" : "Resolved"}</span></div>)}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-sm font-semibold text-[#12331F]">Case actions</h2>
            <p className="mt-1 text-xs text-slate-500">Cases you created, updated, archived, or restored.</p>
          </div>
          {loading ? <p className="text-sm text-slate-400">Loading actions...</p> : filteredActions.length === 0 ? <p className="text-sm text-slate-400">No case actions match your filters.</p> : (
            <div className="space-y-2">
              {filteredActions.map((action) => <div key={action.history_id} className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium capitalize text-slate-700">{action.action} case {action.case_no}</p><p className="text-xs text-slate-500">{action.company}{action.detail ? ` - ${action.detail}` : ""}</p></div><time className="text-xs text-slate-400">{action.created_at ? new Date(action.created_at).toLocaleString() : ""}</time></div>)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}