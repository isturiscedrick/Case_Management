"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Search, User as UserIcon } from "lucide-react";
import { fetchCurrentUser, fetchDecidedNotifications, fetchMyHistory, fetchMyNotifications, UnauthorizedError, type HistoryOut, type PasswordResetNotification } from "@/lib/api";

const PAGE_SIZE = 9;

type CaseActionItem =
  | { kind: "password"; sortKey: string; data: PasswordResetNotification }
  | { kind: "history"; sortKey: string; data: HistoryOut };

type UnifiedItem =
  | { kind: "password"; sortKey: string; data: PasswordResetNotification }
  | { kind: "history"; sortKey: string; data: HistoryOut }
  | { kind: "request"; sortKey: string; data: PasswordResetNotification };

type SectionFilter = "All" | "Case actions" | "Request decisions";
const SECTION_FILTERS: SectionFilter[] = ["All", "Case actions", "Request decisions"];

export default function ActivityPage() {
  const [items, setItems] = useState<PasswordResetNotification[]>([]);
  const [caseActions, setCaseActions] = useState<HistoryOut[]>([]);
  const [passwordChanges, setPasswordChanges] = useState<PasswordResetNotification[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("All");
  const [casePage, setCasePage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const user = await fetchCurrentUser();
        const admin = user.role === "admin";
        setIsAdmin(admin);
        const [notifications, history, mine] = await Promise.all([
          admin ? fetchDecidedNotifications() : fetchMyNotifications(),
          fetchMyHistory(),
          admin ? fetchMyNotifications() : Promise.resolve<PasswordResetNotification[]>([]),
        ]);
        setItems(notifications);
        setCaseActions(history);
        const ownNotifications = admin ? mine : notifications;
        setPasswordChanges(ownNotifications.filter((n) => n.notification_type === "password_changed"));
      } catch (error) {
        if (error instanceof UnauthorizedError) window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function matchesDateRange(iso: string | null | undefined) {
    if (!dateStart && !dateEnd) return true;
    if (!iso) return false;
    const day = iso.slice(0, 10);
    return (!dateStart || day >= dateStart) && (!dateEnd || day <= dateEnd);
  }

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

  const filteredPasswordChanges = passwordChanges
    .filter((notification) => {
      const matchesSearch = "changed password".includes(keyword) || keyword === "";
      const matchesAction = actionFilter === "All" || actionFilter === "changed_password";
      const matchesDate = matchesDateRange(notification.resolved_at ?? notification.created_at);
      return matchesSearch && matchesAction && matchesDate;
    })
    .sort((a, b) => byNewestFirst(a.resolved_at ?? a.created_at, b.resolved_at ?? b.created_at));

  // Merges case actions and password-change events into one newest-first
  // feed so pagination for the "Case actions" section covers it as a
  // whole rather than two separately-paginated lists stacked on top of
  // each other.
  const combinedCaseActions: CaseActionItem[] = useMemo(() => {
    const passwordItems: CaseActionItem[] = filteredPasswordChanges.map((notification) => ({
      kind: "password",
      sortKey: notification.resolved_at ?? notification.created_at ?? "",
      data: notification,
    }));
    const historyItems: CaseActionItem[] = filteredActions.map((action) => ({
      kind: "history",
      sortKey: action.created_at ?? "",
      data: action,
    }));
    return [...passwordItems, ...historyItems].sort((a, b) => byNewestFirst(a.sortKey, b.sortKey));
  }, [filteredPasswordChanges, filteredActions]);

  // + NEW — when "All Activities" is selected, every kind of event (case
  // actions, password changes, and request decisions) is merged into one
  // single newest-first feed, paginated together at PAGE_SIZE instead of
  // the two sections each carrying their own separate pagination.
  const unifiedAllItems: UnifiedItem[] = useMemo(() => {
    const requestItems: UnifiedItem[] = filteredNotifications.map((notification) => ({
      kind: "request",
      sortKey: notification.resolved_at ?? notification.created_at ?? "",
      data: notification,
    }));
    return [...combinedCaseActions, ...requestItems].sort((a, b) => byNewestFirst(a.sortKey, b.sortKey));
  }, [combinedCaseActions, filteredNotifications]);

  const hasDateFilter = !!(dateStart || dateEnd);

  const showCaseActions = sectionFilter === "Case actions";
  const showRequestDecisions = sectionFilter === "Request decisions";
  const showUnified = sectionFilter === "All";

  useEffect(() => {
    setCasePage(1);
    setRequestPage(1);
    setAllPage(1);
  }, [search, actionFilter, statusFilter, dateStart, dateEnd, sectionFilter]);

  const caseTotalPages = Math.max(1, Math.ceil(combinedCaseActions.length / PAGE_SIZE));
  const paginatedCaseActions = combinedCaseActions.slice((casePage - 1) * PAGE_SIZE, casePage * PAGE_SIZE);

  const requestTotalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const paginatedNotifications = filteredNotifications.slice((requestPage - 1) * PAGE_SIZE, requestPage * PAGE_SIZE);

  const allTotalPages = Math.max(1, Math.ceil(unifiedAllItems.length / PAGE_SIZE));
  const paginatedAllItems = unifiedAllItems.slice((allPage - 1) * PAGE_SIZE, allPage * PAGE_SIZE);

  useEffect(() => {
    setCasePage((page) => Math.min(page, caseTotalPages));
  }, [caseTotalPages]);

  useEffect(() => {
    setRequestPage((page) => Math.min(page, requestTotalPages));
  }, [requestTotalPages]);

  useEffect(() => {
    setAllPage((page) => Math.min(page, allTotalPages));
  }, [allTotalPages]);

  // Both search selects use the same option set regardless of which
  // filter panels are visible for "All Activities", since a case-action
  // kind and a request-decision status can both apply to the merged feed.
  const showActionSelect = showCaseActions || showUnified;
  const showStatusSelect = showRequestDecisions || showUnified;

  return (
    <div className="h-full overflow-y-auto bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Account</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">My Activity</h1>
        <p className="mt-1 text-sm text-slate-500">{isAdmin ? "Review decisions made on password reset requests." : "Only actions and account events performed by you are shown here."}</p>

        {/* SHOW pill filter, same pattern as My Cases' source filter */}
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <span className="ml-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Show</span>
          {SECTION_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSectionFilter(option)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                sectionFilter === option
                  ? "bg-[#12331F] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {option === "All" ? "All Activities" : option}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap">
          <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search activity" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity, case number, company, or user" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white focus:ring-2 focus:ring-[#12331F]/10" /></div>
          {showActionSelect && (
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} aria-label="Filter case actions" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white">
              <option value="All">All case actions</option><option value="created">Created</option><option value="updated">Updated</option><option value="archived">Archived</option><option value="restored">Restored</option><option value="changed_password">Changed password</option>
            </select>
          )}
          {showStatusSelect && (
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter notification status" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#12331F] focus:bg-white">
              <option value="All">All request statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="declined">Declined</option><option value="resolved">Resolved</option>
            </select>
          )}

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

        {/* ALL ACTIVITIES — unified, scrollable, single pagination */}
        {showUnified && (
          <section className="mt-5 flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex shrink-0 items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#12331F]">All Activities</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Case actions and request decisions together, newest first.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400">Loading activity...</p>
            ) : unifiedAllItems.length === 0 ? (
              <p className="text-sm text-slate-400">No activity matches your filters.</p>
            ) : (
              <>
                <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                  {paginatedAllItems.map((entry) => {
                    if (entry.kind === "password") {
                      return (
                        <div key={`pw-${entry.data.notification_id}`} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                              {entry.data.user_profile_picture ? (
                                <img src={entry.data.user_profile_picture} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <UserIcon size={12} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">Changed password</p>
                              <p className="text-xs text-slate-500">Your account</p>
                            </div>
                          </div>
                          <time className="shrink-0 text-xs text-slate-400">
                            {entry.data.resolved_at || entry.data.created_at
                              ? new Date(entry.data.resolved_at ?? entry.data.created_at!).toLocaleString()
                              : ""}
                          </time>
                        </div>
                      );
                    }

                    if (entry.kind === "history") {
                      return (
                        <div key={`hist-${entry.data.history_id}`} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                              {entry.data.performed_by_profile_picture ? (
                                <img src={entry.data.performed_by_profile_picture} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <UserIcon size={12} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium capitalize text-slate-700">{entry.data.action} case {entry.data.case_no}</p>
                              <p className="text-xs text-slate-500">{entry.data.company}{entry.data.detail ? ` - ${entry.data.detail}` : ""}</p>
                            </div>
                          </div>
                          <time className="shrink-0 text-xs text-slate-400">{entry.data.created_at ? new Date(entry.data.created_at).toLocaleString() : ""}</time>
                        </div>
                      );
                    }

                    // entry.kind === "request"
                    return (
                      <div key={`req-${entry.data.notification_id}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                            {entry.data.user_profile_picture ? (
                              <img src={entry.data.user_profile_picture} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UserIcon size={11} />
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{entry.data.message}</p>
                        </div>
                        <span className={`ml-3 shrink-0 text-xs font-medium ${entry.data.status === "pending" ? "text-amber-600" : entry.data.status === "approved" ? "text-emerald-600" : entry.data.status === "declined" ? "text-rose-600" : "text-slate-500"}`}>
                          {entry.data.status === "pending" ? "Pending" : entry.data.status === "approved" ? "Approved" : entry.data.status === "declined" ? "Declined" : "Resolved"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex shrink-0 items-center justify-between border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">
                    Showing {(allPage - 1) * PAGE_SIZE + 1}–{Math.min(allPage * PAGE_SIZE, unifiedAllItems.length)} of {unifiedAllItems.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllPage((page) => Math.max(1, page - 1))}
                      disabled={allPage === 1}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-medium text-slate-500">Page {allPage} of {allTotalPages}</span>
                    <button
                      type="button"
                      onClick={() => setAllPage((page) => Math.min(allTotalPages, page + 1))}
                      disabled={allPage === allTotalPages}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* CASE ACTIONS — shown only when explicitly filtered to this section */}
        {showCaseActions && (
          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]"><ClipboardList className="h-4 w-4" /></div>
              <div><h2 className="text-sm font-semibold text-[#12331F]">Case actions</h2><p className="mt-1 text-xs text-slate-500">Cases you created, updated, archived, or restored — plus your own password changes.</p></div>
            </div>
            {loading ? (
              <p className="text-sm text-slate-400">Loading actions...</p>
            ) : combinedCaseActions.length === 0 ? (
              <p className="text-sm text-slate-400">No case actions match your filters.</p>
            ) : (
              <>
                <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                  {paginatedCaseActions.map((entry) =>
                    entry.kind === "password" ? (
                      <div key={`pw-${entry.data.notification_id}`} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                            {entry.data.user_profile_picture ? (
                              <img src={entry.data.user_profile_picture} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UserIcon size={12} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">Changed password</p>
                            <p className="text-xs text-slate-500">Your account</p>
                          </div>
                        </div>
                        <time className="shrink-0 text-xs text-slate-400">
                          {entry.data.resolved_at || entry.data.created_at
                            ? new Date(entry.data.resolved_at ?? entry.data.created_at!).toLocaleString()
                            : ""}
                        </time>
                      </div>
                    ) : (
                      <div key={entry.data.history_id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                            {entry.data.performed_by_profile_picture ? (
                              <img src={entry.data.performed_by_profile_picture} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UserIcon size={12} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize text-slate-700">{entry.data.action} case {entry.data.case_no}</p>
                            <p className="text-xs text-slate-500">{entry.data.company}{entry.data.detail ? ` - ${entry.data.detail}` : ""}</p>
                          </div>
                        </div>
                        <time className="shrink-0 text-xs text-slate-400">{entry.data.created_at ? new Date(entry.data.created_at).toLocaleString() : ""}</time>
                      </div>
                    )
                  )}
                </div>

                {combinedCaseActions.length > PAGE_SIZE && (
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">
                      Showing {(casePage - 1) * PAGE_SIZE + 1}–{Math.min(casePage * PAGE_SIZE, combinedCaseActions.length)} of {combinedCaseActions.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCasePage((page) => Math.max(1, page - 1))}
                        disabled={casePage === 1}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-medium text-slate-500">Page {casePage} of {caseTotalPages}</span>
                      <button
                        type="button"
                        onClick={() => setCasePage((page) => Math.min(caseTotalPages, page + 1))}
                        disabled={casePage === caseTotalPages}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* REQUEST DECISIONS / PASSWORD RESET REQUESTS — shown only when explicitly filtered to this section */}
        {showRequestDecisions && (
          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]"><ClipboardList className="h-4 w-4" /></div>
              <div><h2 className="text-sm font-semibold text-[#12331F]">{isAdmin ? "Request decisions" : "Password reset requests"}</h2><p className="mt-1 text-xs text-slate-500">{isAdmin ? "Approved and declined requests appear here." : "Requests sent to an administrator appear here."}</p></div>
            </div>
            {loading ? <p className="text-sm text-slate-400">Loading activity...</p> : filteredNotifications.length === 0 ? <p className="text-sm text-slate-400">No password reset activity matches your filters.</p> : (
              <>
                <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                  {paginatedNotifications.map((item) => (
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

                {filteredNotifications.length > PAGE_SIZE && (
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">
                      Showing {(requestPage - 1) * PAGE_SIZE + 1}–{Math.min(requestPage * PAGE_SIZE, filteredNotifications.length)} of {filteredNotifications.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRequestPage((page) => Math.max(1, page - 1))}
                        disabled={requestPage === 1}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-medium text-slate-500">Page {requestPage} of {requestTotalPages}</span>
                      <button
                        type="button"
                        onClick={() => setRequestPage((page) => Math.min(requestTotalPages, page + 1))}
                        disabled={requestPage === requestTotalPages}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}