"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const callbackUrl = "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <main className="landing-bg-a relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 landing-grid-bg" />
      <div className="landing-hero-glow pointer-events-none absolute inset-0" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-12">
        <div className="grid w-full gap-8 md:grid-cols-2">
          <aside className="hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-10 md:flex md:flex-col md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">Welcome Back</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-white">
                AI Dashboard
                <span className="text-amber-400">.</span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
                Sign in to continue building AI-powered dashboards with real-time metrics and instant insights.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-500">✓</span><span>Generate dashboards from CSV uploads in seconds</span></li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-500">✓</span><span>Customize widgets, charts, and layouts without code</span></li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-500">✓</span><span>Collaborate with built-in AI recommendations</span></li>
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
              <h1 className="mt-3 text-3xl font-bold text-white">Sign in</h1>
              <p className="mt-2 text-sm text-zinc-400">Access your dashboards and continue where you left off.</p>

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
                    placeholder="Enter your password"
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
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <p className="mt-5 text-sm text-zinc-400">
                No account? {" "}
                <Link href="/register" className="text-amber-500 underline transition hover:text-amber-400">Register</Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
