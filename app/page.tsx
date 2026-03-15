import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900">AI Dashboard Platform</h1>
      <p className="text-slate-600">Create data dashboards from natural language prompts.</p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-md bg-slate-900 px-4 py-2 text-white">Sign in</Link>
        <Link href="/register" className="rounded-md border border-slate-300 px-4 py-2 text-slate-900">Register</Link>
      </div>
    </main>
  );
}
