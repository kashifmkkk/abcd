"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  Users2,
  FileText,
  Quote,
  ShoppingCart,
  Users,
  Bell,
  Settings,
  ChevronRight,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchPrefix?: string;
}

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} />, matchPrefix: "/dashboard" },
  { label: "Inventory", href: "/inventory", icon: <Package size={18} /> },
  { label: "Categories", href: "/categories", icon: <Tag size={18} /> },
  { label: "Vendors", href: "/vendors", icon: <Users2 size={18} /> },
  { label: "RFQs", href: "/rfqs", icon: <FileText size={18} /> },
  { label: "Quotes", href: "/quotes", icon: <Quote size={18} /> },
  { label: "Orders", href: "/orders", icon: <ShoppingCart size={18} /> },
  { label: "Users", href: "/users", icon: <Users size={18} /> },
  { label: "Notifications", href: "/notifications", icon: <Bell size={18} /> },
  { label: "Settings", href: "/settings", icon: <Settings size={18} /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  userEmail?: string | null;
}

export function DashboardLayout({ children, isAuthenticated, userEmail }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (!isAuthenticated || isAuthPage) {
    return <>{children}</>;
  }

  function isActive(item: SidebarItem) {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return pathname === item.href;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">AI Platform</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {sidebarItems.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    <span className={`${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight size={14} className="text-indigo-500 dark:text-indigo-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase">
              {(userEmail ?? "U")[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-900 dark:text-white">{userEmail ?? "User"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          userEmail={userEmail}
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
