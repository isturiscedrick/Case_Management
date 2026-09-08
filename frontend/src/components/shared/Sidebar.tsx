"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ClipboardList, LayoutDashboard, History, Archive, BarChart3, Scale, ChevronRight, ChevronsLeft, LogOut, User, UserPlus } from "lucide-react";
import { clearSessionToken, decideNotification, fetchCurrentUser, fetchMyNotifications, fetchPendingNotifications, UnauthorizedError, type CurrentUser, type PasswordResetNotification } from "@/lib/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
const NAV_ITEMS = [
  { href: "/system/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/system/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/system/archive", label: "Archive", icon: Archive },
  { href: "/system/history", label: "History", icon: History },
  { href: "/system/notifications", label: "Notifications", icon: Bell },
  { href: "/system/users", label: "Users", icon: UserPlus, adminOnly: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [notifications, setNotifications] = useState<PasswordResetNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationAction, setNotificationAction] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = () => {
      fetchCurrentUser()
        .then((user) => {
          if (!cancelled) setCurrentUser(user);
        })
        .catch((error) => {
          if (!cancelled && error instanceof UnauthorizedError) router.push("/login");
        });
    };

    loadCurrentUser();
    window.addEventListener("profile-updated", loadCurrentUser);

    const loadNotifications = () => {
      const notificationRequest = currentUser?.role === "admin" ? fetchPendingNotifications() : fetchMyNotifications();
      notificationRequest.then((items) => {
        if (!cancelled) setNotifications(items);
      }).catch(() => undefined);
    };
    loadNotifications();
    const notificationTimer = window.setInterval(loadNotifications, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("profile-updated", loadCurrentUser);
      window.clearInterval(notificationTimer);
    };
  }, [router, currentUser?.role]);

  function handleLogout() {
    clearSessionToken();
    router.push("/login");
  }

  async function handleNotificationDecision(id: number, decision: "approve" | "decline") {
    setNotificationAction(id);
    try {
      await decideNotification(id, decision);
      setNotifications((items) => items.filter((item) => item.notification_id !== id));
    } finally {
      setNotificationAction(null);
    }
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-white/10 bg-[#12331F] shadow-sm transition-all duration-200 ${
        collapsed ? "w-20" : "w-60"
      }`}
    >
      {/* Logo / Header */}
      <div
        className={`flex items-center border-b border-white/10 py-6 ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-4"
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B08D57] shadow-sm">
          <Scale className="h-5 w-5 text-[#12331F]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="whitespace-nowrap font-serif text-sm font-semibold tracking-tight text-white">
              CMI Case Management
            </h1>
            <p className="whitespace-nowrap text-xs text-white/50">
              Labor Case Monitoring
            </p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-[#B08D57] hover:text-[#B08D57]"
      >
        <ChevronsLeft
          className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
        />
      </button>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1.5 py-6 ${collapsed ? "px-3" : "px-4"}`}>
        {!collapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/30">
            Main Menu
          </p>
        )}
        {currentUser?.role !== "admin" && (
          <Link
            href="/system/activity"
            title={collapsed ? "Activity" : undefined}
            className={`mb-1.5 flex items-center rounded-lg border border-transparent text-sm font-medium text-white/60 transition hover:border-white/10 hover:bg-white/5 hover:text-white ${collapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-4 py-2.5"}`}
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Activity</span>}
          </Link>
        )}
        {currentUser?.role === "admin" && <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((current) => !current)}
            title={collapsed ? "Notifications" : undefined}
            aria-label="Notifications"
            className={`group flex w-full items-center rounded-lg border border-transparent text-sm font-medium text-white/60 transition hover:border-white/10 hover:bg-white/5 hover:text-white ${
              collapsed ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-4 py-2.5"
            }`}
          >
            <span className="relative">
              <Bell className="h-4 w-4 shrink-0" />
              {notifications.some((notification) => notification.status === "pending") && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#12331F]" />
              )}
            </span>
            {!collapsed && <span>Notifications</span>}
          </button>
          {showNotifications && (
            <div className={`absolute top-12 z-20 w-72 rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-xl ${collapsed ? "left-14" : "left-0"}`}>
              <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-xs font-semibold text-[#12331F]">Notifications</p>
                <span className="text-[10px] text-slate-400">{notifications.length}</span>
              </div>
              {notifications.length === 0 ? (
                <p className="py-3 text-xs text-slate-400">No notifications.</p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.notification_id} className="rounded-lg bg-slate-50 p-2.5">
                      <p className="text-xs leading-4 text-slate-600">{notification.message}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-amber-600">Pending</span>
                        <div className="flex gap-1.5">
                          <button type="button" disabled={notificationAction === notification.notification_id} onClick={() => handleNotificationDecision(notification.notification_id, "decline")} className="rounded-md border border-rose-200 px-2 py-1 text-[10px] font-medium text-rose-600 hover:bg-rose-50">Decline</button>
                          <button type="button" disabled={notificationAction === notification.notification_id} onClick={() => handleNotificationDecision(notification.notification_id, "approve")} className="rounded-md bg-[#12331F] px-2 py-1 text-[10px] font-medium text-white hover:bg-[#1B4A2C]">Approve</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>}
        {NAV_ITEMS.filter((item) => !item.adminOnly || currentUser?.role === "admin").map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                group
                flex
                items-center
                rounded-lg
                border
                text-sm
                font-medium
                transition
                ${
                  active
                    ? "border-[#B08D57]/30 bg-[#B08D57]/15 text-[#B08D57]"
                    : "border-transparent text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }
                ${collapsed ? "mx-auto h-10 w-10 justify-center" : "justify-between px-4 py-2.5"}
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && (
                <ChevronRight
                  className={`h-3.5 w-3.5 transition group-hover:translate-x-0.5 ${
                    active ? "opacity-70" : "opacity-0 group-hover:opacity-40"
                  }`}
                />
              )}
            </Link>
          );
})}
      </nav>

      {/* Logged-in user */}
      <div
        className={`border-t border-white/10 py-4 ${
          collapsed ? "flex justify-center px-0" : "px-4"
        }`}
      >
        <div
          title={collapsed ? currentUser?.full_name : undefined}
          onClick={() => router.push("/system/profile")}
          role="link"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") router.push("/system/profile");
          }}
          className={`flex cursor-pointer items-center ${collapsed ? "" : "gap-2.5"}`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white">
            {currentUser?.profile_picture ? (
              <img src={currentUser.profile_picture} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {currentUser?.full_name ?? "Loading user..."}
              </p>
              <p className="text-xs text-white/40">
                {currentUser?.role === "handling_personnel" ? "Handling Personnel" : currentUser?.role ?? ""}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutDialog(true)}
          title={collapsed ? "Log out" : undefined}
          aria-label="Log out"
          className={`mt-3 flex items-center rounded-lg border border-transparent text-sm font-medium text-white/60 transition hover:border-white/10 hover:bg-white/5 hover:text-white ${
            collapsed ? "mx-auto h-10 w-10 justify-center" : "w-full gap-3 px-4 py-2.5"
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>

      {showLogoutDialog && (
        <ConfirmDialog
          title="Log out"
          message="Are you sure you want to log out of CMI Case Management?"
          confirmLabel="Log out"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutDialog(false)}
        />
      )}
    </aside>
  );
}