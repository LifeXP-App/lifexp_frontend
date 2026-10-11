"use client";

import React, { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CameraIcon } from "@heroicons/react/24/solid";
import { useMasteryPrimaryColor } from "@/src/lib/hooks/useMasteryAccent";

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
  const primaryColor = useMasteryPrimaryColor();

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

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageFile(file);
  };

  const fieldClass =
    "w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-2 text-foreground dark:text-[var(--foreground)] placeholder-gray-400 outline-none border border-gray-200 dark:border-[var(--border)] focus:border-[var(--accent)] transition-colors";

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-gray-100 dark:bg-dark-1 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[var(--border)] animate-dialog-in"
        style={{ "--accent": primaryColor } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center bg-white dark:bg-[var(--dark-2)] justify-between px-6 pt-5 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-[var(--foreground)] leading-tight">
              New Achievement
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Share what you accomplished with this goal
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Time spent" value={timeSpent} />
            <StatBox label="XP gained" value={xpGained.toLocaleString()} />
            <StatBox label="Sessions" value={sessionsCount.toString()} />
          </div>

          {/* Achievement Image Picker */}
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                pickImage(e.dataTransfer.files?.[0]);
              }}
              className="group relative w-full h-[160px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-[var(--border)] hover:border-[var(--accent)] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white dark:bg-dark-2 transition-colors"
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Remove image"
                    className="absolute cursor-pointer top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                  >
                    <XMarkIcon className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </>
              ) : (
                <>
                  <CameraIcon className="w-7 h-7 mb-2 text-gray-400 dark:text-[var(--muted)]" />
                  <p className="text-sm font-medium text-gray-500 dark:text-[var(--muted)]">
                    Add an image
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0])}
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
              className={fieldClass}
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
              className={`${fieldClass} resize-none`}
            />
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
        <div className="flex items-center bg-white dark:bg-[var(--dark-2)] justify-between px-5 py-4 border-t border-gray-200 dark:border-[var(--border)]">
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
            style={{ backgroundColor: primaryColor }}
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
    <div className="flex flex-col items-center text-center gap-1 px-2 py-4 rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2">
      <div className="text-lg font-bold leading-tight text-foreground dark:text-[var(--foreground)]">
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}
