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

type AuthContextType = {
  // Player data from Django
  me: Me | null;

  // Supabase auth state
  session: Session | null;
  supabaseUser: User | null;

  // Loading states
  loading: boolean;

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
        if (res.status !== 401) {
          console.error("Failed to fetch player data:", res.status);
        }
        setMe(null);
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
    } catch (err) {
      console.error("refreshMe failed:", err);
      setMe(null);
    }
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    // Call the server-side route handler so it can set the httpOnly sb-access-token cookie.
    // The browser SDK alone only puts the token in localStorage, which server route handlers can't read.
    const res = await fetch("/api/auth/login/supabase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: { message: data.error || "Login failed" } };
    }

    // Also initialize the browser SDK session so onAuthStateChange fires
    // and any client-side Supabase queries work.
    const { error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!sessionError) {
      await refreshMe();
      posthog.identify(email, { email });
      posthog.capture("user_signed_in", { email, method: "email" });
    }

    return { error: sessionError ?? null };
  }, [refreshMe]);

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
    const { data, error } = await supabase.auth.signInWithOAuth({
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
    window.location.href = "/users/login";
  }, []);

  /**
   * Initialize auth state and listen for changes
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setSupabaseUser(initialSession?.user ?? null);

      // Always resolve `me` from the cookie-backed proxy, even when the browser
      // SDK has no localStorage session — the httpOnly cookie may still be a
      // valid session. The proxy returns 401 (→ me = null) when truly signed out.
      refreshMe().finally(() => setLoading(false));
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setSupabaseUser(currentSession?.user ?? null);

        if (_event === "SIGNED_OUT") {
          // Explicit sign-out — the cookie is cleared server-side; don't re-fetch.
          setMe(null);
        } else {
          // Login, token refresh, or initial session: resolve `me` from the
          // cookie-backed proxy (not gated on the SDK localStorage session).
          await refreshMe();
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshMe]);

  const value = useMemo<AuthContextType>(
    () => ({
      me,
      session,
      supabaseUser,
      loading,
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
