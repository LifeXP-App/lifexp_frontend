"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import posthog from "posthog-js";

type Me = {
  id: number;
  username: string;
  email: string;
  fullname?: string;
  profile_picture?: string | null;
  created_at?: string | null;
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type AuthContextType = {
  // Player data from Django
  me: Me | null;

  // Supabase auth state
  session: Session | null;
  supabaseUser: User | null;

  // Loading states
  loading: boolean;
  authStatus: AuthStatus;

  // Actions
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: { message?: string } | null }>;
  signUp: (email: string, password: string, username: string, fullname?: string) => Promise<{
    error?: {
      message?: string;
      detail?: string;
      username?: string | string[];
      email?: string | string[];
      password?: string | string[];
    } | null;
  }>;
  signInWithGoogle: () => Promise<{ error?: { message?: string } | null }>;
  requestPasswordReset: (email: string) => Promise<{ error?: { message?: string } | null; message?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  /**
   * Keep the cookie-backed server session on the exact same token generation
   * as the browser SDK. Supabase access tokens are intentionally short-lived;
   * every browser refresh must therefore rotate the server cookies too.
   */
  const syncServerSession = useCallback(async (currentSession: Session) => {
    try {
      const res = await fetch("/api/auth/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        }),
        cache: "no-store",
      });

      return res.ok;
    } catch (err) {
      console.error("Failed to sync server auth session:", err);
      return false;
    }
  }, []);

  /**
   * Fetch Player data from Django backend using Supabase session token
   */
  const refreshMe = useCallback(async () => {
    try {
      // Fetch Player data via the same-origin proxy route. The proxy reads the
      // httpOnly `sb-access-token` cookie (the source of truth for auth in prod)
      // and refreshes the token on a 401. We must NOT gate this on the browser
      // SDK's localStorage session (`supabase.auth.getSession()`): after a
      // server-side token refresh the localStorage session can be absent/stale
      // while the httpOnly cookie is still valid. Gating here left `me` null for
      // logged-in users, which routed every Profile link to `/u/undefined`.
      const res = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setMe(null);
          setAuthStatus("unauthenticated");
        } else {
          console.error("Failed to fetch player data:", res.status);
          // Do not destroy a known-good session because the API had a
          // temporary outage. During bootstrap, hold on an error screen rather
          // than misrepresenting a 5xx as a logout.
          setAuthStatus((current) =>
            current === "authenticated" ? current : "error"
          );
        }
        return;
      }

      const data = await res.json();
      setMe({
        id: data.id,
        username: data.username,
        email: data.email,
        fullname: data.fullname,
        profile_picture: data.profile_picture ?? null,
        created_at:
          data.joined_date ?? data.date_joined ?? data.created_at ?? data.createdAt ?? null,
      });
      setAuthStatus("authenticated");
    } catch (err) {
      console.error("refreshMe failed:", err);
      setAuthStatus((current) =>
        current === "authenticated" ? current : "error"
      );
    }
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    // Create exactly one Supabase session. Previously this signed in once via
    // the Next.js route and a second time in the browser. With "single session
    // per user" enabled, the second sign-in revoked the refresh token stored
    // by the first; its access token kept working until expiry and then every
    // server API call collapsed into 401s.
    const { data: browserData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !browserData.session) {
      return { error: sessionError ?? { message: "Authentication failed" } };
    }

    const synced = await syncServerSession(browserData.session);
    if (!synced) {
      await supabase.auth.signOut();
      return { error: { message: "Login succeeded, but the session could not be persisted." } };
    }

    await refreshMe();
    posthog.identify(email, { email });
    posthog.capture("user_signed_in", { email, method: "email" });

    return { error: null };
  }, [refreshMe, syncServerSession]);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string, username: string, fullname?: string) => {
    // First, register via Django (which creates user in Supabase)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullname: fullname || username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data };
      }

      // Registration successful, but user needs to confirm email
      posthog.capture("user_registered", { email, username, fullname: fullname || username });
      return { error: null };
    } catch (err) {
      console.error("Sign up error:", err);
      posthog.captureException(err);
      return { error: { message: "Registration failed" } };
    }
  }, []);

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (!error) {
      posthog.capture("user_signed_in_with_google", { method: "google" });
    }

    return { error };
  }, []);

  /**
   * Request a Supabase password-reset email via the Django backend.
   * Public endpoint (like signUp) - called directly against Django rather
   * than through a Next proxy since there's no session to attach.
   */
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: { message: data.error || "Failed to send reset email." } };
      }

      return { error: null, message: data.message as string };
    } catch (err) {
      console.error("Password reset request error:", err);
      return { error: { message: "Failed to send reset email." } };
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    posthog.capture("user_logged_out");
    posthog.reset();
    await supabase.auth.signOut();
    try {
      // signOut() only clears the localStorage session. Clear the server-set
      // httpOnly sb-access-token / sb-refresh-token cookies too, otherwise
      // /api/auth/me still sees a valid session and the login page bounces the
      // user back in.
      await fetch("/api/auth/logout-supabase", { method: "POST", cache: "no-store" });
    } catch {
      // Redirect regardless.
    }
    setMe(null);
    setSession(null);
    setSupabaseUser(null);
    window.location.replace("/users/login");
  }, []);

  /**
   * Initialize auth state and listen for changes
   */
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!active) return;

      setSession(initialSession);
      setSupabaseUser(initialSession?.user ?? null);

      // getSession() refreshes an old browser token when necessary. Mirror that
      // fresh generation into the server cookies before any protected page is
      // allowed to mount and start its API queries.
      if (initialSession) {
        await syncServerSession(initialSession);
      }

      await refreshMe();
      if (active) setLoading(false);
    };

    void initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // initialize() owns the first reconciliation, avoiding two competing
        // /auth/me requests during React's initial mount.
        if (event === "INITIAL_SESSION") return;

        setSession(currentSession);
        setSupabaseUser(currentSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          // Explicit sign-out — the cookie is cleared server-side; don't re-fetch.
          setMe(null);
          setAuthStatus("unauthenticated");
        } else {
          // SIGNED_IN and TOKEN_REFRESHED must update the HttpOnly copy before
          // the next API request. This is what keeps an indefinite rolling
          // session healthy across access-token rotations.
          if (currentSession) {
            await syncServerSession(currentSession);
            await refreshMe();
          }
        }

        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshMe, syncServerSession]);

  const value = useMemo<AuthContextType>(
    () => ({
      me,
      session,
      supabaseUser,
      loading,
      authStatus,
      refreshMe,
      logout,
      signIn,
      signUp,
      signInWithGoogle,
      requestPasswordReset,
    }),
    [
      me,
      session,
      supabaseUser,
      loading,
      authStatus,
      refreshMe,
      logout,
      signIn,
      signUp,
      signInWithGoogle,
      requestPasswordReset,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
