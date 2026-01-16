"use client";

import {
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrophyIcon,
  UserCircleIcon,
  XCircleIcon,
  SquaresPlusIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HomeIcon } from "@heroicons/react/24/solid";
import { hexToRgba } from "./UserAccent";

/* ---------------- ICON MAP ---------------- */

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  squares: SquaresPlusIcon,
  search: MagnifyingGlassIcon,

  trophy: TrophyIcon,
  user: UserCircleIcon,
  settings: Cog6ToothIcon,
};

/* ---------------- TYPES ---------------- */

interface NavigationItemProps {
  label: string;
  href: string;
  active: string[];
  icon: string;
  accentColor?: string;
}

/* ---------------- COMPONENT ---------------- */

export function NavigationItem({
  label,
  href,
  active,
  icon,
  accentColor = "#4168e2",
}: NavigationItemProps) {
  const pathname = usePathname();
  const isActive = active.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const IconComponent = ICON_MAP[icon] || XCircleIcon;

  const masteryTitle = "Rookie"

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200"
      style={
        isActive
          ? {
              backgroundColor: hexToRgba(accentColor, 0.25),
              color: accentColor,
            }
          : undefined
      }
    >
      <span
        className={isActive ? "" : "text-gray-600 dark:text-gray-400"}
      >
        <IconComponent className="w-6 h-6 shrink-0" />
      </span>
      <span
        className={`text-md font-medium ${
          isActive ? "" : "text-gray-600  dark:text-gray-400"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
