import React, { useState, useEffect, useRef, useCallback } from "react";
import { ActivityType } from "@/src/lib/types/activityMeta";
import ActivitySelectButton from "@/src/components/goals/ActivityResult";

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}

interface ApiActivity {
  id: number;
  name: string;
  activity_type: ActivityType;
}

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
  onGenerateNew: () => void;
  onStartDrawing: () => void;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

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
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchActivities = useCallback(
    async (pageNumber: number) => {
      if (loading) return;
      if (pageNumber > totalPages) return;

      setLoading(true);

      try {
        const res = await fetch(
          `${baseUrl}/api/v1/activities/?page=${pageNumber}`
        );

        const data = await res.json();

        const mapped: Activity[] = data.results.map(
          (a: ApiActivity): Activity => ({
            id: String(a.id),
            name: a.name,
            type: a.activity_type,
          })
        );

        setActivities((prev) =>
          pageNumber === 1 ? mapped : [...prev, ...mapped]
        );

        setTotalPages(data.total_pages);
        setPage(pageNumber);
      } catch (err) {
        console.error("Failed to fetch activities", err);
      } finally {
        setLoading(false);
      }
    },
    [loading, totalPages]
  );

  // Initial fetch
  useEffect(() => {
    if (!isOpen) return;
    fetchActivities(1);
  }, [isOpen]);

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (loading) return;

      const nearBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 50;

      if (nearBottom && page < totalPages) {
        fetchActivities(page + 1);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [page, totalPages, loading, fetchActivities]);

  if (!isOpen) return null;

  const filteredActivities = activities.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-gray-100 dark:bg-dark-3 dark:border dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
  {/* Header */}
  <div
    className="flex bg-white dark:bg-gray-900 items-center justify-between px-5 pt-5 pb-4 border-b"
    style={{ borderColor: "var(--border)" }}
  >
    <h2 className="text-xl font-bold text-foreground dark:text-white">
      Pick Activity
    </h2>

    <button
      type="button"
      onClick={onClose}
      className="w-9 h-9 flex items-center justify-center rounded-full  transition-all cursor-pointer"
      aria-label="Close"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
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
            className="px-5 pb-4 max-h-[55vh] overflow-y-auto noscrollbar space-y-5"
          >
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                Relevant
              </h3>

              <div className="space-y-2">
                {filteredActivities.map((activity) => (
                  <ActivitySelectButton
                    key={activity.id}
                    activity={activity}
                    onSelect={onSelectActivity}
                  />
                ))}

                {loading && (
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
              onClick={onGenerateNew}
              className="py-3 px-4 rounded-xl font-medium active:opacity-80  text-white bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 transition-all cursor-pointer "
            >
              Generate New
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
