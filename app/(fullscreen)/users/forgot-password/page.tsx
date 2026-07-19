"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/src/context/AuthContext";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await requestPasswordReset(email);

    setLoading(false);

    if (resetError) {
      setError(resetError.message || "Failed to send reset email");
      return;
    }

    setSent(true);
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background GIF */}
      <Image
        src="/auth/login.gif"
        alt="Forgot password background"
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
          <h2 className="mb-6 text-center text-3xl font-bold">Reset Password</h2>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
                <p className="text-lg font-semibold text-green-200">Check your email</p>
                <p className="mt-2 text-sm text-gray-300">
                  If an account exists for <span className="font-semibold">{email}</span>, we&apos;ve sent a link to reset your password.
                </p>
              </div>
              <Link
                href="/users/login"
                className="block w-full rounded-lg bg-white py-3 text-center font-bold text-black transition hover:bg-gray-300"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-400">
                Enter the email address on your account and we&apos;ll send you a link to reset your password.
              </p>

              <div>
                <label className="block text-gray-400">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer rounded-lg bg-white py-3 font-bold text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          {!sent && (
            <p className="mt-4 text-center text-gray-500">
              Remembered your password?{" "}
              <Link href="/users/login" className="underline text-white hover:text-gray-300">
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
