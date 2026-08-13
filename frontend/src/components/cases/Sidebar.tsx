"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Archive, BarChart3, Scale, ChevronRight, ChevronsLeft, User } from "lucide-react";
import { CURRENT_USER } from "@/constants/caseOptions";
const NAV_ITEMS = [
  { href: "/system/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/system/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/system/archive", label: "Archive", icon: Archive },
  { href: "/system/history", label: "History", icon: History },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-white/10 bg-[#12331F] shadow-sm transition-all duration-200 ${
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
        {NAV_ITEMS.map((item) => {
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
          className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}
          title={collapsed ? CURRENT_USER : undefined}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
            <User className="h-4 w-4" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{CURRENT_USER}</p>
              <p className="text-xs text-white/40">Logged in</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}