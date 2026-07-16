"use client";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { mockUser } from "../lib/mock/userData";
import { Navigation } from "./Navigation";
import { SidebarHeader } from "./SidebarHeader";
import getAccentColors from "./UserAccent";

export function Sidebar() {
  const user = mockUser;
  const accent = getAccentColors(user.masteryTitle);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileOpen(false);
    };

    desktopQuery.addEventListener("change", handleDesktopChange);
    return () => desktopQuery.removeEventListener("change", handleDesktopChange);
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = mobileSidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  const closeMobileSidebar = () => setIsMobileOpen(false);
  const closeMobileSidebarAndRestoreFocus = () => {
    closeMobileSidebar();
    menuButtonRef.current?.focus();
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white px-3 dark:border-[var(--border)] dark:bg-dark-2 md:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open navigation"
          aria-controls="mobile-sidebar"
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen(true)}
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 active:scale-[0.98] dark:text-[var(--foreground)] dark:hover:bg-dark-3"
        >
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-[var(--foreground)]">
          GamiLife
        </span>
      </header>

      <div
        aria-hidden="true"
        onClick={closeMobileSidebarAndRestoreFocus}
        className={`fixed inset-0 z-40 bg-gray-950/40 transition-opacity duration-200 motion-reduce:transition-none md:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        ref={mobileSidebarRef}
        id="mobile-sidebar"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-64 flex-col border-r border-gray-200 bg-white px-4 py-2 shadow-xl transition-[transform,visibility] duration-200 ease-out motion-reduce:transition-none dark:border-[var(--border)] dark:bg-dark-2 md:static md:z-auto md:visible md:shrink-0 md:translate-x-0 md:shadow-none ${
          isMobileOpen
            ? "visible translate-x-0"
            : "invisible -translate-x-full"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileSidebarAndRestoreFocus}
          className="absolute right-3 top-3 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 active:scale-[0.98] dark:text-[var(--muted)] dark:hover:bg-dark-3 md:hidden"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
        <SidebarHeader />
        <Navigation
          accentColor={accent.primary}
          onNavigate={closeMobileSidebar}
        />
      </aside>
    </>
  );
}
