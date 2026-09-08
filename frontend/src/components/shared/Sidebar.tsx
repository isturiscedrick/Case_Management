"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ClipboardList, LayoutDashboard, History, Archive, BarChart3, Scale, ChevronRight, ChevronsLeft, LogOut, User, UserPlus } from "lucide-react";
import { clearSessionToken, fetchCurrentUser, fetchMyNotifications, fetchPendingNotifications, UnauthorizedError, type CurrentUser, type PasswordResetNotification } from "@/lib/api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
const NAV_ITEMS = [
  { href: "/system/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/system/activity", label: "Activity", icon: ClipboardList },
  { href: "/system/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/system/history", label: "History", icon: History },
  { href: "/system/archive", label: "Archive", icon: Archive },
  { href: "/system/notifications", label: "Notifications", icon: Bell },
  { href: "/system/users", label: "Users", icon: UserPlus, adminOnly: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [notifications, setNotifications] = useState<PasswordResetNotification[]>([]);
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
        {NAV_ITEMS.filter((item) =>
          (!item.adminOnly || currentUser?.role === "admin")
        ).map((item) => {
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
                <span className="relative">
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label === "Notifications" && notifications.some((notification) => notification.status === "pending") && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#12331F]" />
                  )}
                </span>
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
        <button
          type="button"
          title={collapsed ? currentUser?.full_name : undefined}
          onClick={() => router.push("/system/profile")}
          aria-label="Open profile"
          className={`flex cursor-pointer items-center rounded-lg text-left transition hover:bg-white/5 focus-visible:bg-white/5 ${collapsed ? "" : "w-full gap-2.5 p-1"}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#B08D57]/70 bg-[#0d2919] text-white shadow-sm">
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
        </button>

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