"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type Me = {
  id: number;
  username: string;
  email: string;
  fullname?: string;
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
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, username: string, fullname?: string) => Promise<{ error?: any }>;
  signInWithGoogle: () => Promise<{ error?: any }>;
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
  const refreshMe = async () => {
    try {
      // Get current Supabase session
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        setMe(null);
        return;
      }

      // Call Django backend with Supabase JWT token
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/me/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${currentSession.access_token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Failed to fetch player data:", res.status);
        setMe(null);
        return;
      }

      const data = await res.json();
      setMe({
        id: data.id,
        username: data.username,
        email: data.email,
        fullname: data.fullname,
      });
    } catch (err) {
      console.error("refreshMe failed:", err);
      setMe(null);
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) {
      // Supabase session established, fetch player data
      await refreshMe();
    }

    return { error };
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, username: string, fullname?: string) => {
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
      return { error: null };
    } catch (err) {
      console.error("Sign up error:", err);
      return { error: { message: "Registration failed" } };
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  };

  /**
   * Logout user
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setMe(null);
    setSession(null);
    setSupabaseUser(null);
    window.location.href = "/users/login";
  };

  /**
   * Initialize auth state and listen for changes
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setSupabaseUser(initialSession?.user ?? null);

      if (initialSession) {
        refreshMe();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log("Auth state changed:", _event);
        setSession(currentSession);
        setSupabaseUser(currentSession?.user ?? null);

        if (currentSession) {
          // User logged in or session refreshed
          await refreshMe();
        } else {
          // User logged out
          setMe(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        me,
        session,
        supabaseUser,
        loading,
        refreshMe,
        logout,
        signIn,
        signUp,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
