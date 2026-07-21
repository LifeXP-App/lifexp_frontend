import Link from "next/link";

// Mirrors app/(main)/leaderboard/goals/[goalId]/page.tsx's own cold-load
// state exactly: currentMastery is null right after mount, so the main
// column renders HeaderSkeleton (10x PlayerRowSkeleton), the sidebar's
// "Mastery card" block doesn't render at all (gated on `currentMastery &&`),
// currentUser is null so the sidebar's animate-pulse fallback card renders,
// and LeaderboardSwitcher (no internal loading state; its own pre-fetch
// render with counts defaulting to 0) is reproduced statically since it has
// no "use client" directive of its own and can't be safely rendered from
// this Server Component boundary.

const MASTERY_TYPES = [
  { id: "warrior", name: "Warrior", aspect: "Physique", color: "#8d2e2e" },
  { id: "protagonist", name: "Protagonist", aspect: "Energy", color: "#c49352" },
  { id: "alchemist", name: "Alchemist", aspect: "Logic", color: "#4f6b8f" },
  { id: "prodigy", name: "Prodigy", aspect: "Creativity", color: "#7a4f9e" },
  { id: "diplomat", name: "Diplomat", aspect: "Social", color: "#3f7d5c" },
];

function PlayerRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-dark-2 border border-gray-100 dark:border-[var(--border)] animate-pulse mb-1">
      {/* Rank */}
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[var(--dark-3)]" />

      {/* Avatar */}
      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-[var(--dark-3)]" />

      {/* Name */}
      <div className="flex-1">
        <div className="h-4 w-32 bg-gray-200 dark:bg-[var(--dark-3)] rounded mb-2" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-[var(--dark-3)] rounded" />
      </div>

      {/* XP */}
      <div className="text-right">
        <div className="h-4 w-20 bg-gray-200 dark:bg-[var(--dark-3)] rounded mb-1" />
        <div className="h-3 w-8 bg-gray-200 dark:bg-[var(--dark-3)] rounded ml-auto" />
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="w-full md:w-[calc(100%-450px)] relative flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-1">
      <div className="relative overflow-visible">
        <div className="relative px-4 md:px-12 py-8 animate-pulse">
          {/* Icon and title skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-[var(--dark-3)]" />
            <div>
              <div className="h-8 w-40 bg-gray-200 dark:bg-[var(--dark-3)] rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-[var(--dark-3)] rounded" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="flex gap-6">
            <div className="w-36 h-20 rounded-xl bg-gray-200 dark:bg-[var(--dark-3)]" />
            <div className="w-36 h-20 rounded-xl bg-gray-200 dark:bg-[var(--dark-3)]" />
          </div>
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="px-4 md:px-12 py-2">
        {/* Search bar skeleton */}
        <div className="mb-6">
          <div className="w-full h-12 rounded-2xl bg-gray-200 dark:bg-[var(--dark-3)]" />
        </div>

        {/* Player rows skeleton */}
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <PlayerRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardSwitcherStatic() {
  return (
    <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border border-gray-200 dark:border-[var(--border)]">
      <h4 className="font-semibold text-lg mb-4 dark:text-[var(--foreground)]">
        Other Leaderboards
      </h4>

      <div className="space-y-2">
        {MASTERY_TYPES.map((mastery) => (
          <Link key={mastery.id} href={`/leaderboard/goals/${mastery.id}`}>
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-3 cursor-pointer transition-all group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                style={{ backgroundColor: `${mastery.color}15` }}
              />

              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-[var(--foreground)]">
                  {mastery.name}
                </p>
                <p className="text-xs text-gray-500">{mastery.aspect}</p>
              </div>

              <span
                className="text-xs font-medium"
                style={{ color: mastery.color }}
              >
                0
              </span>
            </div>
          </Link>
        ))}

        {/* Rookie */}
        <Link href="/leaderboard/rookie">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-3 cursor-pointer transition-all group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{ backgroundColor: "#64748b15" }}
            />

            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-[var(--foreground)]">
                Rookie
              </p>
              <p className="text-xs text-gray-500">All Aspects</p>
            </div>

            <span className="text-xs font-medium text-gray-500">0</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="flex w-full min-h-screen">
      {/* Main leaderboard list */}
      <HeaderSkeleton />

      {/* Sidebar (Desktop) */}
      <aside className="w-[450px] p-6 overflow-auto hidden md:block h-screen bg-gray-50 dark:bg-dark-1">
        {/* User profile card skeleton */}
        <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border border-gray-200 dark:border-[var(--border)] animate-pulse">
          <div className="text-center flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-[var(--dark-3)] mb-2" />
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-[var(--dark-3)] mb-2" />
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-[var(--dark-3)]" />
          </div>
        </div>

        {/* Other leaderboards */}
        <LeaderboardSwitcherStatic />
      </aside>
    </main>
  );
}
