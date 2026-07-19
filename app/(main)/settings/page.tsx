"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";
import DeleteAccountModal from "@/src/components/settings/DeleteAccountModal";

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

// ✅ convert backend -> UI form
function backendToForm(data: BackendSettings): SettingsFormState {
  return {
    account_type: data.account_type === "Public" ? "Public" : "Private",
    notifications: data.notifications ? "On" : "Off",
    appearance: data.appearance === "Light" ? "Light" : "Dark",
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


function SkeletonValue() {
  return (
    <div className="h-10 w-32 rounded bg-gray-200 border border-gray-300 dark:border-[var(--border)] dark:bg-dark-2 animate-pulse" />
  );
}

export default function SettingsPage() {
  const { session, me, loading: authLoading, requestPasswordReset } = useAuth();
  const queryClient = useQueryClient();

  const [changePasswordStatus, setChangePasswordStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [changePasswordMessage, setChangePasswordMessage] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Cached so revisiting this page (or coming back from another tab) serves
  // the settings instantly from the cache instead of skeleton-loading again
  // every time — only a genuinely first-ever load, or an explicit
  // invalidation, hits the network and blocks on isLoading.
  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/users/settings", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data: BackendSettings = await res.json();
      return backendToForm(data);
    },
    enabled: !authLoading && !!session?.access_token,
  });

  // `form` is the user's editable draft (diverges from the cached/server
  // value while they're picking new options, before Save commits it);
  // `initialForm` tracks the last known-saved value so Save can disable
  // itself when nothing has changed. Both re-sync whenever fresh settings
  // data lands — initial load, or a background revalidation.
  const [form, setForm] = useState<SettingsFormState | null>(null);
  const [initialForm, setInitialForm] = useState<SettingsFormState | null>(
    null,
  );

  useEffect(() => {
    if (!settingsData) return;
    setForm(settingsData);
    setInitialForm(settingsData);
  }, [settingsData]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/users/login";
    }
  }

  async function handleChangePassword() {
    if (!me?.email) return;

    setChangePasswordStatus("sending");

    const { error, message } = await requestPasswordReset(me.email);

    if (error) {
      setChangePasswordStatus("error");
      setChangePasswordMessage(error.message || "Failed to send reset email.");
      return;
    }

    setChangePasswordStatus("sent");
    setChangePasswordMessage(message || "Check your email for a link to reset your password.");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/auth/account", { method: "DELETE" });

      if (res.status !== 204) {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error || data?.detail || "Failed to delete account. Please try again.");
        setDeleting(false);
        return;
      }

      // Best-effort local cleanup - the account is already gone server-side.
      try {
        await fetch("/api/auth/logout-supabase", { method: "POST" });
        await supabase.auth.signOut();
      } catch (err) {
        console.error("❌ Failed to clear local session after account deletion:", err);
      }

      window.location.href = "/users/login";
    } catch (err) {
      console.error("❌ Failed to delete account:", err);
      setDeleteError("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  }

  const { setTheme } = useTheme();
  const appearance = form?.appearance;

  useEffect(() => {
    if (!appearance) return;

    const nextTheme = appearance === "Dark" ? "dark" : "light";
    setTheme(nextTheme);
  }, [appearance, setTheme]);

  const saveSettings = useCallback(async (payload: SettingsFormState) => {
    try {
      if (!initialForm) return;
      if (isSameSettings(payload, initialForm)) return;

      setSaving(true);

      const backendPayload = formToBackend(payload);

      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("❌ Failed saving settings:", data);
        return;
      }

      // ✅ mark as saved so button disables again, and update the cache in
      // place — no need to refetch, we already know what was just saved.
      setInitialForm(payload);
      queryClient.setQueryData(["settings"], payload);
    } catch (err) {
      console.error("❌ Failed saving settings:", err);
    } finally {
      setSaving(false);
    }
  }, [initialForm, queryClient, session?.access_token]);

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

  return (
    <main className="flex overflow-y-auto w-full">
      <div className="w-full md:w-[calc(100%-420px)] flex-1 overflow-y-auto py-8 px-6 md:px-12">
        <h2 className="text-2xl font-medium text-left text-black dark:text-[var(--foreground)] mb-6">
          Settings
        </h2>

        {/* Account type */}
        <div className="flex justify-between w-full mb-4">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-[var(--foreground)] mb-2">
            Account Type
          </h2>

          {form ? (
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
                className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-[var(--dark-1)] border border-gray-800 dark:border-[var(--border)] hover:border-gray-500 dark:hover:border-[var(--border)] px-4 py-2 pr-8 rounded leading-tight text-black dark:text-[var(--foreground)]"
              >
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-[var(--muted)]">
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
          ) : (
            <SkeletonValue />
          )}
        </div>

        {/* Notifications */}
        <div className="flex justify-between w-full mb-4">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-[var(--foreground)] mb-2">
            Notifications
          </h2>

          {form ? (
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
                className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-[var(--dark-1)] border border-gray-800 dark:border-[var(--border)] hover:border-gray-500 dark:hover:border-[var(--border)] px-4 py-2 pr-8 rounded leading-tight text-black dark:text-[var(--foreground)]"
              >
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-[var(--muted)]">
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
          ) : (
            <SkeletonValue />
          )}
        </div>

        {/* Appearance */}
        <div className="flex justify-between w-full mb-8">
          <h2 className="text-l md:text-xl font-medium text-left text-black dark:text-[var(--foreground)] mb-2">
            Appearance
          </h2>

          {form ? (
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
                className="cursor-pointer text-sm md:text-base block appearance-none w-full bg-white dark:bg-[var(--dark-1)] border border-gray-800 dark:border-[var(--border)] hover:border-gray-500 dark:hover:border-[var(--border)] px-4 py-2 pr-8 rounded leading-tight text-black dark:text-[var(--foreground)]"
              >
                <option value="Dark">Dark</option>
                <option value="Light">Light</option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-[var(--muted)]">
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
          ) : (
            <SkeletonValue />
          )}
        </div>

        {/* Save button
        <button
          onClick={() => form && saveSettings(form)}
          disabled={saving || loadingSettings || !form || isUnchanged}
          className="flex float-right md:float-left items-center p-2 rounded-lg cursor-pointer px-12 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#4168e2", color: "white" }}
        >
          Save
        </button> */}
      </div>

      {/* Desktop right panel */}
      <aside className="w-[420px] p-6 hidden md:block overflow-y-auto">
        <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] flex flex-col gap-4">
          <h2 className="text-xl font-medium text-left text-black dark:text-[var(--foreground)] mb-2">
            Account
          </h2>

          <Link
            href="/u/edit"
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-[var(--foreground)] hover:text-gray-600 dark:hover:text-[var(--muted)]"
          >
            Edit Profile
          </Link>

          <button
            onClick={handleChangePassword}
            disabled={changePasswordStatus === "sending" || !me?.email}
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-[var(--foreground)] hover:text-gray-600 dark:hover:text-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changePasswordStatus === "sending" ? "Sending..." : "Change Password"}
          </button>
          {changePasswordMessage && (
            <p
              className={`text-sm -mt-2 ${
                changePasswordStatus === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {changePasswordMessage}
            </p>
          )}

          <button
            onClick={() => {
              setDeleteError(null);
              setDeleteModalOpen(true);
            }}
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Delete Account
          </button>
        </div>

        <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] flex flex-col gap-4">
          
          <a target="__blank" href="https://www.gamilife.com/community" className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-gray-800 dark:text-[var(--foreground)] hover:text-gray-600 dark:hover:text-[var(--muted)]">
            Send Review
          </a>

          <button
            onClick={handleLogout}
            className="cursor-pointer active:opacity-80 text-l font-semibold text-left text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </aside>

      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
        error={deleteError}
      />
    </main>
  );
}
