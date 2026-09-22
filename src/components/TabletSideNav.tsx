"use client";

import {
  HomeIcon,
  MagnifyingGlassIcon,
  SquaresPlusIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";
import {
  HomeIcon as HomeIconOutline,
  MagnifyingGlassIcon as MagnifyingGlassIconOutline,
  SquaresPlusIcon as SquaresPlusIconOutline,
  BellIcon as BellIconOutline,
  UserCircleIcon as UserCircleIconOutline,
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

type TabletNavItem = {
  label: string;
  href: string;
  active: string[];
  SolidIcon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  OutlineIcon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  isProfile?: boolean;
};

// Mirrors the Flutter app's tablet-landscape floating side nav
// (lib/widgets/layout/main_shell.dart, _FloatingSideNav): a fixed 64px-wide,
// vertically-centered pill anchored near the left edge, icon-only, with the
// active icon accented by the user's own mastery color (not a fixed brand
// color) and a brief scale-bounce on selection. Same tab set/order as
// BottomNav — this is the >=768px counterpart to it, replacing the previous
// full-width docked sidebar at that breakpoint.
export function TabletSideNav({ accentColor = "#4168e2" }: { accentColor?: string }) {
  const pathname = usePathname();
  const { me, supabaseUser } = useAuth();
  const username = me?.username ?? supabaseUser?.user_metadata?.username;

  const NAV_ITEMS: TabletNavItem[] = [
    { label: "Feed", href: "/", active: ["/"], SolidIcon: HomeIcon, OutlineIcon: HomeIconOutline },
    {
      label: "Search",
      href: "/search",
      active: ["/search"],
      SolidIcon: MagnifyingGlassIcon,
      OutlineIcon: MagnifyingGlassIconOutline,
    },
    {
      label: "Goals",
      href: "/goals",
      active: ["/goals", "/a"],
      SolidIcon: SquaresPlusIcon,
      OutlineIcon: SquaresPlusIconOutline,
    },
    {
      label: "Notifications",
      href: "/notifications",
      active: ["/notifications"],
      SolidIcon: BellIcon,
      OutlineIcon: BellIconOutline,
    },
    {
      label: "Profile",
      href: username ? `/u/${username}` : "/settings",
      active: ["/u"],
      SolidIcon: UserCircleIcon,
      OutlineIcon: UserCircleIconOutline,
      isProfile: true,
    },
  ];

  return (
    <>
      {/* Web-only branding — the Flutter pill this is modeled on has no logo
          of its own (native apps don't need an in-nav brand mark), but a
          browser tab benefits from one. Sits above the pill, sharing its
          left-5 alignment. */}
      <TabletNavLogo />

      <aside
        aria-label="Main navigation"
        className="hidden md:flex md:fixed md:left-5 md:top-1/2 md:-translate-y-1/2 md:z-40 md:flex-col md:items-center md:gap-7 md:rounded-full md:border md:border-black/8 md:bg-white md:py-3 md:shadow-lg dark:md:border-white/12 dark:md:bg-dark-2"
        style={{ width: 64 }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.active.some(
            (path) => pathname === path || pathname.startsWith(path + "/"),
          );

          return item.isProfile ? (
            <ProfileTabletNavItem
              key={item.label}
              href={item.href}
              isActive={isActive}
              accentColor={accentColor}
              avatarUrl={me?.profile_picture}
              fallbackName={me?.fullname || me?.username}
            />
          ) : (
            <TabletNavItemButton
              key={item.label}
              item={item}
              isActive={isActive}
              accentColor={accentColor}
            />
          );
        })}
      </aside>

      <TabletNavSettings
        isActive={pathname === "/settings" || !!pathname?.startsWith("/settings/")}
        accentColor={accentColor}
      />
    </>
  );
}

function TabletNavLogo() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => setMounted(true), []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const logoSrc = isDark ? "/logodark.png" : "/logolight.png";

  return (
    <Link
      href="/"
      aria-label="GamiLife"
      className="hidden md:flex md:fixed md:left-5 md:top-10 md:z-40 md:w-16 md:items-center md:justify-center"
    >
      {mounted ? (
        <Image
          src={logoSrc}
          alt="GamiLife"
          width={64}
          height={64}
          unoptimized
          priority
          className="w-14 h-14"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-dark-2 animate-pulse" />
      )}
    </Link>
  );
}

function TabletNavSettings({
  isActive,
  accentColor,
}: {
  isActive: boolean;
  accentColor: string;
}) {
  return (
    <Link
      href="/settings"
      aria-label="Settings"
      aria-current={isActive ? "page" : undefined}
      className="group hidden md:fixed md:bottom-10 md:left-5 md:z-40 md:flex md:w-16 md:items-center md:justify-center"
    >
      <span className="flex items-center justify-center rounded-full p-2 transition-all duration-200 ease-out hover:scale-110 hover:bg-black/5 active:scale-95 dark:hover:bg-white/10">
        <Cog6ToothIcon
          className={
            isActive
              ? "w-8 h-8 shrink-0"
              : "w-8 h-8 shrink-0 text-gray-600 opacity-80 transition-opacity duration-200 group-hover:opacity-100 dark:text-white dark:opacity-80 dark:group-hover:opacity-100"
          }
          style={isActive ? { color: accentColor } : undefined}
        />
      </span>
    </Link>
  );
}

function TabletNavItemButton({
  item,
  isActive,
  accentColor,
}: {
  item: TabletNavItem;
  isActive: boolean;
  accentColor: string;
}) {
  // Scale-bounce (1 -> 1.15 -> 1) on the render where this item just became
  // active, mirroring the Flutter pill's spring-curve selection animation.
  const [bounce, setBounce] = useState(false);
  useEffect(() => {
    if (!isActive) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setBounce(true);
    const t = setTimeout(() => setBounce(false), 220);
    return () => clearTimeout(t);
  }, [isActive]);

  const Icon = isActive ? item.SolidIcon : item.OutlineIcon;

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className="group flex items-center justify-center rounded-full p-2 transition-all duration-200 ease-out hover:scale-110 hover:bg-black/5 active:scale-95 dark:hover:bg-white/10"
      style={bounce ? { transform: "scale(1.15)" } : undefined}
    >
      <Icon
        className={
          isActive
            ? "w-[30px] h-[30px] shrink-0"
            : "w-[30px] h-[30px] shrink-0 text-gray-600 opacity-80 transition-opacity duration-200 group-hover:opacity-100 dark:text-white dark:opacity-80 dark:group-hover:opacity-100"
        }
        style={isActive ? { color: accentColor } : undefined}
      />
    </Link>
  );
}

function ProfileTabletNavItem({
  href,
  isActive,
  accentColor,
  avatarUrl,
  fallbackName,
}: {
  href: string;
  isActive: boolean;
  accentColor: string;
  avatarUrl?: string | null;
  fallbackName?: string;
}) {
  const [bounce, setBounce] = useState(false);
  useEffect(() => {
    if (!isActive) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setBounce(true);
    const t = setTimeout(() => setBounce(false), 220);
    return () => clearTimeout(t);
  }, [isActive]);

  const initial = (fallbackName || "?").trim().charAt(0).toUpperCase();

  return (
    <Link
      href={href}
      aria-label="Profile"
      aria-current={isActive ? "page" : undefined}
      className="group flex items-center justify-center transition-transform duration-200 ease-out hover:scale-110 active:scale-95"
      style={bounce ? { transform: "scale(1.15)" } : undefined}
    >
      <span
        className={
          isActive
            ? "flex items-center justify-center rounded-full p-0.5 border-2 transition-colors duration-200"
            : "flex items-center justify-center rounded-full p-0.5 border-2 border-transparent transition-colors duration-200 group-hover:border-gray-300 dark:group-hover:border-gray-500"
        }
        style={isActive ? { borderColor: accentColor } : undefined}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profile"
            width={30}
            height={30}
            className="w-[30px] h-[30px] rounded-full object-cover"
            unoptimized
          />
        ) : (
          <span className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-semibold bg-gray-200 text-gray-600 dark:bg-dark-3 dark:text-white">
            {initial}
          </span>
        )}
      </span>
    </Link>
  );
}
