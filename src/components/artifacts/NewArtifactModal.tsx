"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { useMasteryPrimaryColor } from "@/src/lib/hooks/useMasteryAccent";
import { ARTIFACT_META, type ArtifactType } from "@/src/lib/types/artifact";
import VersionContentInput from "@/src/components/artifacts/VersionContentInput";

interface NewArtifactModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const TYPES: ArtifactType[] = ["image", "audio", "text"];
const DEFAULT_TITLE = "Untitled Artifact";

export default function NewArtifactModal({ onClose, onCreated }: NewArtifactModalProps) {
  const primaryColor = useMasteryPrimaryColor();
  const [type, setType] = useState<ArtifactType>("image");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasContent = type === "text" ? text.trim().length > 0 : !!file;

  const selectType = (next: ArtifactType) => {
    if (next === type) return;
    setType(next);
    setFile(null);
    setText("");
    setError(null);
  };

  const handleCreate = async () => {
    if (!hasContent || saving) return;
    setSaving(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("type", type);
      body.append("title", title.trim() || DEFAULT_TITLE);
      if (type === "text") body.append("text", text);
      else if (file) body.append("file", file);
      const res = await authedFetch("/api/artifacts", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const first = data && typeof data === "object" ? Object.values(data)[0] : null;
        throw new Error(
          (Array.isArray(first) ? first[0] : (first as string | undefined)) ||
            "Couldn't create the artifact.",
        );
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the artifact.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-h-[92vh] transition-[max-width] duration-200 ${type === "text" ? "max-w-6xl" : "max-w-3xl"} flex flex-col bg-gray-100 dark:bg-dark-1 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[var(--border)] animate-dialog-in`}
        style={{ "--accent": ARTIFACT_META[type].color } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between bg-white dark:bg-[var(--dark-2)] px-6 pt-5 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {/* The heading is the artifact's title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => !title.trim() && setTitle(DEFAULT_TITLE)}
            aria-label="Artifact title"
            className="min-w-0 flex-1 mr-3 bg-transparent text-xl font-bold text-foreground dark:text-[var(--foreground)] outline-none border-b-2 border-transparent focus:border-[var(--accent)] transition-colors"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all"
          >
            <XMarkIcon className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row gap-5 overflow-y-auto px-6 py-5">
          {/* Type, stacked on the left */}
          <div className="flex sm:flex-col gap-3 sm:w-36 shrink-0">
            {TYPES.map((t) => {
              const meta = ARTIFACT_META[t];
              const Icon = meta.Icon;
              const selected = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectType(t)}
                  className="flex-1 sm:flex-none flex flex-col items-center gap-1.5 rounded-2xl border-2 py-4 cursor-pointer transition"
                  style={{
                    borderColor: selected ? meta.color : "var(--border)",
                    backgroundColor: selected
                      ? `color-mix(in srgb, ${meta.color} 10%, transparent)`
                      : undefined,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: meta.color }} strokeWidth={1.5} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: selected ? meta.color : "var(--muted)" }}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content / preview on the right */}
          <div className="flex-1 min-w-0 space-y-4">
            <VersionContentInput
              type={type}
              file={file}
              text={text}
              onFileChange={setFile}
              onTextChange={setText}
            />

            {error && (
              <div
                role="alert"
                className="px-4 py-3 rounded-2xl text-sm font-medium border bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
              >
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-[var(--dark-2)] px-5 py-4 border-t border-gray-200 dark:border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-semibold text-white bg-gray-600 dark:bg-[var(--dark-3)] hover:bg-gray-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasContent || saving}
            onClick={handleCreate}
            className="flex-1 py-3 rounded-2xl font-semibold text-white transition active:opacity-80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
