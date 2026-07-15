import {
  globalSearch,
  saveSearchHistory,
  searchActivities,
  searchPosts,
  searchUsers,
  type Activity,
  type Pagination,
  type Post,
  type User,
} from "@/lib/api/search";
import { useCallback, useEffect, useRef, useState } from "react";

type SearchType = "global" | "posts" | "users" | "activities";

type SearchPostWithImageFallback = Post & {
  post_image_url?: string | null;
};

type SearchUserWithImageFallback = User & {
  profile_pic?: string | null;
  profile_picture_url?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

interface UseSearchOptions {
  query: string;
  searchType?: SearchType;
  limit?: number;
  debounceMs?: number;
  autoSaveHistory?: boolean;
  accessToken?: string | null;
}

export function useSearch(options: UseSearchOptions) {
  const {
    query,
    searchType = "global",
    limit = 20,
    debounceMs = 500,
    autoSaveHistory = true,
    accessToken = null,
  } = options;
  const [results, setResults] = useState<{
    posts: Post[];
    users: User[];
    activities: Activity[];
  }>({ posts: [], users: [], activities: [] });
  const [counts, setCounts] = useState<{
    posts: number;
    users: number;
    activities: number;
  }>({ posts: 0, users: 0, activities: 0 });
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSearchIdRef = useRef(0);

  const clearSearchResults = useCallback(() => {
    setResults({ posts: [], users: [], activities: [] });
    setCounts({ posts: 0, users: 0, activities: 0 });
    setPagination(null);
  }, []);

  const performSearch = useCallback(
    async (searchQuery: string, pageNum: number) => {
      const trimmedQuery = searchQuery.trim();

      if (!trimmedQuery) {
        activeSearchIdRef.current += 1;
        abortControllerRef.current?.abort();
        clearSearchResults();
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!accessToken) {
        activeSearchIdRef.current += 1;
        abortControllerRef.current?.abort();
        clearSearchResults();
        setError(null);
        setIsLoading(false);
        return;
      }

      const searchId = ++activeSearchIdRef.current;

      // Cancel previous request
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        if (searchType === "global") {
          const data = await globalSearch(
            trimmedQuery,
            limit,
            abortController.signal,
            accessToken,
          );

          if (searchId !== activeSearchIdRef.current) {
            return;
          }

          // Normalize post images and user profile pictures for global search
          const normalizedResults = {
            ...data.results,
            posts: data.results.posts.map((post) => {
              const normalizedPost = post as SearchPostWithImageFallback;

              return {
                ...normalizedPost,
                post_image:
                  normalizedPost.post_image ??
                  normalizedPost.post_image_url ??
                  undefined,
              };
            }),
            users: data.results.users.map((user) => {
              const normalizedUser = user as SearchUserWithImageFallback;

              return {
                ...normalizedUser,
                profile_picture:
                  normalizedUser.profile_picture ??
                  normalizedUser.profile_pic ??
                  normalizedUser.profile_picture_url ??
                  undefined,
              };
            }),
          };

          setResults(normalizedResults);
          setCounts(data.counts);
          setPagination(null);
        } else if (searchType === "posts") {
          const data = await searchPosts(
            trimmedQuery,
            pageNum,
            limit,
            abortController.signal,
            accessToken,
          );

          if (searchId !== activeSearchIdRef.current) {
            return;
          }

          const normalizedPosts = data.posts.map((post) => {
            const normalizedPost = post as SearchPostWithImageFallback;

            return {
              ...normalizedPost,
              post_image:
                normalizedPost.post_image ??
                normalizedPost.post_image_url ??
                undefined,
            };
          });

          setResults((prev) => ({
            posts:
              pageNum === 1
                ? normalizedPosts
                : [...prev.posts, ...normalizedPosts],
            users: [],
            activities: [],
          }));
          setPagination(data.pagination);
        } else if (searchType === "users") {
          const data = await searchUsers(
            trimmedQuery,
            pageNum,
            limit,
            abortController.signal,
            accessToken,
          );

          if (searchId !== activeSearchIdRef.current) {
            return;
          }

          const normalizedUsers = data.users.map((user) => {
            const normalizedUser = user as SearchUserWithImageFallback;

            return {
              ...normalizedUser,
              profile_picture:
                normalizedUser.profile_picture ??
                normalizedUser.profile_pic ??
                normalizedUser.profile_picture_url ??
                undefined,
            };
          });

          setResults((prev) => ({
            posts: [],
            users:
              pageNum === 1
                ? normalizedUsers
                : [...prev.users, ...normalizedUsers],
            activities: [],
          }));
          setPagination(data.pagination);
        } else if (searchType === "activities") {
          const data = await searchActivities(
            trimmedQuery,
            undefined,
            pageNum,
            limit,
            abortController.signal,
            accessToken,
          );

          if (searchId !== activeSearchIdRef.current) {
            return;
          }

          setResults((prev) => ({
            posts: [],
            users: [],
            activities:
              pageNum === 1
                ? data.activities
                : [...prev.activities, ...data.activities],
          }));
          setPagination(data.pagination);
        }

        // Save to search history (only on first page)
        if (autoSaveHistory && pageNum === 1) {
          saveSearchHistory(trimmedQuery, searchType, accessToken).catch(() => {
            // Silently fail if history save fails
          });
        }
      } catch (err: unknown) {
        if (
          searchId === activeSearchIdRef.current &&
          !(err instanceof Error && err.name === "AbortError")
        ) {
          setError(getErrorMessage(err, "Search failed"));
        }
      } finally {
        if (searchId === activeSearchIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [searchType, limit, autoSaveHistory, clearSearchResults, accessToken],
  );

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!accessToken) {
        activeSearchIdRef.current += 1;
        abortControllerRef.current?.abort();
        clearSearchResults();
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!searchQuery.trim()) {
        void performSearch("", 1);
        return;
      }

      setIsLoading(true);

      debounceTimerRef.current = setTimeout(() => {
        setPage(1);
        void performSearch(searchQuery, 1);
      }, debounceMs);
    },
    [performSearch, debounceMs, accessToken, clearSearchResults],
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      activeSearchIdRef.current += 1;
      abortControllerRef.current?.abort();
    };
  }, [query, debouncedSearch]);

  // Reset results when search type changes
  useEffect(() => {
    clearSearchResults();
    setPage(1);
    if (query) {
      void performSearch(query, 1);
    }
  }, [searchType, query, performSearch, clearSearchResults]);

  const loadMore = useCallback(() => {
    if (pagination?.has_more && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      void performSearch(query, nextPage);
    }
  }, [pagination, isLoading, page, query, performSearch]);

  const reset = useCallback(() => {
    activeSearchIdRef.current += 1;
    abortControllerRef.current?.abort();
    clearSearchResults();
    setPage(1);
    setError(null);
    setIsLoading(false);
  }, [clearSearchResults]);

  return {
    results,
    counts,
    pagination,
    isLoading,
    error,
    loadMore,
    reset,
  };
}
