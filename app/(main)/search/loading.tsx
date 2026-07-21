// Mirrors app/(main)/search/page.tsx's own cold-load state exactly: empty
// query, no search history yet, all three filters active, and
// (isLoading || loadingRecent) && !hasContent true so the Posts/Users/
// Activities skeleton sections render.

export default function Loading() {
  return (
    <div className="h-screen bg-gray-50 dark:bg-dark-1 overflow-hidden flex">
      {/* Left Column - Search Sidebar */}
      <div className="w-96 border-r border-gray-200 dark:border-[var(--border)]  bg-white dark:bg-dark-2/50 flex flex-col h-screen overflow-y-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[var(--foreground)] mb-6">
            Search
          </h1>

          {/* Search Input */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="🔍 Start Searching..."
              value=""
              readOnly
              className="w-full px-4 py-3 border border-gray-300 dark:border-[var(--border)] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-[var(--foreground)] outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-row w-max gap-2 mb-6">
            <button
              className="px-6 py-2 rounded-full text-sm font-medium transition-colors bg-blue-600 text-white"
            >
              Posts
            </button>
            <button
              className="px-6 py-2 rounded-full text-sm font-medium transition-colors bg-blue-600 text-white"
            >
              Users
            </button>
            <button
              className="px-6 py-2 rounded-full text-sm font-medium transition-colors bg-blue-600 text-white"
            >
              Activities
            </button>
          </div>

          {/* Recent Searches */}
          <div className="pt-6 border-t border-gray-200 dark:border-[var(--border)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-[var(--muted)]">
                Recent
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-[var(--muted)]">
              No recent searches
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div>
            {/* Skeleton Loaders for Posts */}
            <div className="text-left mb-10">
              <div className="h-6 w-32 bg-gray-300 dark:bg-[var(--dark-3)] rounded animate-pulse mb-4" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden bg-gray-100 dark:bg-[var(--dark-1)]"
                  >
                    <div className="h-40 w-full bg-gray-300 dark:bg-[var(--dark-3)] animate-pulse" />
                    <div className="p-3">
                      <div className="h-4 w-3/4 bg-gray-300 dark:bg-[var(--dark-3)] rounded animate-pulse mb-2" />
                      <div className="h-3 w-1/2 bg-gray-200 dark:bg-[var(--dark-2)] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skeleton Loaders for Users and Activities */}
            <div className="grid grid-cols-2 gap-6">
              {/* Users Skeleton */}
              <div className="text-left">
                <div className="h-6 w-32 bg-gray-300 dark:bg-[var(--dark-3)] rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-[var(--dark-3)] rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-300 dark:bg-[var(--dark-3)] rounded animate-pulse mb-2" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-[var(--dark-2)] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities Skeleton */}
              <div className="text-left">
                <div className="h-6 w-32 bg-gray-300 dark:bg-[var(--dark-3)] rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-[var(--dark-3)] rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-300 dark:bg-[var(--dark-3)] rounded animate-pulse mb-2" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-[var(--dark-2)] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
