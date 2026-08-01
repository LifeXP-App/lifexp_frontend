"use client";

/**
 * Password Reset Landing Page
 *
 * Supabase's password reset email links to Supabase's own hosted
 * `/auth/v1/verify?token=...&type=recovery&redirect_to=...` endpoint, which
 * verifies the token server-side and then redirects the browser here. That
 * redirect can land in either of two shapes depending on the Supabase
 * project's flow configuration:
 *   - a PKCE-style `?code=` query param (exchanged via exchangeCodeForSession)
 *   - the legacy implicit `#access_token=&refresh_token=&type=recovery` hash
 *     fragment (applied directly via setSession)
 * Both are handled below so the link works regardless of which one Supabase
 * actually sends. Once a recovery session is established, the user sets a
 * new password and is logged straight into the app — AuthContext's own
 * onAuthStateChange listener already syncs the resulting session into
 * server cookies, so no separate login step is needed.
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
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      // Hash fragment isn't sent to the server and isn't in searchParams —
      // parse it manually. Supabase's implicit recovery redirect puts
      // access_token/refresh_token/type here instead of a query `code`.
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashAccessToken = hashParams.get("access_token");
      const hashRefreshToken = hashParams.get("refresh_token");
      const hashError = hashParams.get("error");
      const hashErrorDescription = hashParams.get("error_description");

      // Strip auth params from the URL immediately, same as /auth/callback.
      window.history.replaceState({}, "", "/auth/reset-password");

      if (error || hashError) {
        console.error("Password reset link error:", error || hashError, errorDescription || hashErrorDescription);
        setLinkError(errorDescription || hashErrorDescription || "This password reset link is invalid or has expired.");
        setVerifying(false);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Reset code exchange error:", exchangeError);
          setLinkError("This password reset link is invalid or has expired.");
          setVerifying(false);
          return;
        }

        setVerifying(false);
        return;
      }

      if (hashAccessToken && hashRefreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: hashAccessToken,
          refresh_token: hashRefreshToken,
        });

        if (setSessionError) {
          console.error("Reset session error:", setSessionError);
          setLinkError("This password reset link is invalid or has expired.");
          setVerifying(false);
          return;
        }

        setVerifying(false);
        return;
      }

      setLinkError("This password reset link is invalid or has expired.");
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

    // The recovery session from the reset link is already a real session —
    // AuthContext's onAuthStateChange listener syncs it into server cookies
    // automatically, so the user is already logged in at this point.
    setSuccess(true);
    router.replace("/");
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

          {success ? (
            <p className="text-center text-gray-400">Password updated. Taking you in...</p>
          ) : verifying ? (
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
