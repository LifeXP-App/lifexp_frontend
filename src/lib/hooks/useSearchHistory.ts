import {
  clearSearchHistory,
  deleteSearchHistoryItem,
  getSearchHistory,
  type SearchHistoryItem,
} from "@/lib/api/search";
import { useCallback, useEffect, useState } from "react";

type SearchType = "global" | "posts" | "users" | "activities";

interface UseSearchHistoryOptions {
  limit?: number;
  type?: SearchType;
  autoFetch?: boolean;
  accessToken?: string | null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useSearchHistory(options: UseSearchHistoryOptions = {}) {
  const { limit = 20, type, autoFetch = true, accessToken = null } = options;

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!accessToken) {
      setHistory([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSearchHistory(limit, type, accessToken);
      setHistory(data.search_history);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch search history"));
    } finally {
      setIsLoading(false);
    }
  }, [limit, type, accessToken]);

  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [autoFetch, fetchHistory]);

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        if (!accessToken) {
          throw new Error("Not authenticated");
        }

        await deleteSearchHistoryItem(id, accessToken);
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to delete search history item"));
        throw err;
      }
    },
    [accessToken],
  );

  const clearAll = useCallback(
    async (filterType?: string) => {
      try {
        if (!accessToken) {
          throw new Error("Not authenticated");
        }

        await clearSearchHistory(filterType, accessToken);
        setHistory([]);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to clear search history"));
        throw err;
      }
    },
    [accessToken],
  );

  const refresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    deleteItem,
    clearAll,
    refresh,
  };
}
