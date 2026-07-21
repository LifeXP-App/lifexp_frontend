import Link from "next/link";

// Mirrors app/(main)/leaderboard/rookie/page.tsx's own cold-load state
// exactly: `loading` true right after mount (10x LeaderboardRowSkeleton),
// and showSidebarSkeleton true (authLoading/userLoading/no `me` yet) so
// RightSidebarInfoSkeleton renders instead of the real profile card.
// LeaderboardSwitcher itself has no internal loading state — its own
// pre-fetch render (counts default to 0) is reproduced statically here
// since it has no "use client" directive of its own and can't be safely
// rendered from this Server Component boundary.

const MASTERY_TYPES = [
  { id: "warrior", name: "Warrior", aspect: "Physique", color: "#8d2e2e" },
  { id: "protagonist", name: "Protagonist", aspect: "Energy", color: "#c49352" },
  { id: "alchemist", name: "Alchemist", aspect: "Logic", color: "#4f6b8f" },
  { id: "prodigy", name: "Prodigy", aspect: "Creativity", color: "#7a4f9e" },
  { id: "diplomat", name: "Diplomat", aspect: "Social", color: "#3f7d5c" },
];

function LeaderboardRowSkeleton() {
  return (
    <div className="flex justify-between items-center w-full px-5 py-4 rounded-xl bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-[var(--border)] animate-pulse">
      <div className="flex items-center gap-4">
        {/* rank */}
        <div className="w-5 flex justify-center">
          <div className="h-4 w-3 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
        </div>

        {/* avatar */}
        <div className="h-10 w-10 rounded-full p-[1.5px] bg-gray-200 dark:bg-[var(--dark-2)]">
          <div className="h-full w-full rounded-full bg-gray-300 dark:bg-[var(--dark-3)]" />
        </div>

        {/* name + subtitle */}
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
          <div className="h-3 w-20 rounded bg-gray-200/70 dark:bg-[var(--dark-2)]/70" />
        </div>
      </div>

      {/* XP block */}
      <div className="flex flex-col items-end gap-2">
        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
        <div className="h-3 w-12 rounded bg-gray-200/70 dark:bg-[var(--dark-2)]/70" />
      </div>
    </div>
  );
}

function RightSidebarInfoSkeleton() {
  return (
    <aside className="w-full hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] animate-pulse">
        <div className="text-center flex flex-col items-center">
          {/* avatar */}
          <div className="h-24 w-24 aspect-square p-[1.5px] rounded-full bg-gray-200 dark:bg-[var(--dark-2)] mb-3" />

          {/* fullname */}
          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-3" />

          {/* mastery row */}
          <span className="flex gap-2 justify-center items-center">
            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 w-6 mx-auto rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-2" />
              <div className="h-3 w-14 mx-auto rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            </div>
          ))}
        </div>

        {/* XP BAR */}
        <div className="w-full relative rounded-full h-4 my-4 ml-1 overflow-hidden bg-gray-200 dark:bg-[var(--dark-2)]">
          <div className="h-6 w-[55%] bg-gray-300 dark:bg-[var(--dark-3)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-20 rounded bg-gray-300/80 dark:bg-[var(--dark-3)]/70" />
          </div>
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4 dark:bg-[var(--dark-1)] dark:bg-opacity-50">
            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-2" />
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
          </div>

          <div className="bg-gray-100 w-full hidden md:flex flex-col rounded-md items-center justify-between p-4 dark:bg-[var(--dark-1)] dark:bg-opacity-50">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-2" />
            <div className="flex gap-2 items-center">
              <div className="h-4 w-4 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
              <div className="h-5 w-8 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            </div>
          </div>
        </div>
      </div>

      {/* NEXT LEVEL TAB CARD */}
    </aside>
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
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="flex w-full overflow-hidden h-screen bg-gray-50 dark:bg-dark-1">
      {/* Main leaderboard */}
      <div className="w-full md:w-[calc(100%-450px)] relative noscrollbar flex-1 overflow-auto py-4 px-4 md:py-8 md:px-12">
        <div className="flex justify-between items-center w-full mb-8">
          <h1 className="text-2xl font-bold dark:text-[var(--foreground)]">Rookies</h1>
          <span
            style={{
              backgroundColor: "rgba(var(--rookie-primary-rgb), 0.2)",
              color: "var(--rookie-primary)",
            }}
            className="text-sm font-semibold px-4 py-2 rounded-full"
          >
            0-9999 XP
          </span>
        </div>

        <div className="space-y-2 transition-opacity duration-200">
          {Array.from({ length: 10 }).map((_, i) => (
            <LeaderboardRowSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Profile sidebar */}
      <aside className="w-[450px] p-6 overflow-auto hidden md:block h-screen">
        <RightSidebarInfoSkeleton />

        <LeaderboardSwitcherStatic />
      </aside>
    </main>
  );
}
