"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { useToast } from "@/src/context/ToastContext";
import { compressImageForUpload, SANITY_CAP_BYTES } from "@/src/lib/utils/compressImage";

interface EditSessionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionNumber: number;
  initialName: string;
  initialCompletionPicture: string | null;
  onSaved: (updated: { name: string }) => void;
}

// Edit a session's name and completion picture. The image field mirrors the
// reflection page's picker exactly (app/(fullscreen)/goals/[goalId]/session/
// [sessionId]/reflection/page.tsx) — same drag/drop + click-to-browse area,
// same upload endpoint (POST .../image/, async via PendingMediaUpload on the
// backend, so the new URL isn't returned immediately — the caller's cache
// invalidation is what eventually shows the real uploaded image).
export default function EditSessionPopup({
  isOpen,
  onClose,
  sessionId,
  sessionNumber,
  initialName,
  initialCompletionPicture,
  onSaved,
}: EditSessionPopupProps) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [imagePreview, setImagePreview] = useState<string | null>(initialCompletionPicture);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setImagePreview(initialCompletionPicture);
  }, [isOpen, initialName, initialCompletionPicture]);

  if (!isOpen) return null;

  const uploadImage = async (file: File) => {
    try {
      if (!file.type.startsWith("image/")) {
        toast.error("Only images are allowed.");
        return;
      }
      if (file.size > SANITY_CAP_BYTES) {
        toast.error("That image is too large. Please pick a smaller file.");
        return;
      }

      const uploadFile = await compressImageForUpload(file);
      const formData = new FormData();
      formData.append("image", uploadFile);

      setUploadingImage(true);
      await authedFetch(`/api/sessions/${sessionId}/image`, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Failed to upload session image", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    uploadImage(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    uploadImage(file);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await authedFetch(`/api/sessions/${sessionId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Failed to save session.");
      }
      const data = await res.json();
      onSaved({ name: data.name ?? name.trim() });
      onClose();
    } catch (err) {
      console.error("Failed to save session edits", err);
      toast.error(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden bg-white dark:border dark:border-[var(--border)] dark:bg-[var(--dark-1)] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-dark-3 transition-all cursor-pointer z-10"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="px-6 pt-7 pb-2 text-center">
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            Edit Session {sessionNumber}
          </h1>
        </div>

        <div className="px-6 py-5">
          <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-[var(--muted)]">
            Session name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={25}
            placeholder={`Session ${sessionNumber}`}
            className="w-full rounded-xl border px-4 py-3 text-sm bg-white dark:bg-dark-2 dark:text-[var(--foreground)] focus:outline-none focus:ring-2"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        {/* Completion image picker — same layout as the reflection page's */}
        <div className="px-6 pb-6">
          <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-[var(--muted)]">
            Completion image
          </label>
          <div
            onClick={() => document.getElementById("edit-session-image-input")?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleDrop}
            style={{ borderColor: "var(--border)" }}
            className="relative w-full h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white dark:bg-dark-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {imagePreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Session completion"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                  }}
                  className="absolute cursor-pointer top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                >
                  ✕
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                  {uploadingImage ? "Uploading…" : "Click to replace"}
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">📸</div>
                <p className="font-semibold text-sm mb-1">
                  Add a completion image
                </p>
                <p className="text-xs text-center px-6 text-gray-500">
                  Drag & drop or click to browse
                </p>
              </>
            )}
          </div>
          <input
            id="edit-session-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 cursor-pointer rounded-2xl font-semibold text-white text-md bg-gray-900 dark:bg-white dark:text-black hover:opacity-90 active:opacity-75 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
