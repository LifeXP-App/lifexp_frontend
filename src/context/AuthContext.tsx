"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Me = {
  id: number;
  username: string;
};

type AuthContextType = {
  me: Me | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
 const [me, setMe] = useState<Me | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    setLoading(true);

    try {
      // ✅ CALL NEXT API (not Django)
      const res = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        setMe(null);
        return;
      }

      const data = await res.json();
      setMe({ id: data.id, username: data.username });
    } catch (err) {
      console.error("❌ refreshMe failed:", err);
      setMe(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    window.location.href = "/users/login";
  };

  useEffect(() => {
    refreshMe();
  }, []);

  return (
    <AuthContext.Provider value={{ me, loading, refreshMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
