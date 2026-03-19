"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SettingsProject {
  id: string;
  name: string;
  updatedAt: string;
}

interface SettingsWorkspaceProps {
  email: string;
  defaultDisplayName: string;
  projects: SettingsProject[];
}

interface ProfileForm {
  displayName: string;
  organization: string;
  role: string;
  plan: string;
}

interface PreferencesForm {
  theme: "light" | "dark";
  notifications: boolean;
  aiSmartGeneration: boolean;
}

const PROFILE_STORAGE_KEY = "settings.profile";
const PREFS_STORAGE_KEY = "settings.preferences";
const AVATAR_STORAGE_KEY = "settings.avatar";

export function SettingsWorkspace({ email, defaultDisplayName, projects }: SettingsWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<ProfileForm>({
    displayName: defaultDisplayName,
    organization: "",
    role: "Owner",
    plan: "Free",
  });

  const [preferences, setPreferences] = useState<PreferencesForm>({
    theme: "light",
    notifications: true,
    aiSmartGeneration: true,
  });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      const storedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
      const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);

      if (storedProfile) {
        setProfile((prev) => ({ ...prev, ...(JSON.parse(storedProfile) as Partial<ProfileForm>) }));
      }
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs) as Partial<PreferencesForm>;
        setPreferences((prev) => ({ ...prev, ...parsed }));
      }
      if (storedAvatar) {
        setAvatar(storedAvatar);
      }

      const rootDark = document.documentElement.classList.contains("dark");
      setPreferences((prev) => ({ ...prev, theme: rootDark ? "dark" : "light" }));
    } catch {
      // ignore malformed local settings
    }
  }, []);

  const initials = useMemo(() => {
    const source = profile.displayName.trim() || defaultDisplayName;
    return source
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile.displayName, defaultDisplayName]);

  function onAvatarPick(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setAvatar(result);
      try {
        localStorage.setItem(AVATAR_STORAGE_KEY, result);
      } catch {
        // ignore storage errors
      }
    };
    reader.readAsDataURL(file);
  }

  function applyTheme(theme: "light" | "dark") {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
    setPreferences((prev) => ({ ...prev, theme }));
  }

  function saveAll() {
    setSaving(true);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
      if (avatar) localStorage.setItem(AVATAR_STORAGE_KEY, avatar);
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setTimeout(() => setSaving(false), 350);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Manage your profile, account settings, activity, and preferences.</p>
      </div>

      {/* Profile hero */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 text-base font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                title="Upload avatar"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload avatar image"
                title="Upload avatar image"
                className="hidden"
                onChange={(e) => onAvatarPick(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <p className="text-lg font-semibold">{profile.displayName || defaultDisplayName}</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400">{email}</p>
              <p className="mt-1 inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Active
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={() => document.getElementById("account-info")?.scrollIntoView({ behavior: "smooth" })}>
            Edit Profile
          </Button>
        </div>
      </section>

      {/* Account details + preferences */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section id="account-info" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
          <h2 className="text-xl font-bold">Account Information</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Update your account details and profile metadata.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Display Name</span>
              <input
                value={profile.displayName}
                onChange={(e) => setProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Email</span>
              <input
                value={email}
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Organization</span>
              <input
                value={profile.organization}
                onChange={(e) => setProfile((prev) => ({ ...prev, organization: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Role</span>
              <input
                value={profile.role}
                onChange={(e) => setProfile((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Subscription Plan</span>
              <select
                value={profile.plan}
                onChange={(e) => setProfile((prev) => ({ ...prev, plan: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option>Free</option>
                <option>Pro</option>
                <option>Business</option>
                <option>Enterprise</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={saveAll} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            {savedAt ? <p className="text-xs text-slate-500 dark:text-zinc-400">Saved at {savedAt}</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
          <h2 className="text-xl font-bold">Preferences</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Set your workspace defaults and AI behavior.</p>

          <div className="mt-5 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-sm font-medium">Theme</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => applyTheme("light")}
                  className={`rounded-md px-3 py-1.5 text-xs ${preferences.theme === "light" ? "bg-amber-500 text-black" : "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-200"}`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme("dark")}
                  className={`rounded-md px-3 py-1.5 text-xs ${preferences.theme === "dark" ? "bg-amber-500 text-black" : "bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-200"}`}
                >
                  Dark
                </button>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="text-sm">Notification settings</span>
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={(e) => setPreferences((prev) => ({ ...prev, notifications: e.target.checked }))}
                className="h-4 w-4 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="text-sm">AI generation settings</span>
              <input
                type="checkbox"
                checked={preferences.aiSmartGeneration}
                onChange={(e) => setPreferences((prev) => ({ ...prev, aiSmartGeneration: e.target.checked }))}
                className="h-4 w-4 accent-amber-500"
              />
            </label>
          </div>
        </section>
      </div>

      {/* Created dashboards */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
        <h2 className="text-xl font-bold">Created Dashboards</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">All dashboards you already created, directly accessible from navbar and this page.</p>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{project.name}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Last updated: {new Date(project.updatedAt).toLocaleString("en-CA")}</p>
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link href={`/dashboard/${project.id}`}>Open dashboard</Link>
              </Button>
            </div>
          ))}
        </div>

        {projects.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-zinc-400">No dashboards created yet. Create one from the Create page.</p>
        ) : null}
      </section>
    </div>
  );
}
