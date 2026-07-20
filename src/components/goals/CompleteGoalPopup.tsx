"use client";

import React, { useEffect, useRef, useState } from "react";

interface CompleteGoalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPost?: (payload: { title: string; description: string; finishBy?: string; image?: File | null }) => void | Promise<void>;
  defaultFinishBy?: string;

  defaultTitle?: string;
  defaultDescription?: string;

  timeSpent?: string;
  xpGained?: number;
  sessionsCount?: number;
}

export default function CompleteGoalPopup({
  isOpen,
  onClose,
  onPost,
  defaultFinishBy = undefined,
  defaultTitle = "Drawing Mandalorian",
  defaultDescription = "Wanted to get back to drawing and make some really good art of one of my favorite characters, so here it is",

  timeSpent = "2h 20m",
  xpGained = 3490,
  sessionsCount = 8,
}: CompleteGoalPopupProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [finishBy, setFinishBy] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) return;
    setTitle(defaultTitle);
    setDescription(defaultDescription);
    setFinishBy(defaultFinishBy || undefined);
    setImagePreview(null);
    setImageFile(null);
    setIsPosting(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isOpen, defaultTitle, defaultDescription, defaultFinishBy]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-gray-100 dark:bg-dark-2 rounded-3xl shadow-2xl overflow-hidden border"
        style={{ borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center bg-white dark:bg-[var(--dark-1)] justify-between px-6 pt-4 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-bold text-foreground dark:text-[var(--foreground)]">
            New Achievement
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer active:opacity-70 transition-all"
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Achievement Image Picker */}
          <div className="px-0">
            <div
              onClick={() => {
                fileInputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setImagePreview(url);
                setImageFile(file);
              }}
              style={{ borderColor: "var(--border)" }}
              className="relative w-full h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white dark:bg-dark-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute cursor-pointer top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">📸</div>

                  <p className="font-semibold text-lg mb-1 text-foreground dark:text-[var(--foreground)]">Upload an achievement image</p>

                  <p className="text-sm mb-4 text-center px-6 text-gray-500 dark:text-[var(--muted)]">Drag & drop your image here or upload a snapshot.</p>

                  <div className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 dark:bg-dark-2 text-foreground dark:text-[var(--foreground)]">Browse Image</div>

                  <p className="text-xs mt-3 text-gray-500 dark:text-[var(--muted)]">PNG or JPG</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setImagePreview(url);
                setImageFile(file);
              }}
            />
          </div>

          {/* Editable Title */}
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Title
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-3 text-foreground dark:text-[var(--foreground)] placeholder-gray-400 outline-none border"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          {/* Editable Description */}
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Description
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write something about this achievement..."
              rows={4}
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-3 text-foreground dark:text-[var(--foreground)] placeholder-gray-400 outline-none border resize-none"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          {/* Finish By */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Finish by</p>
              <p className="text-xs text-gray-500 dark:text-[var(--muted)]">optional</p>
            </div>
            <input
              type="date"
              value={finishBy || ""}
              onChange={(e) => setFinishBy(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-3 text-foreground dark:text-[var(--foreground)] placeholder-gray-400 outline-none border"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          {/* Stats */}
          <div
            className="relative grid grid-cols-3 gap-3 p-2 rounded-2xl border bg-white dark:bg-dark-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="absolute top-3 bottom-3 left-1/3 w-px"
              style={{ backgroundColor: "var(--border)" }}
            />
            <div
              className="absolute top-3 bottom-3 left-2/3 w-px"
              style={{ backgroundColor: "var(--border)" }}
            />

            <StatBox label="Time spent" value={timeSpent} />
            <StatBox label="XP gained" value={xpGained.toString()} />
            <StatBox label="Sessions" value={sessionsCount.toString()} />
          </div>

          {/* Inline error */}
          {error && (
            <div
              role="alert"
              className="px-4 py-3 rounded-2xl text-sm font-medium border bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
            >
              {error}
            </div>
          )}
        </div>

        {/* Post Button */}
        <div className="flex items-center bg-white dark:bg-[var(--dark-1)] justify-between px-5 pt-5 pb-4 border-t border-gray-200 dark:border-[var(--border)]">
          <button
            type="button"
            disabled={isPosting}
            onClick={async () => {
              if (!onPost || isPosting) return;
              setError(null);
              setIsPosting(true);
              try {
                await onPost({ title, description, finishBy, image: imageFile });
              } catch (err) {
                setError(
                  err instanceof Error && err.message
                    ? err.message
                    : "Something went wrong. Please try again."
                );
              } finally {
                setIsPosting(false);
              }
            }}
            className="w-full py-3 rounded-2xl font-semibold text-white transition-all active:opacity-80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: "var(--rookie-primary)" }}
          >
            {isPosting ? "Posting Achievement..." : "Post Achievement"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">{value}</div>
      <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}
