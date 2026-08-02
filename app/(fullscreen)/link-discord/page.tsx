"use client";

/**
 * Discord account linking.
 *
 * Reached two ways:
 *  1. Fresh, via the bot's /link command: ?token=<one-time token>. Shows a
 *     "Link Discord" button that kicks off Supabase's Discord OAuth as an
 *     *identity link* (supabase.auth.linkIdentity), not a sign-in — the user
 *     must already have a LifeXP session.
 *  2. After the Discord OAuth redirect: ?token=<token> is preserved through
 *     `redirectTo`, plus Supabase's own `?code=...` for linkIdentity's OAuth
 *     callback. We exchange the code, read the just-added Discord identity's
 *     id (== the Discord snowflake), and POST { token, discord_uid } to
 *     Django to actually set Player.discord_uid.
 *
 * Same PKCE-must-run-client-side reasoning as app/(fullscreen)/auth/callback.
 */

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

// "checking-auth" / "ready" / "needs-login" are derived from authStatus at
// render time (see `status` below), not stored — only the async-action
// phases below are real state, so there's nothing to mirror in an effect.
type CallbackStatus = "idle" | "confirming" | "success" | "error";

function LinkDiscordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authStatus } = useAuth();
  const ran = useRef(false);

  const token = searchParams.get("token");
  const [callbackStatus, setCallbackStatus] = useState<CallbackStatus>("idle");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 2: we're back from the Discord OAuth redirect (Supabase's `code`
  // param is present). Finish linking the identity and confirm with Django.
  useEffect(() => {
    if (ran.current) return;
    const code = searchParams.get("code");
    if (!code || !token) return;
    ran.current = true;

    const run = async () => {
      setCallbackStatus("confirming");
      window.history.replaceState({}, "", `/link-discord?token=${token}`);

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError(exchangeError.message || "Discord authorization failed.");
        setCallbackStatus("error");
        return;
      }

      const { data, error: identitiesError } = await supabase.auth.getUserIdentities();
      if (identitiesError) {
        setError(identitiesError.message || "Could not read linked Discord account.");
        setCallbackStatus("error");
        return;
      }

      const discordIdentity = data?.identities.find((identity) => identity.provider === "discord");
      if (!discordIdentity) {
        setError("Discord account was not linked. Please try again.");
        setCallbackStatus("error");
        return;
      }

      try {
        const res = await fetch("/api/auth/discord-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, discord_uid: discordIdentity.id }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.detail || "Failed to confirm the link with LifeXP.");
          setCallbackStatus("error");
          return;
        }

        setCallbackStatus("success");
      } catch {
        setError("Network error while confirming the link.");
        setCallbackStatus("error");
      }
    };

    run();
  }, [searchParams, token]);

  const isCallback = Boolean(searchParams.get("code"));

  // Derived, not stored: render directly from authStatus/callbackStatus/linking
  // instead of mirroring them into a redundant piece of state.
  const status: "checking-auth" | "needs-login" | "ready" | "linking" | "link-failed" | CallbackStatus = isCallback
    ? callbackStatus === "idle"
      ? "confirming"
      : callbackStatus
    : authStatus === "loading"
      ? "checking-auth"
      : authStatus !== "authenticated"
        ? "needs-login"
        : linking
          ? "linking"
          : error
            ? "link-failed"
            : "ready";

  async function handleLinkDiscord() {
    if (!token) return;
    setLinking(true);
    setError(null);

    let linkError: { message?: string } | null = null;
    try {
      const result = await supabase.auth.linkIdentity({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/link-discord?token=${token}`,
        },
      });
      linkError = result.error;
    } catch (err) {
      // linkIdentity() calls Supabase's /user/identities/authorize before
      // redirecting; a network failure or a disabled "Manual Linking"
      // setting can reject here instead of resolving with `error` set.
      linkError = { message: err instanceof Error ? err.message : "Failed to start Discord linking." };
    }

    if (linkError) {
      setError(linkError.message || "Failed to start Discord linking.");
      setLinking(false);
    }
    // On success, linkIdentity() redirects the browser to Discord itself —
    // this page re-mounts on the way back with ?code=... (handled above).
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-black/50 p-8 shadow-lg backdrop-blur-lg text-center">
          <div className="mb-4 text-4xl">🔗</div>
          <h2 className="mb-2 text-2xl font-bold">Link Discord to LifeXP</h2>

          {!token && (
            <p className="text-red-200">
              Missing link token. Run <code className="rounded bg-white/10 px-1">/link</code> in Discord again to get a
              fresh link.
            </p>
          )}

          {token && status === "checking-auth" && (
            <p className="text-gray-400">Checking your LifeXP session…</p>
          )}

          {token && status === "needs-login" && (
            <>
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                You need to be logged in to LifeXP to link Discord.
              </p>
              <a
                href={`/users/login?message=${encodeURIComponent("Log in, then run /link in Discord again to link your account.")}`}
                className="inline-block rounded-lg bg-white px-6 py-3 font-bold text-black transition hover:bg-gray-300"
              >
                Go to Login
              </a>
            </>
          )}

          {token && status === "error" && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {token && (status === "ready" || status === "link-failed") && (
            <>
              {status === "link-failed" && (
                <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}
              <p className="mb-6 text-gray-400">
                Confirm below to connect your Discord account. This lets the LifeXP bot show your stats, leaderboard
                rank, and more in Discord.
              </p>
              <button
                type="button"
                onClick={handleLinkDiscord}
                className="w-full cursor-pointer rounded-lg bg-[#5865F2] py-3 font-bold text-white transition hover:bg-[#4752C4]"
              >
                {status === "link-failed" ? "Try Again" : "Link Discord Account"}
              </button>
            </>
          )}

          {token && (status === "linking" || status === "confirming") && (
            <p className="text-gray-400">Connecting to Discord…</p>
          )}

          {token && status === "success" && (
            <>
              <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
                Discord account linked! You can close this tab and head back to Discord.
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full cursor-pointer rounded-lg bg-white py-3 font-bold text-black transition hover:bg-gray-300"
              >
                Back to LifeXP
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LinkDiscordPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LinkDiscordPage />
    </Suspense>
  );
}
