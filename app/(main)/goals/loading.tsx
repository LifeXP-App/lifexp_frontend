import { PlayIcon, PlusIcon } from "@heroicons/react/24/solid";

// Mirrors app/(main)/goals/page.tsx's own cold-load skeleton state exactly:
// showGoalsSkeleton true (bypasses the "No goals yet" empty state) renders
// GoalsSectionSkeleton at the same counts per section (Ongoing 2, Planned 2,
// Completed 2, Paused 1, Abandoned 1), and showSidebarSkeleton true renders
// RightSidebarInfoSkeleton (NudgesLikesSection only mounts once sidebarInfo
// has actually loaded, so it isn't part of this state either).

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-black dark:text-[var(--foreground)] mb-3">
      {children}
    </h2>
  );
}

function GoalCardSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-2 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 w-full">
          {/* emoji placeholder */}
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3 mt-1" />

          <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-dark-3" />
        </div>

        {/* meta right */}
        <div className="h-2 w-16 rounded bg-gray-200 dark:bg-dark-3 mt-1" />
      </div>

      {/* description */}
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-dark-3" />
      </div>

      {/* buttons */}
      <div className="mt-6 flex gap-3">
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-dark-3" />
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-dark-3" />
      </div>
    </div>
  );
}

function GoalsSectionSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="mt-6">
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function RightSidebarInfoSkeleton() {
  return (
    <aside className="w-2xl hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] animate-pulse">
        <div className="text-center flex flex-col items-center">
          {/* avatar */}
          <div className="h-24 w-24 aspect-square p-[1.5px] rounded-full bg-gray-200 dark:bg-dark-3 mb-3" />

          {/* fullname */}
          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-dark-3 mb-3" />

          {/* mastery row */}
          <span className="flex gap-2 justify-center items-center">
            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-dark-3" />
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 w-6 mx-auto rounded bg-gray-200 dark:bg-dark-3 mb-2" />
              <div className="h-3 w-14 mx-auto rounded bg-gray-200 dark:bg-dark-3" />
            </div>
          ))}
        </div>

        {/* XP BAR */}
        <div className="w-full relative rounded-full h-4 my-4 ml-1 overflow-hidden bg-gray-200 dark:bg-dark-3">
          <div className="h-6 w-[55%] bg-gray-300 dark:bg-dark-3" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-20 rounded bg-gray-300/80 dark:bg-dark-3/70" />
          </div>
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4 dark:bg-dark-3 dark:bg-opacity-50">
            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-dark-3" />
          </div>

          <div className="bg-gray-100 w-full hidden md:flex flex-col rounded-md items-center justify-between p-4 dark:bg-dark-3 dark:bg-opacity-50">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
            <div className="flex gap-2 items-center">
              <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3" />
              <div className="h-5 w-8 rounded bg-gray-200 dark:bg-dark-3" />
            </div>
          </div>
        </div>
      </div>

      {/* NEXT LEVEL TAB CARD */}
      <div
        id="next-level-tab"
        className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] animate-pulse"
      >
        <div className="flex justify-between mb-6">
          <div className="h-4 w-44 rounded bg-gray-200 dark:bg-dark-3" />
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-dark-3" />
        </div>

        <div className="w-full flex gap-1 items-center">
          <div className="w-full rounded-full h-2.5 ml-1 bg-gray-200 dark:bg-dark-3 overflow-hidden">
            <div className="h-2.5 w-[12%] rounded-full bg-gray-300 dark:bg-dark-3" />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Loading() {
  return (
    <main className="h-screen w-full bg-gray-100 dark:bg-dark-1 overflow-hidden">
      <div className="mx-auto w-full  px-4 py-6">
        <div className="flex w-full gap-6">
          {/* LEFT MAIN CONTENT */}
          <div className="w-full h-screen overflow-scroll noscrollbar py-4 px-6 md:px-12">
            {/* Title */}
            <h1 className="text-xl font-bold text-black dark:text-[var(--foreground)] mb-4">
              Goals
            </h1>

            <div className="flex mt-3 gap-3">
              {/* Create new goal */}
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-200 dark:bg-dark-2 text-black dark:text-[var(--foreground)] font-semibold py-4 px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition cursor-pointer"
              >
                <PlayIcon className="w-5 h-5" />
                <span>Empty Session</span>
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-200 dark:bg-dark-2 text-black dark:text-[var(--foreground)] font-semibold py-4 px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition cursor-pointer"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create New Goal</span>
              </button>
            </div>

            {/* Ongoing */}
            <div className="mt-6">
              <SectionTitle>Ongoing (0)</SectionTitle>
              <GoalsSectionSkeleton count={2} />
            </div>

            {/* Planned */}
            <div className="mt-6">
              <SectionTitle>Planned (0)</SectionTitle>
              <GoalsSectionSkeleton count={2} />
            </div>

            {/* Completed */}
            <div className="mt-6">
              <SectionTitle>Completed (0)</SectionTitle>
              <GoalsSectionSkeleton count={2} />
            </div>

            {/* Paused */}
            <div className="mt-6">
              <SectionTitle>Paused (0)</SectionTitle>
              <GoalsSectionSkeleton count={1} />
            </div>

            {/* Abandoned */}
            <div className="mt-6">
              <SectionTitle>Abandoned (0)</SectionTitle>
              <GoalsSectionSkeleton count={1} />
            </div>

            <div className="h-8" />
          </div>

          {/* RIGHT SIDEBAR (DESKTOP ONLY) */}
          <RightSidebarInfoSkeleton />
        </div>
      </div>
    </main>
  );
}
