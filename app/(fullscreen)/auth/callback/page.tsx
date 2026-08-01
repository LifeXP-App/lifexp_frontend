"use client";

/**
 * OAuth Callback Handler
 *
 * Handles redirects from OAuth providers (Google, etc.).
 *
 * This must be a client page, not a server route handler: with the PKCE flow,
 * exchanging the `code` requires the code_verifier that Supabase stored in this
 * browser's localStorage when signInWithOAuth() was called, which a server
 * route handler has no access to. Running here also means we control exactly
 * when the `code` is stripped from the URL, instead of leaving auth data
 * sitting in the address bar.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      // Strip auth params from the URL immediately so they never linger
      // in the address bar, browser history, or get shared/screenshotted.
      window.history.replaceState({}, "", "/auth/callback");

      if (error) {
        console.error("OAuth error:", error, errorDescription);
        router.replace(`/users/login?error=${encodeURIComponent(errorDescription || error)}`);
        return;
      }

      if (!code) {
        router.replace("/users/login");
        return;
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !data.session) {
        console.error("Code exchange error:", exchangeError);
        router.replace(`/users/login?error=${encodeURIComponent(exchangeError?.message || "Authentication failed")}`);
        return;
      }

      // Mirror the session into httpOnly cookies so server-side route
      // handlers (which can't read localStorage) can authenticate too.
      try {
        await fetch("/api/auth/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });
      } catch (err) {
        console.error("Failed to persist session cookie:", err);
      }

      router.replace("/");
    };

    run();
  }, [router]);

  return null;
}
