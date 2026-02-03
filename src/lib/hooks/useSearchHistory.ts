import { useState, useEffect, useCallback } from "react";
import {
  getSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory,
  type SearchHistoryItem,
} from "@/lib/api/search";

type SearchType = "global" | "posts" | "users" | "activities";

interface UseSearchHistoryOptions {
  limit?: number;
  type?: SearchType;
  autoFetch?: boolean;
}

export function useSearchHistory(options: UseSearchHistoryOptions = {}) {
  const { limit = 20, type, autoFetch = true } = options;

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSearchHistory(limit, type);
      setHistory(data.search_history);
    } catch (err: any) {
      setError(err.message || "Failed to fetch search history");
    } finally {
      setIsLoading(false);
    }
  }, [limit, type]);

  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [autoFetch, fetchHistory]);

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        await deleteSearchHistoryItem(id);
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } catch (err: any) {
        setError(err.message || "Failed to delete search history item");
        throw err;
      }
    },
    []
  );

  const clearAll = useCallback(
    async (filterType?: string) => {
      try {
        await clearSearchHistory(filterType);
        setHistory([]);
      } catch (err: any) {
        setError(err.message || "Failed to clear search history");
        throw err;
      }
    },
    []
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
