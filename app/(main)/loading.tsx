// Mirrors app/(main)/page.tsx's own cold-load skeleton state exactly
// (UserStatusSkeleton x3, PostSkeleton x3, RightSidebarInfoSkeleton,
// RightSidebarNotificationsSkeleton, DiscoverUsersSkeleton) so the
// route-level Suspense fallback and the page's own internal loading state
// are visually identical — no skeleton swap/flicker during the handoff.

function UserStatusSkeleton() {
  return (
    <div className="mb-8 pl-2 md:pl-0 flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-[var(--border)] flex p-3 rounded-xl gap-3 min-w-[200px] max-w-[250px] items-center flex-shrink-0 animate-pulse">
        <div className="p-[1.5px] rounded-full h-14 w-14 aspect-square bg-gray-200 dark:bg-dark-3" />

        <div className="flex flex-col justify-between w-full">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-dark-3 mb-2" />

          <div className="flex items-center gap-2">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-dark-3" />
            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-[var(--border)] rounded-xl p-4 mb-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-dark-3" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-dark-3" />
        </div>
      </div>

      {/* Title & Content */}
      <div className="mb-3">
        <div className="h-5 w-48 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-dark-3 mb-2" />
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-dark-3" />
      </div>

      {/* Post Image */}
      <div className="h-80 w-full rounded-lg bg-gray-200 dark:bg-dark-3 mb-4" />

      {/* XP Distribution */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 h-8 rounded bg-gray-200 dark:bg-dark-3" />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-16 rounded bg-gray-200 dark:bg-dark-3" />
        <div className="h-8 w-16 rounded bg-gray-200 dark:bg-dark-3" />
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

function RightSidebarNotificationsSkeleton() {
  return (
    <div className="bg-white w-full p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-dark-3" />
        <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-dark-3" />
      </div>

      <div className="max-h-80 overflow-y-auto">
        <ul className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <li key={i}>
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-dark-3" />
                <div className="flex flex-col w-full">
                  <div className="h-3 w-40 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
                  <div className="h-3 w-24 rounded bg-gray-200 dark:bg-dark-3" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DiscoverUsersSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-3 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] animate-pulse">
      <div className="h-4 w-44 rounded bg-gray-200 dark:bg-dark-3 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-dark-3" />
            <div className="flex-1">
              <div className="h-3 w-32 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-dark-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex w-full dark:bg-dark-1">
      {/* CENTER FEED */}
      <main className="flex-1 md:w-[90%] lg:w-[60%]  mx-auto md:px-5 overflow-hidden">
        <div
          id="content"
          className="flex-1 min-h-[100vh] pb-16 md:pb-6 py-2 md:py-6 md:px-4 sm:px-6 overflow-y-auto scrollbar-hide h-screen"
        >
          {/* TOP BAR */}
          <div className="mb-8 pl-2 md:pl-0 flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <UserStatusSkeleton />
            <UserStatusSkeleton />
            <UserStatusSkeleton />
          </div>

          {/* POSTS */}
          <div
            id="posts-container"
            className="overflow-hidden scrollbar-hide transition-opacity duration-300"
          >
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <div className="hidden xl:flex flex-col w-[400px] p-6 scrollbar-hide overflow-y-auto h-screen">
        <RightSidebarInfoSkeleton />
        <RightSidebarNotificationsSkeleton />
        <DiscoverUsersSkeleton />
      </div>
    </div>
  );
}
