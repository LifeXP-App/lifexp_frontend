"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import { useAuth } from "@/src/context/AuthContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { useMasteryPrimaryColor } from "@/src/lib/hooks/useMasteryAccent";
import { ARTIFACT_META, type Artifact, type ArtifactType } from "@/src/lib/types/artifact";
import { ArtifactCard, NewArtifactCard } from "@/src/components/artifacts/ArtifactCard";

const NewArtifactModal = dynamic(() => import("@/src/components/artifacts/NewArtifactModal"));
const ArtifactPopup = dynamic(() => import("@/src/components/artifacts/ArtifactPopup"));

type Filter = "all" | ArtifactType;
const FILTERS: Filter[] = ["all", "image", "audio", "text"];

export default function ArtifactsPage() {
  const { me, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const primaryColor = useMasteryPrimaryColor();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [openArtifact, setOpenArtifact] = useState<Artifact | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const { data: artifacts = [], isLoading } = useQuery({
    queryKey: ["artifacts", debouncedSearch, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ page_size: "100" });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filter !== "all") params.set("type", filter);
      const res = await authedFetch(`/api/artifacts?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch artifacts");
      const data = await res.json();
      return (Array.isArray(data.results) ? data.results : []) as Artifact[];
    },
    enabled: !authLoading && !!me,
    staleTime: 30 * 1000,
  });

  const showSkeleton = isLoading && artifacts.length === 0;
  const isFiltering = !!debouncedSearch || filter !== "all";

  return (
    <main className="min-h-screen w-full bg-gray-100 dark:bg-dark-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
        <h1 className="text-xl font-bold text-black dark:text-[var(--foreground)] mb-4">
          Artifacts
        </h1>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts..."
            className="w-full pl-12 pr-10 py-3.5 border border-gray-300 dark:border-[var(--border)] rounded-2xl bg-white dark:bg-dark-2 text-gray-900 dark:text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors"
            style={{ "--accent": primaryColor } as React.CSSProperties}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-[var(--foreground)]"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f;
            const color = f === "all" ? primaryColor : ARTIFACT_META[f].color;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold cursor-pointer transition-colors ${
                  active
                    ? "text-white"
                    : "bg-white dark:bg-dark-2 text-gray-500 dark:text-[var(--muted)] border border-gray-200 dark:border-[var(--border)] hover:bg-gray-50 dark:hover:bg-dark-3"
                }`}
                style={active ? { backgroundColor: color } : undefined}
              >
                {f === "all" ? "All" : ARTIFACT_META[f].label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {/* Masonry columns, since the card shapes differ by type (cards keep their
            order down each column). */}
        <div className="mt-6 columns-2 sm:columns-3 lg:columns-4 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
          <NewArtifactCard
            onClick={() => setIsNewOpen(true)}
            color={filter === "all" ? primaryColor : ARTIFACT_META[filter].color}
          />
          {showSkeleton
            ? [1, 2, 3].map((i) => (
                <div key={i} className="block aspect-[3/4] rounded-2xl bg-gray-200 dark:bg-dark-3 animate-pulse" />
              ))
            : artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  onClick={() => setOpenArtifact(artifact)}
                />
              ))}
        </div>

        {!showSkeleton && artifacts.length === 0 && isFiltering && (
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-[var(--muted)]">
            No artifacts match your search.
          </p>
        )}
      </div>

      {isNewOpen && (
        <NewArtifactModal
          onClose={() => setIsNewOpen(false)}
          onCreated={() => {
            setIsNewOpen(false);
            queryClient.invalidateQueries({ queryKey: ["artifacts"] });
          }}
        />
      )}

      {openArtifact && (
        <ArtifactPopup artifact={openArtifact} onClose={() => setOpenArtifact(null)} />
      )}
    </main>
  );
}
