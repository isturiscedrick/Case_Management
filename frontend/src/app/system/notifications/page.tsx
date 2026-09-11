"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, User as UserIcon } from "lucide-react";
import { decideNotification, fetchCurrentUser, fetchMyNotifications, fetchPendingNotifications, markNotificationRead, UnauthorizedError, type PasswordResetNotification } from "@/lib/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function NotificationsPage() {
  const [items, setItems] = useState<PasswordResetNotification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Date range filter — mirrors the pattern used on Activity/History pages.
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // Notification pending a "mark as read" confirmation. Null = no dialog shown.
  const [confirmReadId, setConfirmReadId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const user = await fetchCurrentUser();
        const admin = user.role === "admin";
        setIsAdmin(admin);

        // Always fetch the user's own notifications (this is what surfaces
        // "X updated your case" alerts to the case creator, admin or not).
        // Admins additionally merge in the global pending password-reset
        // queue they're responsible for reviewing.
        const [mine, pending] = await Promise.all([
          fetchMyNotifications(),
          admin ? fetchPendingNotifications() : Promise.resolve([]),
        ]);

        const merged = [
          ...mine,
          ...pending.filter((p) => !mine.some((m) => m.notification_id === p.notification_id)),
        ];

        // Each source list is already ordered by the backend, but merging
        // two separately-fetched lists doesn't preserve a single combined
        // chronological order — sort explicitly, latest first.
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
      // Leave the item in place — user can retry from the list.
    }
  }

  // Matches an ISO timestamp string against the selected date range. Falls
  // back to "no date on record -> excluded once a bound is set" so partial
  // data can't silently bypass the filter, same as the Activity page.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, dateStart, dateEnd]
  );

  const hasDateFilter = !!(dateStart || dateEnd);
  const pendingReadItem =
    confirmReadId !== null ? items.find((item) => item.notification_id === confirmReadId) ?? null : null;

  return (
    <div className="min-h-full bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Account</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isAdmin ? "Review requests from users, and updates to cases you created." : "View notifications about your account."}
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
          <span className="ml-auto text-[11px] text-slate-400">
            Showing {filteredItems.length} of {items.length}
          </span>
        </div>

        <section className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
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
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.notification_id}
                  className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#B08D57]/40 bg-[#12331F] text-white">
                      {item.user_profile_picture ? (
                        <img src={item.user_profile_picture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon size={12} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{item.message}</p>
                      <p className="mt-1 text-xs font-medium text-amber-600">
                        {item.status === "pending" ? "Pending" : item.status === "unread" ? "Unread" : item.status}
                      </p>
                      {item.created_at && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.notification_type === "case_update" && item.status === "unread" ? (
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
              ))}
            </div>
          )}
        </section>
      </div>

      {confirmReadId !== null && (
        <ConfirmDialog
          title="Mark as read"
          message={
            pendingReadItem
              ? `Mark "${pendingReadItem.message}" as read? It will be removed from this list.`
              : "Mark this notification as read? It will be removed from this list."
          }
          confirmLabel="Mark as read"
          onConfirm={confirmMarkRead}
          onCancel={() => setConfirmReadId(null)}
        />
      )}
    </div>
  );
}