"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface CompleteGoalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPost?: (payload: { title: string; description: string }) => void;

  imageUrl?: string;

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

  imageUrl = "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836",

  defaultTitle = "Drawing Mandalorian",
  defaultDescription = "Wanted to get back to drawing and make some really good art of one of my favorite characters, so here it is",

  timeSpent = "2h 20m",
  xpGained = 3490,
  sessionsCount = 8,
}: CompleteGoalPopupProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(defaultTitle);
    setDescription(defaultDescription);
  }, [isOpen, defaultTitle, defaultDescription]);

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
          className="flex items-center bg-white justify-between px-6 pt-4 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-bold text-foreground dark:text-white">
            New Achievement
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer active:opacity-70 transition-all cursor-pointer"
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
          {/* Achievement Image */}
          <div className="w-full">
            <Image
              src={imageUrl}
              alt="Achievement"
              width={800}
                height={450}

            //   aspect ratio 16:9
              className="aspect-[16/9] rounded-2xl object-cover"
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
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-3 text-foreground dark:text-white placeholder-gray-400 outline-none border"
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
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-3 text-foreground dark:text-white placeholder-gray-400 outline-none border resize-none"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          {/* Stats */}
          <div
                className="relative grid grid-cols-3 gap-3 p-2 rounded-2xl border bg-white dark:bg-dark-3"
                style={{ borderColor: "var(--border)" }}
                >
                {/* vertical dividers */}
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


          
          
        </div>
        {/* Post Button */}
          <div  className="flex items-center bg-white justify-between px-5 pt-5 pb-4 border-t border-gray-200 dark:border-gray-800">
            <button
            type="button"
            onClick={() => onPost?.({ title, description })}
            className="w-full  py-3 rounded-2xl font-semibold text-white transition-all active:opacity-80 cursor-pointer"
            style={{ backgroundColor: "var(--rookie-primary)" }}
          >
            Post Achievement
          </button>
          </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-foreground dark:text-white">{value}</div>
      <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}
