"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import AspectChip from "@/src/components/goals/AspectChip";
import DeleteSessionConfirmationModal from "@/src/components/goals/DeleteSessionConfirmationModal";
import { BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import { FaBrain, FaHammer } from "react-icons/fa";
import { BiDumbbell } from "react-icons/bi";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { useToast } from "@/src/context/ToastContext";

interface ActivityType {
  uid?: string;
  name: string;
  emoji: string;
  color: string;
}

interface AvatarType {
  color: string;
}

interface XPDistribution {
  physique: number;
  energy: number;
  social: number;
  creativity: number;
  logic: number;
}

interface SessionInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;

  sessionId?: string;
  sessionNumber?: number;
  name?: string;
  onNameSaved?: (name: string) => void;
  dateText?: string;

  coverImageUrl?: string;

  totalDuration?: string;
  xpEarned?: number;
  xpDistribution?: XPDistribution;
  focusedDuration?: string;


  nudgeCount?: number;
  nudgeAvatars?: AvatarType[];

  activity?: ActivityType;

  onDelete?: () => void | Promise<void>;
  deleting?: boolean;
}

const SessionInfoPopup: React.FC<SessionInfoPopupProps> = ({
  isOpen,
  onClose,

  sessionId,
  sessionNumber,
  name,
  onNameSaved,
  dateText,

  coverImageUrl ,

  totalDuration,
  xpEarned ,
  xpDistribution,
  focusedDuration ,

  nudgeCount = 24,
  nudgeAvatars,

  activity,

  onDelete,
  deleting = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [sessionName, setSessionName] = useState(name || "");
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;

    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 350);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSessionName(name || "");
  }, [isOpen, name]);

  const handleSaveName = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!sessionId || trimmed === (name || "")) return;
    try {
      const res = await authedFetch(`/api/sessions/${sessionId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Failed to save session name.");
      }
      const data = await res.json();
      const savedName = data.name ?? trimmed;
      setSessionName(savedName);
      onNameSaved?.(savedName);
    } catch (err) {
      console.error("Failed to save session name", err);
      toast.error(err instanceof Error ? err.message : "Failed to save session name.");
      setSessionName(name || "");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx global>{`
     

        * {
          box-sizing: border-box;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Popup Card */}
        <div
          className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-white dark:border dark:border-[var(--border)] dark:bg-[var(--dark-1)] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: isAnimating ? "scaleIn 0.2s ease-out" : "none",
          }}
        >
          {/* Close X */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-dark-3 transition-all cursor-pointer z-10"
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="px-6 pt-7 pb-4 text-center">
            <h1
              contentEditable={!!sessionId}
              suppressContentEditableWarning
              onFocus={(e) => {
                if (!sessionId) return;
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
              }}
              onBlur={(e) => {
                if (!sessionId) return;
                const value = e.currentTarget.textContent || "";
                setSessionName(value.trim());
                handleSaveName(value);
              }}
              onInput={(e) => {
                if (!sessionId) return;
                const value = e.currentTarget.textContent || "";
                if (value.length > 25) {
                  e.currentTarget.textContent = value.slice(0, 25);
                  const range = document.createRange();
                  range.selectNodeContents(e.currentTarget);
                  range.collapse(false);
                  const sel = window.getSelection();
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                }
              }}
              onKeyDown={(e) => {
                if (!sessionId) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
                if (e.key === "Escape") {
                  e.currentTarget.textContent = name || "";
                  e.currentTarget.blur();
                }
              }}
              className={`text-2xl font-bold mb-2 outline-none rounded-lg px-2 -mx-2 transition ${
                sessionId
                  ? "cursor-text hover:bg-gray-100 dark:hover:bg-white/5 focus:bg-gray-100 dark:focus:bg-white/5"
                  : ""
              }`}
              style={{
                animation: isAnimating ? "slideUp 0.25s ease-out 0.02s both" : "none",
                color: "var(--foreground)",
              }}
            >
              {sessionName || `Session ${sessionNumber}`}
            </h1>

            <p
              className="text-sm"
              style={{
                animation: isAnimating ? "slideUp 0.25s ease-out 0.05s both" : "none",
                color: "var(--muted)",
              }}
            >
              {dateText}
            </p>
          </div>

          {/* Cover Image (smaller) */}
          {coverImageUrl && (
          <div className="px-6 pb-5">
            
              <Image
                src={coverImageUrl}
                alt="Session cover"
                width={1200}
                height={600}
           
              className="w-full h-[180px] rounded-2xl object-cover"
              style={{
                animation: isAnimating ? "slideUp 0.25s ease-out 0.08s both" : "none",
              }}
            />
            
          </div>
           )}

          {/* Activity Badge */}
          <div
            className="px-6 pb-5 flex justify-center cursor-pointer"
            style={{
              animation: isAnimating ? "slideUp 0.25s ease-out 0.1s both" : "none",
            }}
          >
            {activity?.uid ? (
              <Link
                href={`/a/${activity.uid}`}
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-dark-3 "
                style={{
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <span className="text-2xl">{activity?.emoji}</span>
                <span className="font-semibold text-lg" style={{ color: activity?.color }}>
                  {activity?.name}
                </span>
              </Link>
            ) : (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-dark-3"
                style={{
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <span className="text-2xl">{activity?.emoji}</span>
                <span className="font-semibold text-lg" style={{ color: activity?.color }}>
                  {activity?.name}
                </span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div
            className="px-6 pb-6 grid grid-cols-2 gap-4"
            style={{
              animation: isAnimating ? "slideUp 0.25s ease-out 0.12s both" : "none",
            }}
          >
            <StatItem value={totalDuration || "00:00:00"} label="Total Duration" />
            <StatItem value={xpEarned?.toString() || "0"} label="Total XP Earned" />
            <StatItem value={focusedDuration || "00:00:00"} label="Focused Duration" />

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {nudgeCount > 3 ? (
                  <>
                    <div className="flex -space-x-2">
                      {nudgeAvatars?.slice(0, 3).map((avatar, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-dark-2"
                          style={{ backgroundColor: avatar.color }}
                        />
                      ))}
                    </div>
                    <span className="text-xl font-medium">+{nudgeCount - 3}</span>
                  </>
                ) : nudgeCount > 0 ? (
                  <div className="flex -space-x-2">
                    {nudgeAvatars?.slice(0, 3).map((avatar, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-dark-2"
                        style={{ backgroundColor: avatar.color }}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-2xl font-bold">{nudgeCount}</span>
                )}
              </div>

              <div className="text-sm" style={{ color: "var(--muted)" }}>
                Nudges
              </div>
            </div>
          </div>

          {/* Aspect Chips (bottom) */}
          <div
            className="px-6 pb-7"
            style={{
              animation: isAnimating ? "slideUp 0.25s ease-out 0.14s both" : "none",
            }}
          >
            <div className="flex justify-around gap-2">
              <AspectChip icon={<BiDumbbell className="w-4 h-4" />} value={xpDistribution?.physique || 0} tint="physique" />
              <AspectChip icon={<BoltIcon className="w-4 h-4" />} value={xpDistribution?.energy || 0} tint="energy" />
              <AspectChip icon={<UsersIcon className="w-4 h-4" />} value={xpDistribution?.social || 0} tint="social" />
              <AspectChip icon={<FaBrain className="w-4 h-4" />} value={xpDistribution?.creativity || 0} tint="creativity" />
              <AspectChip icon={<FaHammer className="w-4 h-4" />} value={xpDistribution?.logic || 0} tint="logic" />
            </div>
          </div>

          {/* Delete Session */}
          {onDelete && (
            <div
              className="px-6 pb-6 pt-2 border-t"
              style={{
                borderColor: "var(--border)",
                animation: isAnimating ? "slideUp 0.25s ease-out 0.16s both" : "none",
              }}
            >
              <button
                type="button"
                disabled={deleting}
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full cursor-pointer font-medium text-sm text-red-600 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-dark-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Session"}
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteSessionConfirmationModal
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={() => onDelete?.()}
        xpEarned={xpEarned ?? 0}
      />
    </>
  );
};

interface StatItemProps {
  value: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => (
  <div className="text-center">
    <div className="text-2xl font-bold mb-1">{value}</div>
    <div className="text-sm" style={{ color: "var(--muted)" }}>
      {label}
    </div>
  </div>
);

export default SessionInfoPopup;
