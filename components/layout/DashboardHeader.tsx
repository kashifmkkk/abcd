"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, Sun, Moon, Menu, LogOut, ChevronRight } from "lucide-react";

interface DashboardHeaderProps {
  userEmail?: string | null;
  onMenuToggle?: () => void;
}

function getBreadcrumbs(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg) => {
    // Decode URL segments that look like IDs — shorten them
    if (seg.length > 20) return "Detail";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  });
}

export function DashboardHeader({ userEmail, onMenuToggle }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return saved === "dark" || (!saved && prefersDark);
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const crumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-6">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={onMenuToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          <span className="text-slate-400 dark:text-slate-500">Pages</span>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
              <span
                className={
                  i === crumbs.length - 1
                    ? "font-medium text-slate-800 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-400"
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          type="button"
          aria-label="Toggle dark mode"
          onClick={toggleDark}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-xs font-semibold uppercase text-white shadow-sm">
            {(userEmail ?? "U")[0]}
          </div>
          <span className="hidden max-w-30 truncate text-xs font-medium text-slate-700 dark:text-slate-300 sm:block">
            {userEmail ?? "User"}
          </span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          aria-label="Logout"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
