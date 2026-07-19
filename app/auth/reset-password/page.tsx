"use client";

/**
 * Password Reset Landing Page
 *
 * Supabase's password reset email links here with a `?code=` param (see
 * redirect_to in the Django /api/v1/auth/password-reset/ endpoint). Exchanges
 * that code for a recovery session the same way /auth/callback exchanges an
 * OAuth code, then lets the user set a new password before signing them back
 * out to log in normally.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, updatePassword } from "@/src/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const ran = useRef(false);

  const [verifying, setVerifying] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      // Strip auth params from the URL immediately, same as /auth/callback.
      window.history.replaceState({}, "", "/auth/reset-password");

      if (error) {
        console.error("Password reset link error:", error, errorDescription);
        setLinkError(errorDescription || "This password reset link is invalid or has expired.");
        setVerifying(false);
        return;
      }

      if (!code) {
        setLinkError("This password reset link is invalid or has expired.");
        setVerifying(false);
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Reset code exchange error:", exchangeError);
        setLinkError("This password reset link is invalid or has expired.");
        setVerifying(false);
        return;
      }

      setVerifying(false);
    };

    run();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const { error } = await updatePassword(password);

    if (error) {
      setFormError(error.message || "Failed to update password.");
      setSubmitting(false);
      return;
    }

    // The recovery session is only good for setting a new password - sign
    // out so the user logs back in normally with it.
    await supabase.auth.signOut();
    router.replace(`/users/login?message=${encodeURIComponent("Password updated. Please log in.")}`);
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background GIF */}
      <Image
        src="/auth/login.gif"
        alt="Reset password background"
        fill
        priority
        unoptimized
        className="object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Centered Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-black/50 p-8 shadow-lg backdrop-blur-lg">
          <h2 className="mb-6 text-center text-3xl font-bold">Set New Password</h2>

          {verifying ? (
            <p className="text-center text-gray-400">Verifying your reset link...</p>
          ) : linkError ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-200">
                {linkError}
              </div>
              <Link
                href="/users/forgot-password"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-black transition hover:bg-gray-300"
              >
                Request a New Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-gray-400">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full cursor-pointer rounded-lg bg-white py-3 font-bold text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
