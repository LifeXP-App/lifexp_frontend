"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface PaginationProps {
  page: number; // 1-based
  totalPages: number;
  onChange: (page: number) => void;
  color: string; // accent for the current page
  disabled?: boolean;
}

// Pages to show: first, last, and a window around the current page, with
// gaps collapsed to "…".
function visiblePages(page: number, total: number): (number | "gap")[] {
  const wanted = new Set([1, total, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const base =
  "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";

export default function Pagination({ page, totalPages, onChange, color, disabled }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={`${base} text-gray-500 hover:bg-gray-200 dark:text-[var(--muted)] dark:hover:bg-dark-3`}
      >
        <ChevronLeftIcon className="h-4 w-4" strokeWidth={2.5} />
      </button>

      {visiblePages(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-gray-400 dark:text-[var(--muted)]">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            disabled={disabled}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${
              p === page
                ? "text-white"
                : "text-gray-500 hover:bg-gray-200 dark:text-[var(--muted)] dark:hover:bg-dark-3"
            }`}
            style={p === page ? { backgroundColor: color } : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
        className={`${base} text-gray-500 hover:bg-gray-200 dark:text-[var(--muted)] dark:hover:bg-dark-3`}
      >
        <ChevronRightIcon className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </nav>
  );
}
