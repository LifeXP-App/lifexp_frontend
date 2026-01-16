"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AccountType = "Private" | "Public";
type Notifications = "On" | "Off";
type Appearance = "Dark" | "Light";

type SettingsFormState = {
  account_type: AccountType;
  notifications: Notifications;
  appearance: Appearance;
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsFormState>({
    account_type: "Public",
    notifications: "On",
    appearance: "Light",
  });

  const [saving, setSaving] = useState(false);

  async function saveSettings(payload: SettingsFormState) {
    try {
      setSaving(true);
      console.log("✅ Saved settings:", payload);
      // TODO: replace with backend call
    } finally {
      setSaving(false);
    }
  }

  // autosave on mobile (< md)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;

    saveSettings(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

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
                setForm((prev) => ({
                  ...prev,
                  account_type: e.target.value as AccountType,
                }))
              }
              className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-dark-3 border border-gray-800 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 px-4 py-2 pr-8 rounded leading-tight text-black dark:text-white"
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
                setForm((prev) => ({
                  ...prev,
                  notifications: e.target.value as Notifications,
                }))
              }
              className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-dark-3 border border-gray-800 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 px-4 py-2 pr-8 rounded leading-tight text-black dark:text-white"
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
                setForm((prev) => ({
                  ...prev,
                  appearance: e.target.value as Appearance,
                }))
              }
              className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-dark-3 border border-gray-800 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 px-4 py-2 pr-8 rounded leading-tight text-black dark:text-white"
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

        {/* Save button (desktop only behavior) */}
        <button
          onClick={() => saveSettings(form)}
          disabled={saving}
          className="flex float-right md:float-left items-center p-2 rounded-lg cursor-pointer px-12 disabled:opacity-50"
          style={{ backgroundColor: "#4168e2", color: "white" }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Desktop right panel */}
      <aside className="w-[420px] p-6 hidden md:block overflow-y-auto">
        <div className="bg-white dark:bg-dark-3 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <h2 className="text-xl font-medium text-left text-black dark:text-white mb-2">
            Account
          </h2>

          <Link
            href="/edit_profile"
            className="cursor-pointer text-l font-semibold text-left text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
          >
            Edit Profile
          </Link>

          <Link
            href="/change-password"
            className="cursor-pointer text-l font-semibold text-left text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
          >
            Change Password
          </Link>

          <button className="cursor-pointer text-l font-semibold text-left text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
            Delete Account
          </button>
        </div>

        <div className="bg-white dark:bg-dark-3 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex flex-col gap-4">
          <button className="cursor-pointer text-l font-semibold text-left text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
            Invite Friends
          </button>

          <button className="cursor-pointer text-l font-semibold text-left text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
            Log out
          </button>
        </div>
      </aside>
    </main>
  );
}