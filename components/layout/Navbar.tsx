import Link from "next/link";

interface NavbarProps {
  isAuthenticated: boolean;
  userEmail?: string | null;
}

export function Navbar({ isAuthenticated, userEmail }: NavbarProps) {
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
              <Link href="#ai-suggestions" className="text-sm text-slate-600 hover:text-slate-900">
                AI Suggestions
              </Link>
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
    </header>
  );
}
