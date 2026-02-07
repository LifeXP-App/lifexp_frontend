"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AccountType = "Private" | "Public";
type Notifications = "On" | "Off";
type Appearance = "Dark" | "Light";

type SettingsFormState = {
  account_type: AccountType;
  notifications: Notifications;
  appearance: Appearance;
};

type BackendSettings = {
  account_type: string;
  notifications: boolean;
  appearance: string;
  timezone?: string | null;
  notification_time?: string | null;
  interests?: string | null;
  intro_complete?: boolean;
  onboarding_complete?: boolean;
  leaderboard_status?: string | null;
};

function isSameSettings(a: SettingsFormState, b: SettingsFormState) {
  return (
    a.account_type === b.account_type &&
    a.notifications === b.notifications &&
    a.appearance === b.appearance
  );
}

function SkeletonRow() {
  return (
    <div className="flex justify-between w-full mb-4 animate-pulse">
      <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function SkeletonPanel() {
  return (
    <aside className="w-[420px] p-6 hidden md:block overflow-y-auto animate-pulse">
      <div className="bg-white dark:bg-dark-3 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-44 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="bg-white dark:bg-dark-3 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </aside>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const [form, setForm] = useState<SettingsFormState | null>(null);

  // ✅ keep initial form so Save disables when unchanged
  const [initialForm, setInitialForm] = useState<SettingsFormState | null>(
    null,
  );

  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/users/login";
    }
  }

  const { setTheme } = useTheme();

  useEffect(() => {
    if (!form) return;

    const nextTheme = form.appearance === "Dark" ? "dark" : "light";
    setTheme(nextTheme);
  }, [form?.appearance, setTheme]);

  // ✅ convert backend -> UI form
  function backendToForm(data: BackendSettings): SettingsFormState {
    return {
      account_type: data.account_type === "Public" ? "Public" : "Private",
      notifications: data.notifications ? "On" : "Off",
      appearance: data.appearance === "Dark" ? "Dark" : "Light",
    };
  }

  // ✅ convert UI form -> backend payload
  function formToBackend(payload: SettingsFormState) {
    return {
      account_type: payload.account_type === "Private" ? "Private" : "Public",
      notifications: payload.notifications === "On",
      appearance: payload.appearance === "Dark" ? "Dark" : "Light",
    };
  }

  async function loadSettings() {
    setLoadingSettings(true);

    try {
      const res = await fetch("/api/users/settings", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("❌ Failed to load settings:", await res.text());
        return;
      }

      const data: BackendSettings = await res.json();
      const newForm = backendToForm(data);

      setForm(newForm);
      setInitialForm(newForm);
    } catch (err) {
      console.error("❌ Failed to load settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  }

  async function saveSettings(payload: SettingsFormState) {
    try {
      if (!initialForm) return;
      if (isSameSettings(payload, initialForm)) return;

      setSaving(true);

      const backendPayload = formToBackend(payload);

      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("❌ Failed saving settings:", data);
        return;
      }

      // ✅ mark as saved so button disables again
      setInitialForm(payload);

      // ✅ optional: reload to stay fully in sync
      await loadSettings();
    } catch (err) {
      console.error("❌ Failed saving settings:", err);
    } finally {
      setSaving(false);
    }
  }

  // ✅ initial load ONCE
  useEffect(() => {
    loadSettings();
  }, []);

  // ✅ unchanged check
  const isUnchanged = useMemo(() => {
    if (!form || !initialForm) return true;
    return isSameSettings(form, initialForm);
  }, [form, initialForm]);

  // autosave on mobile (< md)
  useEffect(() => {
    if (!form) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;

    if (loadingSettings) return;
    if (!initialForm) return;
    if (isUnchanged) return;

    saveSettings(form);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // ✅ skeleton screen while loading / form not ready
  if (loadingSettings || !form) {
    return (
      <main className="flex overflow-y-auto w-full">
        <div className="w-full md:w-[calc(100%-420px)] flex-1 overflow-y-auto py-8 px-6 md:px-12">
          <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-700 mb-6 animate-pulse" />

          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />

          <div className="flex justify-end md:justify-start mt-8 animate-pulse">
            <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        <SkeletonPanel />
      </main>
    );
  }

  return (
    <main className="flex overflow-y-auto w-full">
      <div className="w-full md:w-[calc(100%-420px)] flex-1 overflow-y-auto py-8 px-6 md:px-12">
        <h2 className="text-2xl font-medium text-left text-black dark:text-white mb-6">
          Settings
        </h2>

        {/* Account type */}
        <div className="flex justify-between w-full mb-4">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-white mb-2">
            Account Type
          </h2>

          <div className="relative inline-block w-32">
            <select
              value={form.account_type}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? { ...prev, account_type: e.target.value as AccountType }
                    : prev,
                )
              }
              className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-gray-900 border border-gray-800 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 px-4 py-2 pr-8 rounded leading-tight text-black dark:text-white"
            >
              <option value="Private">Private</option>
              <option value="Public">Public</option>
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex justify-between w-full mb-4">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-white mb-2">
            Notifications
          </h2>

          <div className="relative inline-block w-32">
            <select
              value={form.notifications}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        notifications: e.target.value as Notifications,
                      }
                    : prev,
                )
              }
              className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-gray-900 border border-gray-800 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 px-4 py-2 pr-8 rounded leading-tight text-black dark:text-white"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="flex justify-between w-full mb-8">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-white mb-2">
            Appearance
          </h2>

          <div className="relative inline-block w-32">
            <select
              value={form.appearance}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? { ...prev, appearance: e.target.value as Appearance }
                    : prev,
                )
              }
              className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-gray-900 border border-gray-800 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 px-4 py-2 pr-8 rounded leading-tight text-black dark:text-white"
            >
              <option value="Dark">Dark</option>
              <option value="Light">Light</option>
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={() => saveSettings(form)}
          disabled={saving || loadingSettings || isUnchanged}
          className="flex float-right md:float-left items-center p-2 rounded-lg cursor-pointer px-12 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#4168e2", color: "white" }}
        >
          Save
        </button>
      </div>

      {/* Desktop right panel */}
      <aside className="w-[420px] p-6 hidden md:block overflow-y-auto">
        <div className="bg-white dark:bg-dark-3 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <h2 className="text-xl font-medium text-left text-black dark:text-white mb-2">
            Account
          </h2>

          <Link
            href="/u/edit"
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
          >
            Edit Profile
          </Link>

          <Link
            href="/change-password"
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
          >
            Change Password
          </Link>

          <button className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
            Delete Account
          </button>
        </div>

        <div className="bg-white dark:bg-dark-3 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <button className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
            Invite Friends
          </button>

          <button
            onClick={handleLogout}
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </aside>
    </main>
  );
}
