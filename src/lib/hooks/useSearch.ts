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
} from "@/src/lib/api/search";
import { useCallback, useEffect, useRef, useState } from "react";

type SearchType = "global" | "posts" | "users" | "activities";

interface UseSearchOptions {
  query: string;
  searchType?: SearchType;
  limit?: number;
  debounceMs?: number;
  autoSaveHistory?: boolean;
}

export function useSearch(options: UseSearchOptions) {
  const {
    query,
    searchType = "global",
    limit = 20,
    debounceMs = 500,
    autoSaveHistory = true,
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
          );

          if (searchId !== activeSearchIdRef.current) {
            return;
          }

          // Log the raw data to debug image loading
          console.log("Global search raw data:", data);

          // Normalize post images and user profile pictures for global search
          const normalizedResults = {
            ...data.results,
            posts: data.results.posts.map((post: any) => {
              console.log("Post image data:", {
                id: post.id,
                post_image: post.post_image,
                post_image_url: post.post_image_url,
              });
              return {
                ...post,
                post_image: post.post_image ?? post.post_image_url ?? null,
              };
            }),
            users: data.results.users.map((user: any) => {
              console.log("User profile picture data:", {
                id: user.id,
                username: user.username,
                profile_picture: user.profile_picture,
                profile_pic: user.profile_pic,
                profile_picture_url: user.profile_picture_url,
              });
              return {
                ...user,
                profile_picture:
                  user.profile_picture ??
                  user.profile_pic ??
                  user.profile_picture_url ??
                  null,
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
          );

          if (searchId !== activeSearchIdRef.current) {
            return;
          }

          const normalizedPosts = data.posts.map((post: any) => ({
            ...post,
            post_image: post.post_image ?? post.post_image_url ?? null,
          }));

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
          );

          if (searchId !== activeSearchIdRef.current) {
            return;
          }

          const normalizedUsers = data.users.map((user: any) => ({
            ...user,
            profile_picture:
              user.profile_picture ??
              user.profile_pic ??
              user.profile_picture_url ??
              null,
          }));

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
          saveSearchHistory(trimmedQuery, searchType).catch(() => {
            // Silently fail if history save fails
          });
        }
      } catch (err: any) {
        if (
          searchId === activeSearchIdRef.current &&
          err.name !== "AbortError"
        ) {
          setError(err.message || "Search failed");
        }
      } finally {
        if (searchId === activeSearchIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [searchType, limit, autoSaveHistory, clearSearchResults],
  );

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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
    [performSearch, debounceMs],
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
  }, [searchType]);

  const loadMore = useCallback(() => {
    if (pagination?.has_more && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(query, nextPage);
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
