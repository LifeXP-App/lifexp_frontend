// Mirrors app/(main)/goals/[goalId]/page.tsx's own `if (loading)` skeleton
// return exactly (header skeleton, mobile layout skeleton, desktop layout
// skeleton).

export default function Loading() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header Skeleton */}
      <div
        className="bg-white dark:bg-dark-2 sticky top-0 z-10 border-b px-6 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-dark-3 animate-pulse" />
          <div className="h-6 w-48 rounded bg-gray-200 dark:bg-dark-3 animate-pulse" />

          </div>

          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-dark-3 animate-pulse" />
        </div>
      </div>

      {/* Mobile Layout Skeleton */}
      <div className="block lg:hidden px-6 py-6 space-y-6 animate-pulse">
        {/* Description */}
        <div className="space-y-3">
          <div className="h-4 w-40 bg-gray-200 dark:bg-dark-3 rounded" />
          <div className="h-4 w-full bg-gray-200 dark:bg-dark-3 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-dark-3 rounded" />
        </div>

        {/* Stats */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-gray-200 dark:bg-dark-3 rounded" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-dark-3 rounded" />
            </div>
          ))}
        </div>

        {/* Aspect Chips */}
        <div className="flex justify-around">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-14 h-8 bg-gray-200 dark:bg-dark-3 rounded-full"
            />
          ))}
        </div>

        {/* Session Cards */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-4 p-4 bg-white dark:bg-dark-2 rounded-2xl border"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-dark-3" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-32 bg-gray-200 dark:bg-dark-3 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-dark-3 rounded" />
              <div className="h-3 w-40 bg-gray-200 dark:bg-dark-3 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Layout Skeleton */}
      <div className="hidden lg:flex gap-6 px-6 py-6 animate-pulse">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 p-4 bg-white dark:bg-dark-2 rounded-2xl border"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-dark-3" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 bg-gray-200 dark:bg-dark-3 rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-dark-3 rounded" />
                <div className="h-3 w-40 bg-gray-200 dark:bg-dark-3 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar */}
        <div
          style={{ width: "450px",borderColor: "var(--border)" }}
          className="bg-white dark:bg-dark-2 rounded-2xl p-6 border space-y-6"
        >
          <div className="h-[220px] bg-gray-200 dark:bg-dark-3 rounded-xl" />
          <div className="flex justify-around">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-14 h-8 bg-gray-200 dark:bg-dark-3 rounded-full"
              />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-4 w-40 bg-gray-200 dark:bg-dark-3 rounded" />
            <div className="h-4 w-full bg-gray-200 dark:bg-dark-3 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-dark-3 rounded" />
            <div className="h-4 w-40 bg-gray-200 dark:bg-dark-3 rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-dark-3 rounded" />
          </div>
           <div className="space-y-4">
            <div className="h-8 w-full bg-gray-200 dark:bg-dark-3 rounded" />
            <div className="h-8 w-full bg-gray-200 dark:bg-dark-3 rounded" />
            <div className="h-8 w-full bg-gray-200 dark:bg-dark-3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
