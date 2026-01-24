"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.detail || "Invalid login credentials");
        setLoading(false);
        return;
      }

      // ✅ cookies are set now, middleware will allow access
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      setError(String(err?.message || err));
      setLoading(false);
    }

  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background GIF */}
      <Image
        src="/auth/login.gif"
        alt="Login background"
        fill
        priority
        className="object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Centered Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-black/50 p-8 shadow-lg backdrop-blur-lg">
          <h2 className="mb-6 text-center text-3xl font-bold">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400">Username</label>
              <input
                type="text"
                name="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-transparent p-3 text-white focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-gray-400">Password</label>
              <input
                type="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              className="w-full rounded-lg bg-white py-3 font-bold text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <a
              href="/users/register"
              className="underline text-white hover:text-gray-300"
            >
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
