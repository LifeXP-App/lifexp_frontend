"use client";

import { FaLinkedin, FaSquareWhatsapp } from "react-icons/fa6";

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  heading: string;
  accentColor: string;
}

// Shared by the profile page ("Share Profile") and goal detail page ("Share
// Goal") — identical copy-link + social-share card, just the heading/url/
// accent differ per caller.
export default function SharePopup({
  isOpen,
  onClose,
  url,
  heading,
  accentColor,
}: SharePopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 ">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-[var(--border)] p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-[var(--foreground)]">
            {heading}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer dark:hover:text-[var(--foreground)]"
          >
            ✕
          </button>
        </div>

        {/* Link box */}
        <div className="mb-4 text-gray-600 dark:text-[var(--muted)] flex gap-2 w-full">
          <div className="flex items-center gap-2 w-full bg-gray-100 dark:bg-dark-3 border border-gray-200 dark:border-[var(--border)] rounded-lg p-2 ">
            <p className="text-md active:opacity-75 m-2 truncate text-gray-700 dark:text-[var(--muted)] flex-1">
              {url}
            </p>

            <button
              onClick={(e) => {
                navigator.clipboard.writeText(url);
                const button = e.currentTarget;
                button.textContent = "Copied!";
                button.setAttribute("disabled", "true");
                setTimeout(() => {
                  button.textContent = "Copy";
                  button.removeAttribute("disabled");
                }, 2000);
              }}
              className="text-sm font-medium  py-1 disabled:opacity-50 w-18 h-full rounded-full cursor-pointer active:opacity-75 text-white"
              style={{ backgroundColor: accentColor }}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}
            target="_blank"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[var(--border)] hover:bg-gray-100 dark:hover:bg-dark-3 transition"
          >
            <span className="text-xl">𝕏</span>
            <span className="text-xs mt-1 text-gray-600 dark:text-[var(--muted)]">
              X
            </span>
          </a>

          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
            target="_blank"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[var(--border)] hover:bg-gray-100 dark:hover:bg-dark-3 transition"
          >
            <FaLinkedin className="w-8 h-8 fill-blue-500" />
            <span className="text-xs mt-1 text-gray-600 dark:text-[var(--muted)]">
              LinkedIn
            </span>
          </a>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(url)}`}
            target="_blank"
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[var(--border)] hover:bg-gray-100 dark:hover:bg-dark-3 transition"
          >
            <FaSquareWhatsapp className="w-8 h-8 fill-green-700" />
            <span className="text-xs mt-1 text-gray-600 dark:text-[var(--muted)]">
              WhatsApp
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
