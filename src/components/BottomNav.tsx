"use client";

import {
  HomeIcon,
  MagnifyingGlassIcon,
  SquaresPlusIcon,
  BellIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

type BottomNavItem = {
  label: string;
  href: string;
  active: string[];
  Icon: React.ComponentType<{ className?: string }>;
};

// Mobile-only bottom nav — replaces the hamburger drawer on small viewports.
// Icon order is fixed per spec: feed, search, goals, notifications, profile.
export function BottomNav() {
  const pathname = usePathname();
  const { me, supabaseUser } = useAuth();
  const username = me?.username ?? supabaseUser?.user_metadata?.username;

  const NAV_ITEMS: BottomNavItem[] = [
    { label: "Feed", href: "/", active: ["/"], Icon: HomeIcon },
    { label: "Search", href: "/search", active: ["/search"], Icon: MagnifyingGlassIcon },
    { label: "Goals", href: "/goals", active: ["/goals", "/a"], Icon: SquaresPlusIcon },
    {
      label: "Notifications",
      href: "/notifications",
      active: ["/notifications"],
      Icon: BellIcon,
    },
    {
      label: "Profile",
      href: username ? `/u/${username}` : "/settings",
      active: ["/u"],
      Icon: UserCircleIcon,
    },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center border-t border-gray-200 bg-white dark:border-[var(--border)] dark:bg-dark-2 md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.active.some(
          (path) => pathname === path || pathname.startsWith(path + "/"),
        );
        const Icon = item.Icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-1 h-full items-center justify-center transition-opacity ${
              isActive
                ? "opacity-100"
                : "opacity-40 hover:opacity-70 active:opacity-70"
            }`}
          >
            <Icon className="h-7 w-7 text-black dark:text-[var(--foreground)]" />
          </Link>
        );
      })}
    </nav>
  );
}
