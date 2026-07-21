"use client";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";
import { forceLogout } from "@/src/lib/api/sessionExpiry";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authStatus, loading, refreshMe } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!loading && authStatus === "unauthenticated") {
      void forceLogout();
    }
  }, [authStatus, loading]);

  // Show loading state while checking auth
  if (loading || authStatus === "loading") {
    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
    const logoSrc = isDark ? "/logodark.png" : "/logolight.png";

    return (
      <div className="flex h-screen items-center justify-center">
        {mounted && (
          <Image
            src={logoSrc}
            alt="GamiLife"
            width={100}
            height={100}
            unoptimized
            priority
            className="w-32 h-32 animate-[pulse_3s_ease-in-out_infinite]"
          />
        )}
      </div>
    );
  }

  // Don't render children if not authenticated
  if (authStatus === "unauthenticated") {
    return null;
  }

  if (authStatus === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p>We couldn&apos;t verify your session right now.</p>
        <button
          type="button"
          onClick={() => void refreshMe()}
          className="rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
