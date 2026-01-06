"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SidebarHeader() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Use logolight for dark mode, logodark for light mode
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const logoSrc = isDark ? "/logodark.png" : "/logolight.png";
  console.log("SidebarHeader render:", {
    theme,
    resolvedTheme,
    isDark,
    logoSrc,
  });
  return (
    <div className="py-4 px-2">
      <Link href="/" className="flex items-center">
        {mounted ? (
          <>
            <Image
              src={logoSrc}
              alt="LifeXP"
              width={100}
              height={100}
              priority
              className="w-16 h-16"
            />
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              LifeXP
            </span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </>
        )}
      </Link>
    </div>
  );
}
