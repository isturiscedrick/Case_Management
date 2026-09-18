"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, User as UserIcon } from "lucide-react";
import { decideNotification, disregardLockout, fetchCurrentUser, fetchMyNotifications, fetchPendingNotifications, markNotificationRead, UnauthorizedError, type PasswordResetNotification } from "@/lib/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const PAGE_SIZE = 9;

export default function NotificationsPage() {
  const [items, setItems] = useState<PasswordResetNotification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [confirmReadId, setConfirmReadId] = useState<number | null>(null);
  const [confirmDisregardId, setConfirmDisregardId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const user = await fetchCurrentUser();
        const admin = user.role === "admin";
        setIsAdmin(admin);

        const [mine, pending] = await Promise.all([
          fetchMyNotifications(),
          admin ? fetchPendingNotifications() : Promise.resolve([]),
        ]);

        const merged = [
          ...mine,
          ...pending.filter((p) => !mine.some((m) => m.notification_id === p.notification_id)),
        ];

        merged.sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });

        setItems(merged);
      } catch (error) {
        if (error instanceof UnauthorizedError) window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function decide(id: number, action: "approve" | "decline") {
    await decideNotification(id, action);
    setItems((current) => current.filter((item) => item.notification_id !== id));
  }

  function requestMarkRead(id: number) {
    setConfirmReadId(id);
  }

  async function confirmMarkRead() {
    if (confirmReadId === null) return;
    const id = confirmReadId;
    setConfirmReadId(null);
    try {
      await markNotificationRead(id);
      setItems((current) => current.filter((item) => item.notification_id !== id));
    } catch {
    }
  }

  // + NEW — same eligibility rule as the per-item "Mark as read" button:
  // unread case updates, plus already-decided password reset requests.
  const readableItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (item.notification_type === "case_update" && item.status === "unread") ||
          (item.notification_type === "password_reset" &&
            (item.status === "approved" || item.status === "declined"))
      ),
    [items]
  );

  async function markAllAsRead() {
    const ids = readableItems.map((item) => item.notification_id);
    try {
      await Promise.all(ids.map((id) => markNotificationRead(id)));
      setItems((current) => current.filter((item) => !ids.includes(item.notification_id)));
    } catch {
    }
  }

  function requestDisregard(id: number) {
    setConfirmDisregardId(id);
  }

  async function confirmDisregard() {
    if (confirmDisregardId === null) return;
    const id = confirmDisregardId;
    setConfirmDisregardId(null);
    try {
      await disregardLockout(id);
      setItems((current) => current.filter((item) => item.notification_id !== id));
    } catch {
    }
  }

  function matchesDateRange(iso: string | null | undefined) {
    if (!dateStart && !dateEnd) return true;
    if (!iso) return false;
    const day = iso.slice(0, 10);
    return (!dateStart || day >= dateStart) && (!dateEnd || day <= dateEnd);
  }

  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => matchesDateRange(item.created_at))
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        }),
    [items, dateStart, dateEnd]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateStart, dateEnd]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const hasDateFilter = !!(dateStart || dateEnd);
  const pendingReadItem =
    confirmReadId !== null ? items.find((item) => item.notification_id === confirmReadId) ?? null : null;
  const pendingDisregardItem =
    confirmDisregardId !== null ? items.find((item) => item.notification_id === confirmDisregardId) ?? null : null;

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto flex h-full w-full max-w-3xl min-h-0 flex-col">
        <div className="shrink-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Account</p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? "Review requests from users, updates to cases you created, and account lockout alerts." : "View notifications about your account."}
          </p>

          {/* DATE RANGE FILTER */}
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="text-xs font-medium text-slate-500">Date</label>
            <input
              type="date"
              value={dateStart}
              onChange={(event) => setDateStart(event.target.value)}
              max={dateEnd || undefined}
              aria-label="Notifications start date"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#12331F] focus:bg-white"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(event) => setDateEnd(event.target.value)}
              min={dateStart || undefined}
              aria-label="Notifications end date"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#12331F] focus:bg-white"
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
            <div className="ml-auto flex items-center gap-3">
              {readableItems.length > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-[#12331F] underline-offset-2 hover:text-[#B08D57] hover:underline"
                >
                  Mark all as read ({readableItems.length})
                </button>
              )}
              <span className="text-[11px] text-slate-400">
                Showing {filteredItems.length} of {items.length}
              </span>
            </div>
          </div>
        </div>

        <section className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex shrink-0 items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]">
              <Bell className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#12331F]">Notifications</h2>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading notifications...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-slate-400">
              {items.length === 0 ? "No notifications." : "No notifications match the selected date range."}
            </p>
          ) : (
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {paginatedItems.map((item) => {
                const isLockoutAlert = item.notification_type === "account_lockout";

                return (
                  <div
                    key={item.notification_id}
                    className={`flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between ${
                      isLockoutAlert && item.status === "pending" ? "bg-rose-50" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                        {item.notification_type === "case_update" && item.actor_profile_picture ? (
                          <img src={item.actor_profile_picture} alt="" className="h-full w-full object-cover" />
                        ) : item.notification_type !== "case_update" && item.user_profile_picture ? (
                          <img src={item.user_profile_picture} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon size={12} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">{item.message}</p>
                        <p
                          className={`mt-1 text-xs font-medium ${
                            item.status === "approved"
                              ? "text-emerald-600"
                              : item.status === "declined"
                              ? "text-rose-600"
                              : isLockoutAlert && item.status === "pending"
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        >
                          {item.status === "pending"
                            ? isLockoutAlert
                              ? "Account locked"
                              : "Pending"
                            : item.status === "unread"
                            ? "Unread"
                            : item.status === "approved"
                            ? "Approved"
                            : item.status === "declined"
                            ? "Declined"
                            : item.status}
                        </p>
                        {item.created_at && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {isLockoutAlert && item.status === "pending" ? (
                      isAdmin && (
                        <button
                          type="button"
                          onClick={() => requestDisregard(item.notification_id)}
                          className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Disregard offense
                        </button>
                      )
                    ) : (item.notification_type === "case_update" && item.status === "unread") ||
                      (item.notification_type === "password_reset" &&
                        (item.status === "approved" || item.status === "declined")) ? (
                      <button
                        type="button"
                        onClick={() => requestMarkRead(item.notification_id)}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Mark as read
                      </button>
                    ) : (
                      isAdmin &&
                      item.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => decide(item.notification_id, "decline")}
                            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(item.notification_id, "approve")}
                            className="rounded-lg bg-[#12331F] px-3 py-2 text-xs font-medium text-white hover:bg-[#1B4A2C]"
                          >
                            Approve
                          </button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {filteredItems.length > 0 && (
            <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}
                –{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-xs font-medium text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}