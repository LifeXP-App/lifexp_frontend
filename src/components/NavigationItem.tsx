'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';

interface NavigationItemProps {
  label: string;
  href: string;
  icon: string;
}

export function NavigationItem({ label, href, icon }: NavigationItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const IconComponent = (Icons as any)[icon] || Icons.Circle;

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'
        }
      `}
    >
      <IconComponent className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}
