"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AISuggestions } from "@/components/dashboard/AISuggestions";
import { Moon, Sun } from "lucide-react";

interface NavbarProps {
  isAuthenticated: boolean;
  userEmail?: string | null;
  recentProjects?: { id: string; name: string }[];
}

export function Navbar({ isAuthenticated, userEmail, recentProjects = [] }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isLanding = pathname === "/";

  const dashboardProjectId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/([^/]+)$/);
    return match?.[1] ?? null;
  }, [pathname]);

  const linkCls = isLanding
    ? "text-sm text-gray-400 hover:text-white transition-colors"
    : "text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors";

  function toggleTheme() {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header
      className={
        isLanding
          ? "navbar-landing sticky top-0 z-40 w-full border-b border-white/10 backdrop-blur"
          : "sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#0b0f17]/95"
      }
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={
              isLanding
                ? "text-sm font-semibold text-white"
                : "text-sm font-semibold text-slate-900 dark:text-slate-100"
            }
          >
            {isLanding ? (
              <>AI Dashboard<span className="text-amber-400">.</span></>
            ) : (
              "AI Dashboard Platform"
            )}
          </Link>

          {isAuthenticated ? (
            <div className="hidden items-center gap-4 md:flex">
              <Link href="/dashboard" className={linkCls}>Dashboards</Link>
              {recentProjects.length > 0 ? (
                <div className="group relative">
                  <button type="button" className={linkCls}>My Dashboards</button>
                  <div className="invisible absolute left-0 top-8 z-50 w-64 rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900">
                    {recentProjects.slice(0, 6).map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/${project.id}`}
                        className="block truncate rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {project.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <Link href="/create" className={linkCls}>Create</Link>
              <Link href="/upload" className={linkCls}>Upload CSV</Link>
              {dashboardProjectId ? (
                <button
                  type="button"
                  className={linkCls}
                  onClick={() => setShowSuggestions((prev) => !prev)}
                >
                  AI Suggestions
                </button>
              ) : (
                <span className={isLanding ? "text-sm text-gray-600" : "text-sm text-slate-400"}>
                  AI Suggestions
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/settings" className={linkCls}>Settings</Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={linkCls}
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
              <span
                className={
                  isLanding
                    ? "hidden text-xs text-gray-600 sm:inline"
                    : "hidden text-xs text-slate-400 dark:text-slate-500 sm:inline"
                }
              >
                {userEmail ?? "Signed in"}
              </span>
            </>
          ) : (
            <>
              <Link href="/login" className={linkCls}>Login</Link>
              <Link
                href="/register"
                className={
                  isLanding
                    ? "rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
                    : "rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
                }
              >
                {isLanding ? "Get Started" : "Register"}
              </Link>
            </>
          )}

          {!isLanding ? (
            <button
              type="button"
              onClick={toggleTheme}
              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              <Sun size={15} className="hidden dark:block" />
              <Moon size={15} className="block dark:hidden" />
            </button>
          ) : null}
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
