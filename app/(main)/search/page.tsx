export default function SearchPage() {
  return (
    <div className="h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden flex">
      {/* Left Column - Search Sidebar */}
      <div className="w-96 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] flex flex-col h-screen overflow-y-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Search
          </h1>

          {/* Search Input */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="🔍 Start Searching..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-row w-max gap-2 mb-6">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors text-left">
              Posts
            </button>
            <button className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-left">
              Users
            </button>
            <button className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-left">
              Activities
            </button>
          </div>

          {/* Recent Searches */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Recent
              </h3>
              <button className="text-xs text-red-500 hover:text-red-700 hidden">
                Clear All
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent searches
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Empty State */}
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-blue-500 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Start searching
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-12">
              Find posts, users, and activities
            </p>

            {/* Sample Content */}
            <div>
              <div className="text-left mb-10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Posts
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Active Users
                  </h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
                      >
                        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2" />
                          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Activities
                  </h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
                      >
                        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2" />
                          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
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
    </div>
  );
}
