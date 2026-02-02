"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearch } from "@/src/lib/hooks/useSearch";
import { useSearchHistory } from "@/src/lib/hooks/useSearchHistory";
import Link from "next/link";

type FilterType = "posts" | "users" | "activities";

type DiscoverPost = {
  id: number;
  uid: string;
  title: string;
  content: string;
  post_image: string | null;
  created_at: string;
  user?: {
    username: string;
    fullname: string;
    mastery_title: string;
    life_level: number;
  };
};

type DiscoverUser = {
  id: number;
  username: string;
  fullname: string;
  profile_picture: string;
  mastery_title: string;
  life_level: number;
};

type DiscoverActivity = {
  id: number;
  name: string;
  description?: string;
  activity_type: string;
  emoji: string;
  total_xp: number;
  created_by?: {
    username: string;
    fullname: string;
  };
  created_at: string;
};

export default function SearchPage() {
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(["posts", "users", "activities"]);
  const [query, setQuery] = useState("");

  // Recent content state
  const [recentPosts, setRecentPosts] = useState<DiscoverPost[]>([]);
  const [recentUsers, setRecentUsers] = useState<DiscoverUser[]>([]);
  const [recentActivities, setRecentActivities] = useState<DiscoverActivity[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Determine search type based on active filters
  const searchType = useMemo(() => {
    if (activeFilters.length === 0 || activeFilters.length === 3) {
      return "global";
    } else if (activeFilters.length === 1) {
      return activeFilters[0];
    } else {
      return "global"; // Multiple filters selected, use global search
    }
  }, [activeFilters]);

  // Use search hook with current filter
  const {
    results,
    counts,
    pagination,
    isLoading,
    error,
    loadMore,
  } = useSearch({
    query,
    searchType,
    limit: searchType === "global" ? 10 : 20,
    debounceMs: 500,
    autoSaveHistory: true,
  });

  // Search history hook
  const { history, deleteItem, clearAll } = useSearchHistory({
    limit: 10,
    autoFetch: true,
  });

  // Load recent content when component mounts
  useEffect(() => {
    const loadRecentContent = async () => {
      try {
        const [p, u, a] = await Promise.all([
          fetch("/api/discover/posts", { cache: "no-store" }),
          fetch("/api/discover/users", { cache: "no-store" }),
          fetch("/api/discover/activities", { cache: "no-store" }),
        ]);

        const postsData = await p.json();
        const usersData = await u.json();
        const activitiesData = await a.json();

        // Handle paginated response format
        setRecentPosts(postsData.results || postsData.posts || []);
        setRecentUsers(usersData.results || usersData.users || []);
        setRecentActivities(activitiesData.results || activitiesData.activities || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRecent(false);
      }
    };

    loadRecentContent();
  }, []);

  // Filter results based on active filters
  const filteredResults = useMemo(() => {
    if (!query) {
      // Show recent content when no search
      return {
        posts: activeFilters.includes("posts") ? recentPosts : [],
        users: activeFilters.includes("users") ? recentUsers : [],
        activities: activeFilters.includes("activities") ? recentActivities : [],
      };
    }

    // Filter search results based on selected filters
    return {
      posts: activeFilters.includes("posts") ? results.posts : [],
      users: activeFilters.includes("users") ? results.users : [],
      activities: activeFilters.includes("activities") ? results.activities : [],
    };
  }, [activeFilters, results, query, recentPosts, recentUsers, recentActivities]);

  const toggleFilter = (filter: FilterType) => {
    setActiveFilters((prev) => {
      if (prev.includes(filter)) {
        // Remove filter if already selected (but keep at least one selected)
        const newFilters = prev.filter((f) => f !== filter);
        return newFilters.length > 0 ? newFilters : prev;
      } else {
        // Add filter if not selected
        return [...prev, filter];
      }
    });
  };

  const handleSearchQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleHistoryItemClick = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const handleDeleteHistoryItem = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteItem(id);
    } catch (error) {
      console.error("Failed to delete history item:", error);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearAll();
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const hasContent =
    filteredResults.posts.length > 0 ||
    filteredResults.users.length > 0 ||
    filteredResults.activities.length > 0;

  const showEmptyResults = query && !isLoading && !hasContent;
  const showContent = hasContent && !loadingRecent;

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
              value={query}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-row w-max gap-2 mb-6">
            <button
              onClick={() => toggleFilter("posts")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilters.includes("posts")
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Posts
              {query && counts.posts > 0 && (
                <span className="ml-2 text-xs opacity-75">({counts.posts})</span>
              )}
            </button>
            <button
              onClick={() => toggleFilter("users")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilters.includes("users")
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Users
              {query && counts.users > 0 && (
                <span className="ml-2 text-xs opacity-75">({counts.users})</span>
              )}
            </button>
            <button
              onClick={() => toggleFilter("activities")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilters.includes("activities")
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Activities
              {query && counts.activities > 0 && (
                <span className="ml-2 text-xs opacity-75">({counts.activities})</span>
              )}
            </button>
          </div>

          {/* Recent Searches */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Recent
              </h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No recent searches
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleHistoryItemClick(item.search_query)}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg cursor-pointer group"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {item.search_query}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {item.search_type}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {(isLoading || loadingRecent) && !hasContent && (
            <div>
              {/* Skeleton Loaders for Posts */}
              {activeFilters.includes("posts") && (
                <div className="text-left mb-10">
                  <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-4" />
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <div className="h-40 w-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                        <div className="p-3">
                          <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2" />
                          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skeleton Loaders for Users and Activities */}
              {(activeFilters.includes("users") || activeFilters.includes("activities")) && (
                <div className="grid grid-cols-2 gap-6">
                  {/* Users Skeleton */}
                  {activeFilters.includes("users") && (
                    <div className="text-left">
                      <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-3">
                            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
                            <div className="flex-1">
                              <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2" />
                              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities Skeleton */}
                  {activeFilters.includes("activities") && (
                    <div className="text-left">
                      <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-3">
                            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
                            <div className="flex-1">
                              <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2" />
                              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showEmptyResults && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                No results found
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Try different keywords or check your spelling
              </p>
            </div>
          )}

          {/* Search Results / Recent Content */}
          {showContent && (
            <div>
              {/* Posts Results - 3 Column Grid */}
              {filteredResults.posts.length > 0 && (
                <div className="text-left mb-10">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {query ? "Posts" : "Recent Posts"}
                    {query && counts.posts > 0 && (
                      <span className="ml-2 text-sm opacity-70">({counts.posts})</span>
                    )}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {filteredResults.posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/post/${post.uid}`}
                        className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 hover:shadow-lg transition-shadow"
                      >
                        {post.post_image && (
                          <img
                            src={post.post_image}
                            alt={post.title}
                            className="h-40 w-full object-cover"
                          />
                        )}
                        <div className="p-3">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            {post.title}
                          </p>
                          {post.user && (
                            <p className="text-xs opacity-70 text-gray-600 dark:text-gray-400">
                              @{post.user.username}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Users and Activities - Side by Side */}
              {(filteredResults.users.length > 0 || filteredResults.activities.length > 0) && (
                <div className="grid grid-cols-2 gap-6">
                  {/* Users Column */}
                  {filteredResults.users.length > 0 && (
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {query ? "Users" : "Active Users"}
                        {query && counts.users > 0 && (
                          <span className="ml-2 text-sm opacity-70">({counts.users})</span>
                        )}
                      </h3>
                      <div className="space-y-3">
                        {filteredResults.users.map((user) => (
                          <Link
                            key={user.id}
                            href={`/profile/${user.username}`}
                            className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
                          >
                            {user.profile_picture && (
                              <img
                                src={user.profile_picture}
                                alt={user.fullname}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {user.fullname}
                              </p>
                              <p className="text-sm opacity-70 text-gray-600 dark:text-gray-400">
                                @{user.username}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities Column */}
                  {filteredResults.activities.length > 0 && (
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {query ? "Activities" : "Recent Activities"}
                        {query && counts.activities > 0 && (
                          <span className="ml-2 text-sm opacity-70">({counts.activities})</span>
                        )}
                      </h3>
                      <div className="space-y-3">
                        {filteredResults.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
                          >
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                              {activity.emoji}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {activity.name}
                              </p>
                              <p className="text-sm opacity-70 text-gray-600 dark:text-gray-400 capitalize">
                                {activity.activity_type}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Load More Button */}
              {pagination && pagination.has_more && (
                <div className="text-center py-6 mt-6">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
