"use client";

import { useEffect, useState } from "react";

// Sentinel div whose visibility (via IntersectionObserver) triggers loading
// the next page — same pattern as the home feed's FeedLoadMore.
export default function LoadMoreSentinel({
  loading,
  hasMore,
  onLoadMore,
}: {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node || !hasMore) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "600px", threshold: 0 },
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [node, loading, hasMore, onLoadMore]);

  return <div ref={setNode} className="h-1 w-full" />;
}
