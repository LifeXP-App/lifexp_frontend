"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrophyIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

import {HomeIcon} from "@heroicons/react/24/solid";

/* ---------------- ICON MAP ---------------- */

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  search: MagnifyingGlassIcon,
  plus: PlusIcon,
  trophy: TrophyIcon,
  user: UserCircleIcon,
  settings: Cog6ToothIcon,
};

/* ---------------- TYPES ---------------- */

interface NavigationItemProps {
  label: string;
  href: string;
  icon: string;
}

/* ---------------- COMPONENT ---------------- */

export function NavigationItem({ label, href, icon }: NavigationItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const IconComponent = ICON_MAP[icon] || XCircleIcon;

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200
        ${
          isActive
            ? "bg-blue-100 dark:bg-blue-950  text-blue-600 dark:text-blue-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
        }
      `}
    >
      <IconComponent className="w-6 h-6 shrink-0" />
      <span className="text-md font-medium">{label}</span>
    </Link>
  );
}
