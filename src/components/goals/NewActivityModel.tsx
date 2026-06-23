import React, { useState, useEffect, useRef, useCallback } from "react";
import { ActivityType } from "@/src/lib/types/activityMeta";
import ActivitySelectButton, {
  AiSuggestionButton,
} from "@/src/components/goals/ActivityResult";

interface Activity {
  id: string;
  uid?: string;
  pk?: number;
  name: string;
  type: ActivityType;
  total_xp?: number;
  xp_distribution?: Record<string, number>;
}

interface ApiActivity {
  id: number;
  uid?: string;
  name: string;
  description?: string;
  activity_type: ActivityType;
  emoji?: string;
  total_xp?: number;
  xp_distribution?: Record<string, number>;
  created_by?: {
    username: string;
    fullname: string;
    mastery_title: string;
  } | null;
  created_at?: string;
  used_count?: number;
  reasoning?: string;
}

interface ActivitiesPayload {
  activities?: ApiActivity[];
  results?: ApiActivity[];
  total_pages?: number;
  pagination?: {
    page?: number;
    total_pages?: number;
    has_more?: boolean;
  };
}

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
  onGenerateNew: (query: string) => void;
  onStartDrawing: () => void;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

const mapActivity = (activity: ApiActivity): Activity => ({
  id: String(activity.uid ?? activity.id),
  uid: activity.uid ? String(activity.uid) : undefined,
  pk: activity.id,
  name: activity.name,
  type: activity.activity_type,
  total_xp: activity.total_xp,
  xp_distribution: activity.xp_distribution,
});

const getActivitiesFromPayload = (payload: unknown): ApiActivity[] => {
  if (Array.isArray(payload)) return payload as ApiActivity[];

  if (!payload || typeof payload !== "object") return [];

  const data = payload as ActivitiesPayload;

  if (Array.isArray(data.activities)) return data.activities as ApiActivity[];
  if (Array.isArray(data.results)) return data.results as ApiActivity[];

  return [];
};

const getPaginationFromPayload = (
  payload: unknown,
  currentPage: number,
): { totalPages: number; hasMore: boolean } => {
  if (!payload || typeof payload !== "object") {
    return { totalPages: currentPage, hasMore: false };
  }

  const data = payload as ActivitiesPayload;
  const totalPages =
    typeof data.pagination?.total_pages === "number"
      ? data.pagination.total_pages
      : typeof data.total_pages === "number"
        ? data.total_pages
        : currentPage;
  const hasMore =
    typeof data.pagination?.has_more === "boolean"
      ? data.pagination.has_more
      : currentPage < totalPages;

  return { totalPages, hasMore };
};

export default function NewActivityModal({
  isOpen,
  onClose,
  onSelectActivity,
  onGenerateNew,
  onStartDrawing,
}: NewActivityModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchActivities = useCallback(
    async (pageNumber: number, force = false) => {
      if (!force && loadingRef.current) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      loadingRef.current = true;
      setLoading(true);

      try {
        const res = await fetch(
          `${baseUrl}/api/v1/activities/?page=${pageNumber}`
        );

        const data = await res.json();

        const mapped: Activity[] = getActivitiesFromPayload(data).map(mapActivity);
        const pagination = getPaginationFromPayload(data, pageNumber);

        if (requestId === requestIdRef.current) {
          setActivities((prev) =>
            pageNumber === 1 ? mapped : [...prev, ...mapped]
          );

          setHasMore(pagination.hasMore);
          setPage(pageNumber);
        }
      } catch (err) {
        console.error("Failed to fetch activities", err);
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    []
  );

  const searchActivities = useCallback(async (query: string, pageNumber: number) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    loadingRef.current = true;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        q: query,
        page: String(pageNumber),
      });
      const res = await fetch(
        `${baseUrl}/api/v1/search/activities/?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error("Failed to search activities");
      }

      const data = await res.json();
      const results = getActivitiesFromPayload(data);
      const pagination = getPaginationFromPayload(data, pageNumber);

      if (requestId === requestIdRef.current) {
        const mapped = results.map(mapActivity);
        setActivities((prev) =>
          pageNumber === 1 ? mapped : [...prev, ...mapped]
        );
        setPage(pageNumber);
        setHasMore(pagination.hasMore);
      }
    } catch (err) {
      console.error("Failed to search activities", err);
      if (requestId === requestIdRef.current) {
        setActivities([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const query = searchQuery.trim();
    setShowAiSuggestion(false);

    const timeout = window.setTimeout(() => {
      if (query) {
        setPage(1);
        setHasMore(true);
        searchActivities(query, 1);
      } else {
        setPage(1);
        setHasMore(true);
        fetchActivities(1, true);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchQuery, isOpen, searchActivities, fetchActivities]);

  useEffect(() => {
    if (!isOpen) return;

    const query = searchQuery.trim();
    if (!query) {
      setShowAiSuggestion(false);
      return;
    }

    setShowAiSuggestion(false);
    const timeout = window.setTimeout(() => {
      setShowAiSuggestion(true);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [searchQuery, isOpen]);

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (loading) return;

      const nearBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 50;

      if (nearBottom && hasMore) {
        const query = searchQuery.trim();
        if (query) {
          searchActivities(query, page + 1);
        } else {
          fetchActivities(page + 1);
        }
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, searchQuery, loading, fetchActivities, searchActivities]);

  if (!isOpen) return null;

  const filteredActivities = activities;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasExactSearchMatch =
    normalizedSearchQuery.length > 0 &&
    filteredActivities.some(
      (activity) => activity.name.trim().toLowerCase() === normalizedSearchQuery,
    );
  const shouldShowAiSuggestion =
    showAiSuggestion && normalizedSearchQuery.length > 0 && !hasExactSearchMatch;
  const sectionTitle = normalizedSearchQuery ? "Search results" : "Relevant";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-gray-100 dark:bg-dark-3 dark:border dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-lg h-[78vh] max-h-[720px] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}>
  {/* Header */}
  <div
    className="flex bg-white dark:bg-gray-900 items-center  px-5 pt-5 pb-4 border-b"
    style={{ borderColor: "var(--border)" }}
  >
    <h2 className="text-xl font-bold text-foreground dark:text-white">
      Pick Activity
    </h2>

 
  </div>

  {/* Search */}
  <div className="p-5 pb-3">
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    <div className="relative mb-4">
            <input
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
              type="text"
              placeholder="🔍  Start Searching..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            />
          </div>
      
    </div>
  </div>



        {/* Content */}
          <div
            ref={scrollRef}
            className="px-5 pb-4 flex-1 overflow-y-auto noscrollbar space-y-5"
          >
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                {sectionTitle}
              </h3>

              <div className="space-y-2">
                {filteredActivities.map((activity) => (
                  <ActivitySelectButton
                    key={activity.id}
                    activity={activity}
                    onSelect={onSelectActivity}
                  />
                ))}

                {shouldShowAiSuggestion && (
                  <AiSuggestionButton
                    query={searchQuery}
                    onSelect={() => onGenerateNew(searchQuery.trim())}
                  />
                )}

                {loading && (hasMore || page === 1) && (
                      <div className="space-y-2 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 px-3 py-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-700"
                          >
                            {/* Emoji circle */}
                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />

                            {/* Text area */}
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-40 bg-gray-300 dark:bg-gray-700 rounded" />
                              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                            </div>

                            {/* XP badge placeholder */}
                            <div className="w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full" />
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="p-5 pt-3 grid grid-cols-2 gap-3 border-t bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl font-medium active:opacity-80  text-white bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 transition-all cursor-pointer "
            >
              Close
            </button>

            <button
              onClick={onStartDrawing}
              className="py-3 px-4 rounded-xl font-medium active:opacity-80  text-white transition-all cursor-pointer "
              style={{ backgroundColor: "var(--rookie-primary)" }}
            >
              Start Drawing
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
