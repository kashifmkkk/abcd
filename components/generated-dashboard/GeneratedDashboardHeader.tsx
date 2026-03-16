"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Moon, Sun, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface GeneratedDashboardHeaderProps {
  title: string;
  subtitle?: string;
  projectId: string;
  onRefresh?: () => void;
  onAiToggle?: () => void;
  showAi?: boolean;
}

export function GeneratedDashboardHeader({
  title,
  subtitle,
  projectId,
  onRefresh,
  onAiToggle,
  showAi = false,
}: GeneratedDashboardHeaderProps) {
  const [dark, setDark] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboard-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = saved === "dark" || (!saved && prefersDark);
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      // ignore
    }
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("dashboard-theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefresh?.();
    router.refresh();
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, [onRefresh, router]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          title="Back to dashboards"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400 leading-tight">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* AI Suggestions toggle */}
        <button
          type="button"
          onClick={onAiToggle}
          title="AI Suggestions"
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
            showAi
              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">AI Suggestions</span>
        </button>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          title="Refresh data"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleDark}
          title={dark ? "Light mode" : "Dark mode"}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
