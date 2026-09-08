"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { fetchCurrentUser, fetchMyHistory, fetchMyNotifications, UnauthorizedError, type HistoryOut, type PasswordResetNotification } from "@/lib/api";

export default function ActivityPage() {
  const [items, setItems] = useState<PasswordResetNotification[]>([]);
  const [caseActions, setCaseActions] = useState<HistoryOut[]>([]);
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

  return (
    <div className="min-h-full bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Account</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">Activity</h1>
        <p className="mt-1 text-sm text-slate-500">Track your password reset requests and account activity.</p>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]"><ClipboardList className="h-4 w-4" /></div>
            <div><h2 className="text-sm font-semibold text-[#12331F]">Password reset requests</h2><p className="mt-1 text-xs text-slate-500">Requests sent to an administrator appear here.</p></div>
          </div>
          {loading ? <p className="text-sm text-slate-400">Loading activity...</p> : items.length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : (
            <div className="space-y-2">
              {items.map((item) => <div key={item.notification_id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><p className="text-sm text-slate-600">{item.message}</p><span className={`ml-3 shrink-0 text-xs font-medium ${item.status === "pending" ? "text-amber-600" : item.status === "approved" ? "text-emerald-600" : item.status === "declined" ? "text-rose-600" : "text-slate-500"}`}>{item.status === "pending" ? "Pending" : item.status === "approved" ? "Approved" : item.status === "declined" ? "Declined" : "Resolved"}</span></div>)}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-sm font-semibold text-[#12331F]">Case actions</h2>
            <p className="mt-1 text-xs text-slate-500">Cases you created, updated, archived, or restored.</p>
          </div>
          {loading ? <p className="text-sm text-slate-400">Loading actions...</p> : caseActions.length === 0 ? <p className="text-sm text-slate-400">No case actions yet.</p> : (
            <div className="space-y-2">
              {caseActions.map((action) => <div key={action.history_id} className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium capitalize text-slate-700">{action.action} case {action.case_no}</p><p className="text-xs text-slate-500">{action.company}{action.detail ? ` - ${action.detail}` : ""}</p></div><time className="text-xs text-slate-400">{action.created_at ? new Date(action.created_at).toLocaleString() : ""}</time></div>)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}