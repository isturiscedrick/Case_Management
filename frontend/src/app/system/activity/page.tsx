"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, User as UserIcon } from "lucide-react";
import { fetchCurrentUser, fetchDecidedNotifications, fetchMyHistory, fetchMyNotifications, UnauthorizedError, type HistoryOut, type PasswordResetNotification } from "@/lib/api";

export default function ActivityPage() {
  const [items, setItems] = useState<PasswordResetNotification[]>([]);
  const [caseActions, setCaseActions] = useState<HistoryOut[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const user = await fetchCurrentUser();
        const admin = user.role === "admin";
        setIsAdmin(admin);
        const [notifications, history] = await Promise.all([admin ? fetchDecidedNotifications() : fetchMyNotifications(), fetchMyHistory()]);
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

  // Matches an ISO timestamp string against the selected date range. Falls
  // back to "no date on record -> excluded once a bound is set" so partial
  // data can't silently bypass the filter, mirroring the dashboard's
  // Closed Date range behavior.
  function matchesDateRange(iso: string | null | undefined) {
    if (!dateStart && !dateEnd) return true;
    if (!iso) return false;
    const day = iso.slice(0, 10);
    return (!dateStart || day >= dateStart) && (!dateEnd || day <= dateEnd);
  }

  // Descending timestamp comparator — used to guarantee latest-to-oldest
  // ordering on the client, since each list is fetched independently and
  // filtering doesn't reorder, but it's worth not relying solely on the
  // backend's ORDER BY holding across every call path.
  function byNewestFirst(aIso: string | null | undefined, bIso: string | null | undefined) {
    const aTime = aIso ? new Date(aIso).getTime() : 0;
    const bTime = bIso ? new Date(bIso).getTime() : 0;
    return bTime - aTime;
  }

  const keyword = search.toLowerCase();
  const filteredNotifications = items
    .filter((item) => {
      const matchesSearch = item.message.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      // Decided requests are dated by resolved_at; a still-pending request
      // (no resolved_at yet) falls back to when it was created.
      const matchesDate = matchesDateRange(item.resolved_at ?? item.created_at);
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => byNewestFirst(a.resolved_at ?? a.created_at, b.resolved_at ?? b.created_at));

  const filteredActions = caseActions
    .filter((action) => {
      const matchesSearch = `${action.action} ${action.case_no} ${action.company} ${action.performed_by_username ?? ""}`.toLowerCase().includes(keyword);
      const matchesAction = actionFilter === "All" || action.action === actionFilter;
      const matchesDate = matchesDateRange(action.created_at);
      return matchesSearch && matchesAction && matchesDate;
    })
    .sort((a, b) => byNewestFirst(a.created_at, b.created_at));

  const hasDateFilter = !!(dateStart || dateEnd);

  return (
    <div className="min-h-full bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Account</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">My Activity</h1>
        <p className="mt-1 text-sm text-slate-500">{isAdmin ? "Review decisions made on password reset requests." : "Only actions and account events performed by you are shown here."}</p>

        <div className="mt-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap">
          <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search activity" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity, case number, company, or user" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" /></div>
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} aria-label="Filter case actions" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white">
            <option value="All">All case actions</option><option value="created">Created</option><option value="updated">Updated</option><option value="archived">Archived</option><option value="restored">Restored</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter notification status" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white">
            <option value="All">All request statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="declined">Declined</option><option value="resolved">Resolved</option>
          </select>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500">Date</label>
            <input
              type="date"
              value={dateStart}
              onChange={(event) => setDateStart(event.target.value)}
              max={dateEnd || undefined}
              aria-label="Activity date range start"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(event) => setDateEnd(event.target.value)}
              min={dateStart || undefined}
              aria-label="Activity date range end"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white"
            />
            {hasDateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateStart("");
                  setDateEnd("");
                }}
                className="text-xs text-slate-400 underline hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]"><ClipboardList className="h-4 w-4" /></div>
            <div><h2 className="text-sm font-semibold text-[#12331F]">{isAdmin ? "Request decisions" : "Password reset requests"}</h2><p className="mt-1 text-xs text-slate-500">{isAdmin ? "Approved and declined requests appear here." : "Requests sent to an administrator appear here."}</p></div>
          </div>
          {loading ? <p className="text-sm text-slate-400">Loading activity...</p> : filteredNotifications.length === 0 ? <p className="text-sm text-slate-400">No password reset activity matches your filters.</p> : (
            <div className="space-y-2">
              {filteredNotifications.map((item) => (
                <div key={item.notification_id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                      {item.user_profile_picture ? (
                        <img src={item.user_profile_picture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon size={11} />
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{item.message}</p>
                  </div>
                  <span className={`ml-3 shrink-0 text-xs font-medium ${item.status === "pending" ? "text-amber-600" : item.status === "approved" ? "text-emerald-600" : item.status === "declined" ? "text-rose-600" : "text-slate-500"}`}>
                    {item.status === "pending" ? "Pending" : item.status === "approved" ? "Approved" : item.status === "declined" ? "Declined" : "Resolved"}
                  </span>
                </div>
              ))}
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
              {filteredActions.map((action) => (
                <div key={action.history_id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                      {action.performed_by_profile_picture ? (
                        <img src={action.performed_by_profile_picture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon size={12} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize text-slate-700">{action.action} case {action.case_no}</p>
                      <p className="text-xs text-slate-500">{action.company}{action.detail ? ` - ${action.detail}` : ""}</p>
                    </div>
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">{action.created_at ? new Date(action.created_at).toLocaleString() : ""}</time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}