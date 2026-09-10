"use client";

import { useEffect, useState } from "react";
import { Bell, User as UserIcon } from "lucide-react";
import { decideNotification, fetchCurrentUser, fetchMyNotifications, fetchPendingNotifications, UnauthorizedError, type PasswordResetNotification } from "@/lib/api";

export default function NotificationsPage() {
  const [items, setItems] = useState<PasswordResetNotification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await fetchCurrentUser();
        const admin = user.role === "admin";
        setIsAdmin(admin);
        setItems(admin ? await fetchPendingNotifications() : await fetchMyNotifications());
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

  return (
    <div className="min-h-full bg-[#F5F1E3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[#B08D57]">Account</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-[#12331F]">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">{isAdmin ? "Review requests from users." : "View notifications about your account."}</p>
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12331F] text-[#B08D57]"><Bell className="h-4 w-4" /></div><h2 className="text-sm font-semibold text-[#12331F]">Notifications</h2></div>
          {loading ? <p className="text-sm text-slate-400">Loading notifications...</p> : items.length === 0 ? <p className="text-sm text-slate-400">No notifications.</p> : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.notification_id} className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
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
                      <p className="mt-1 text-xs font-medium text-amber-600">{item.status === "pending" ? "Pending" : item.status}</p>
                    </div>
                  </div>
                  {isAdmin && item.status === "pending" && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(item.notification_id, "decline")} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50">Decline</button>
                      <button type="button" onClick={() => decide(item.notification_id, "approve")} className="rounded-lg bg-[#12331F] px-3 py-2 text-xs font-medium text-white hover:bg-[#1B4A2C]">Approve</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}