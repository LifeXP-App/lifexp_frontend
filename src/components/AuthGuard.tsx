"use client";

import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/users/login");
    }
  }, [session, loading, router, pathname]);

  // Show loading state while checking auth
  if (loading) {
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
  if (!session) {
    return null;
  }

  return <>{children}</>;
}
