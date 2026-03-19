"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to register");
        return;
      }

      router.push("/login");
    } catch {
      setError("Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing-bg-a relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 landing-grid-bg" />
      <div className="landing-hero-glow pointer-events-none absolute inset-0" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-12">
        <div className="grid w-full gap-8 md:grid-cols-2">
          <aside className="hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-10 md:flex md:flex-col md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">Start Building</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-white">
                AI Dashboard
                <span className="text-amber-400">.</span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
                Create your account and launch production-ready analytics dashboards powered by AI.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-500">✓</span><span>Turn raw CSV files into structured dashboard specs</span></li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-500">✓</span><span>Deploy KPI, chart, and table widgets instantly</span></li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-500">✓</span><span>Get AI insights and recommendations out of the box</span></li>
            </ul>
          </aside>

          <div className="mx-auto flex w-full max-w-md items-center justify-center md:mx-0 md:ml-auto">
            <form
              onSubmit={onSubmit}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 backdrop-blur-sm sm:p-10"
            >
              <p className="text-sm font-bold text-white">
                AI Dashboard<span className="text-amber-400">.</span>
              </p>
              <h1 className="mt-3 text-3xl font-bold text-white">Create account</h1>
              <p className="mt-2 text-sm text-zinc-400">Start with a secure account and build your first dashboard in minutes.</p>

              <div className="mt-7 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-zinc-400">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm text-zinc-400">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="Create a strong password"
                  />
                </div>
              </div>

              {error ? (
                <p className="mt-5 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Registering..." : "Create account"}
              </button>

              <p className="mt-5 text-sm text-zinc-400">
                Already have an account? {" "}
                <Link href="/login" className="text-amber-500 underline transition hover:text-amber-400">Login</Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
