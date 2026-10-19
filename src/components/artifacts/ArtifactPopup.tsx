"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { useConfirm, useToast } from "@/src/context/ToastContext";
import { useMasteryPrimaryColor } from "@/src/lib/hooks/useMasteryAccent";
import {
  ARTIFACT_META,
  formatArtifactDate,
  type Artifact,
  type ArtifactDetail,
  type ArtifactVersion,
} from "@/src/lib/types/artifact";
import MarkdownView from "@/src/components/artifacts/MarkdownView";
import VersionContentInput from "@/src/components/artifacts/VersionContentInput";

interface ArtifactPopupProps {
  artifact: Artifact;
  onClose: () => void;
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// An artifact's content with its dated versions listed on the right, an
// editable title, and Delete / Update at the bottom. Update adds a new
// version of the same artifact (same type) rather than replacing the old one.
export default function ArtifactPopup({ artifact, onClose }: ArtifactPopupProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const primaryColor = useMasteryPrimaryColor();
  const meta = ARTIFACT_META[artifact.type];

  const [title, setTitle] = useState(artifact.title);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [versionDate, setVersionDate] = useState(todayKey);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["artifact", artifact.id],
    queryFn: async () => {
      const res = await authedFetch(`/api/artifacts/${artifact.id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load artifact");
      return (await res.json()) as ArtifactDetail;
    },
  });

  // Newest first on the right; the newest is selected until you pick another.
  const versions = [...(detail?.versions ?? [])].sort((a, b) => b.version - a.version);
  const selected: ArtifactVersion | undefined =
    versions.find((v) => v.id === selectedId) ?? versions[0];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["artifacts"] });
    queryClient.invalidateQueries({ queryKey: ["artifact", artifact.id] });
  };

  const saveTitle = async () => {
    const next = title.trim();
    if (next === (detail?.title ?? artifact.title)) return;
    try {
      const res = await authedFetch(`/api/artifacts/${artifact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (!res.ok) throw new Error("rename failed");
      refresh();
    } catch {
      toast.error("Couldn't rename the artifact.");
      setTitle(detail?.title ?? artifact.title);
    }
  };

  const hasNewContent = artifact.type === "text" ? text.trim().length > 0 : !!file;

  const resetUpdate = () => {
    setUpdating(false);
    setFile(null);
    setText("");
    setVersionDate(todayKey());
  };

  const saveVersion = async () => {
    if (!hasNewContent || saving) return;
    setSaving(true);
    try {
      const body = new FormData();
      body.append("version_date", versionDate);
      if (artifact.type === "text") body.append("text", text);
      else if (file) body.append("file", file);
      const res = await authedFetch(`/api/artifacts/${artifact.id}/versions`, {
        method: "POST",
        body,
      });
      if (!res.ok) throw new Error("save failed");
      const data = (await res.json()) as ArtifactDetail;
      queryClient.setQueryData(["artifact", artifact.id], data);
      queryClient.invalidateQueries({ queryKey: ["artifacts"] });
      setSelectedId(null);
      resetUpdate();
    } catch {
      toast.error("Couldn't save the new version.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete artifact",
      message: `Delete "${artifact.title || "Untitled"}" and all ${detail?.version_count ?? artifact.version_count} of its versions? This cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await authedFetch(`/api/artifacts/${artifact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      queryClient.invalidateQueries({ queryKey: ["artifacts"] });
      toast.success("Artifact deleted.");
      onClose();
    } catch {
      toast.error("Couldn't delete the artifact.");
      setDeleting(false);
    }
  };

  const viewer = (v: ArtifactVersion) => {
    if (artifact.type === "image" && v.file_url) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={v.file_url} alt={title} className="max-h-[55vh] w-full object-contain rounded-xl" />;
    }
    if (artifact.type === "audio" && v.file_url) {
      return <audio controls src={v.file_url} className="w-full" />;
    }
    return <MarkdownView markdown={v.text} />;
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-h-[92vh] flex flex-col transition-[max-width] duration-200 ${artifact.type === "text" ? "max-w-6xl" : "max-w-3xl"} bg-gray-100 dark:bg-dark-1 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[var(--border)] animate-dialog-in`}
        style={{ "--accent": meta.color } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: editable title */}
        <div
          className="flex items-center gap-3 bg-white dark:bg-[var(--dark-2)] px-6 pt-5 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <meta.Icon className="w-6 h-6 shrink-0" style={{ color: meta.color }} strokeWidth={1.75} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="Untitled"
            aria-label="Artifact title"
            className="min-w-0 flex-1 bg-transparent text-xl font-bold text-foreground dark:text-[var(--foreground)] outline-none border-b-2 border-transparent focus:border-[var(--accent)] transition-colors"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all"
          >
            <XMarkIcon className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body: content left, dated versions right */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          <div className="flex-1 min-w-0 overflow-y-auto p-6">
            {updating ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  New version
                </p>
                <VersionContentInput
                  type={artifact.type}
                  file={file}
                  text={text}
                  onFileChange={setFile}
                  onTextChange={setText}
                />
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Date</p>
                  <input
                    type="date"
                    value={versionDate}
                    onChange={(e) => setVersionDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-dark-2 text-foreground dark:text-[var(--foreground)] outline-none border border-gray-200 dark:border-[var(--border)] focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>
            ) : isLoading || !selected ? (
              <div className="h-48 rounded-2xl bg-gray-200 dark:bg-dark-3 animate-pulse" />
            ) : (
              viewer(selected)
            )}
          </div>

          <div
            className="md:w-56 shrink-0 overflow-y-auto border-t md:border-t-0 md:border-l p-4 space-y-2 max-h-40 md:max-h-none"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="px-1 text-xs font-semibold" style={{ color: "var(--muted)" }}>Versions</p>
            {versions.map((v) => {
              const isSelected = !updating && selected?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(v.id);
                    if (updating) resetUpdate();
                  }}
                  className="w-full text-left rounded-xl border px-3 py-2 cursor-pointer transition"
                  style={{
                    borderColor: isSelected ? meta.color : "var(--border)",
                    backgroundColor: isSelected
                      ? `color-mix(in srgb, ${meta.color} 10%, transparent)`
                      : undefined,
                  }}
                >
                  <p className="text-sm font-semibold text-black dark:text-[var(--foreground)]">
                    Version {v.version}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[var(--muted)]">
                    {formatArtifactDate(v.version_date)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 bg-white dark:bg-[var(--dark-2)] px-5 py-4 border-t border-gray-200 dark:border-[var(--border)]">
          {updating ? (
            <>
              <button
                type="button"
                onClick={resetUpdate}
                className="flex-1 py-3 rounded-2xl font-semibold text-white bg-gray-600 dark:bg-[var(--dark-3)] hover:bg-gray-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!hasNewContent || saving}
                onClick={saveVersion}
                className="flex-1 py-3 rounded-2xl font-semibold text-white transition active:opacity-80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? "Saving..." : "Save version"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 py-3 rounded-2xl font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setUpdating(true)}
                className="flex-1 py-3 rounded-2xl font-semibold text-white transition active:opacity-80 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Update
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
