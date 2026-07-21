import {
  globalSearch,
  saveSearchHistory,
  searchActivities,
  searchPosts,
  searchUsers,
  type ActivitiesSearchResult,
  type Pagination,
  type Post,
  type PostsSearchResult,
  type User,
  type UsersSearchResult,
} from "@/lib/api/search";
import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

// Global search and posts/users search each normalize alternative image field
// names the backend sends — same normalization the old hook applied.
function normalizePosts(posts: Post[] | undefined | null): Post[] {
  return (posts ?? []).map((post) => {
    const p = post as SearchPostWithImageFallback;
    return {
      ...p,
      post_image: p.post_image ?? p.post_image_url ?? undefined,
    };
  });
}

function normalizeUsers(users: User[] | undefined | null): User[] {
  return (users ?? []).map((user) => {
    const u = user as SearchUserWithImageFallback;
    return {
      ...u,
      profile_picture:
        u.profile_picture ?? u.profile_pic ?? u.profile_picture_url ?? undefined,
    };
  });
}

// Debounces `value`, except clearing to empty is applied immediately (so the
// results list clears the instant the query is cleared, matching the old
// hook's `if (!trimmedQuery) performSearch("", 1)` fast path).
function useDebouncedSearchValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (!value.trim()) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
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

  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedSearchValue(trimmedQuery, debounceMs);
  const isDebouncing = trimmedQuery !== "" && trimmedQuery !== debouncedQuery;

  const queryClient = useQueryClient();
  const enabled = Boolean(debouncedQuery && accessToken);

  // ── Global search: single fetch across posts/users/activities, no pagination ──
  const globalQuery = useQuery({
    queryKey: ["search", "global", debouncedQuery, limit],
    queryFn: ({ signal }) =>
      globalSearch(debouncedQuery, limit, signal, accessToken),
    enabled: enabled && searchType === "global",
    // Keyed by exact query string already, so re-running/revisiting the same
    // search within a minute is a cache hit instead of a new request.
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    // The query key changes on every keystroke (it embeds debouncedQuery),
    // which React Query otherwise treats as a brand new query with no data —
    // this keeps the previous query's results on screen while the new one
    // fetches, instead of flashing back to empty/skeleton each time.
    placeholderData: keepPreviousData,
  });

  // ── Single-domain paginated search (posts/users/activities) ──
  const infiniteQuery = useInfiniteQuery<
    PostsSearchResult | UsersSearchResult | ActivitiesSearchResult
  >({
    queryKey: ["search", "paginated", searchType, debouncedQuery, limit],
    queryFn: ({ pageParam, signal }) => {
      const page = pageParam as number;
      if (searchType === "posts") {
        return searchPosts(debouncedQuery, page, limit, signal, accessToken);
      }
      if (searchType === "users") {
        return searchUsers(debouncedQuery, page, limit, signal, accessToken);
      }
      return searchActivities(debouncedQuery, undefined, page, limit, signal, accessToken);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.pagination.has_more ? allPages.length + 1 : undefined,
    enabled: enabled && searchType !== "global",
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    // Same reasoning as globalQuery above — keep showing the previous
    // search term's results while the new term's first page loads.
    placeholderData: keepPreviousData,
  });

  // Save to history once per (searchType, query) pair, only after results land —
  // mirrors the old hook's "only save on first page success" behavior.
  const historySavedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSaveHistory || !debouncedQuery || !accessToken) return;

    const hasData =
      searchType === "global" ? globalQuery.data !== undefined : infiniteQuery.data !== undefined;
    if (!hasData) return;

    const key = `${searchType}:${debouncedQuery}`;
    if (historySavedForRef.current === key) return;
    historySavedForRef.current = key;

    saveSearchHistory(debouncedQuery, searchType, accessToken).catch(() => {
      // Silently fail if history save fails
    });
  }, [autoSaveHistory, debouncedQuery, accessToken, searchType, globalQuery.data, infiniteQuery.data]);

  const results = useMemo(() => {
    if (!debouncedQuery) {
      return { posts: [], users: [], activities: [] };
    }

    if (searchType === "global") {
      const data = globalQuery.data;
      if (!data) return { posts: [], users: [], activities: [] };
      return {
        posts: normalizePosts(data.results.posts),
        users: normalizeUsers(data.results.users),
        activities: data.results.activities ?? [],
      };
    }

    const pages = infiniteQuery.data?.pages ?? [];
    if (searchType === "posts") {
      return {
        posts: normalizePosts(pages.flatMap((p) => ("posts" in p ? p.posts : []))),
        users: [],
        activities: [],
      };
    }
    if (searchType === "users") {
      return {
        posts: [],
        users: normalizeUsers(pages.flatMap((p) => ("users" in p ? p.users : []))),
        activities: [],
      };
    }
    return {
      posts: [],
      users: [],
      activities: pages.flatMap((p) => ("activities" in p ? p.activities : [])),
    };
  }, [debouncedQuery, searchType, globalQuery.data, infiniteQuery.data]);

  const counts =
    searchType === "global" && globalQuery.data
      ? globalQuery.data.counts
      : { posts: 0, users: 0, activities: 0 };

  const pagination: Pagination | null =
    searchType === "global"
      ? null
      : (infiniteQuery.data?.pages[infiniteQuery.data.pages.length - 1]?.pagination ?? null);

  // Loading covers the debounce window too (the old hook set isLoading the
  // instant a keystroke happened, not just once the network request began),
  // plus initial fetch and "load more" fetches.
  const isLoading =
    isDebouncing || (searchType === "global" ? globalQuery.isFetching : infiniteQuery.isFetching);

  const queryError = searchType === "global" ? globalQuery.error : infiniteQuery.error;
  const error = debouncedQuery && queryError ? getErrorMessage(queryError, "Search failed") : null;

  const loadMore = useCallback(() => {
    if (searchType === "global") return;
    if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      infiniteQuery.fetchNextPage();
    }
  }, [searchType, infiniteQuery]);

  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["search"] });
    historySavedForRef.current = null;
  }, [queryClient]);

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
