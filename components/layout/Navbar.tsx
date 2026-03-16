"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AISuggestions } from "@/components/dashboard/AISuggestions";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  isAuthenticated: boolean;
  userEmail?: string | null;
}

export function Navbar({ isAuthenticated, userEmail }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const dashboardProjectId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/([^/]+)$/);
    return match?.[1] ?? null;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="text-sm font-semibold text-slate-900">
            AI Dashboard Platform
          </Link>

          {isAuthenticated ? (
            <div className="hidden items-center gap-4 md:flex">
              <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                Dashboards
              </Link>
              <Link href="/create" className="text-sm text-slate-600 hover:text-slate-900">
                Create
              </Link>
              <Link href="/upload" className="text-sm text-slate-600 hover:text-slate-900">
                Upload CSV
              </Link>
              {dashboardProjectId ? (
                <button
                  type="button"
                  className="text-sm text-slate-600 hover:text-slate-900"
                  onClick={() => setShowSuggestions((prev) => !prev)}
                >
                  AI Suggestions
                </button>
              ) : (
                <span className="text-sm text-slate-400">AI Suggestions</span>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/account" className="text-sm text-slate-600 hover:text-slate-900">
                Account
              </Link>
              <Link href="/profile" className="text-sm text-slate-600 hover:text-slate-900">
                Profile
              </Link>
              <span className="hidden text-xs text-slate-400 sm:inline">{userEmail ?? "Signed in"}</span>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
                Login
              </Link>
              <Link href="/register" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {isAuthenticated && dashboardProjectId && showSuggestions ? (
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
          <div className="ml-auto w-full max-w-md">
            <AISuggestions
              projectId={dashboardProjectId}
              onApplied={() => {
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
