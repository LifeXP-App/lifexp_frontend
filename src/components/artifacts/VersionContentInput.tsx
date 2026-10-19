"use client";

import { useRef, useState } from "react";
import AudioTrimmer from "@/src/components/artifacts/AudioTrimmer";
import MarkdownEditor from "@/src/components/artifacts/MarkdownEditor";
import ImageCropper from "@/src/components/artifacts/ImageCropper";
import { ARTIFACT_META, type ArtifactType } from "@/src/lib/types/artifact";

interface VersionContentInputProps {
  type: ArtifactType;
  file: File | null;
  text: string;
  onFileChange: (file: File | null) => void;
  onTextChange: (text: string) => void;
}

// What each file type accepts (sizes match the API's limits).
const ALLOWED: Record<"image" | "audio", { formats: string; maxMb: number }> = {
  image: { formats: "PNG, JPG, WEBP or GIF", maxMb: 10 },
  audio: { formats: "MP3, WAV, M4A or OGG", maxMb: 25 },
};

// Content for one version: a file picker for image/audio, a textarea for text.
export default function VersionContentInput({
  type,
  file,
  text,
  onFileChange,
  onTextChange,
}: VersionContentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = ARTIFACT_META[type];
  const Icon = meta.Icon;

  // `source` is the file the user picked; `file` (from the parent) is what
  // will be uploaded -- the source itself, or its cropped / trimmed copy.
  const [source, setSource] = useState<File | null>(null);
  const original = file ? (source ?? file) : null;
  const isEdited = !!file && !!original && file !== original;

  const pick = (picked: File | null | undefined) => {
    setSource(picked ?? null);
    onFileChange(picked ?? null);
  };

  if (type === "text") {
    // Writing: a markdown editor (the editor owns its text once mounted).
    return <MarkdownEditor value={text} onChange={onTextChange} />;
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={`${type}/*`}
      className="hidden"
      onChange={(e) => pick(e.target.files?.[0])}
    />
  );

  const dropProps = {
    onClick: () => inputRef.current?.click(),
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      pick(e.dataTransfer.files?.[0]);
    },
  };

  const linkButton =
    "text-sm font-semibold cursor-pointer hover:underline disabled:opacity-40";

  if (type === "image" && file) {
    return (
      <>
        <ImageCropper
          file={file}
          color={meta.color}
          canReset={isEdited}
          onApply={onFileChange}
          onReset={() => original && onFileChange(original)}
          onChangeImage={() => inputRef.current?.click()}
        />
        {fileInput}
      </>
    );
  }

  if (type === "audio" && original) {
    return (
      <>
        <AudioTrimmer file={original} color={meta.color} onTrim={onFileChange} />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-gray-500 dark:text-[var(--muted)]">
            {isEdited ? file?.name : original.name}
          </p>
          <button type="button" onClick={() => inputRef.current?.click()} className={`${linkButton} shrink-0 text-gray-500 dark:text-[var(--muted)]`}>
            Change file
          </button>
        </div>
        {fileInput}
      </>
    );
  }

  return (
    <>
      <div
        {...dropProps}
        className="w-full min-h-56 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white dark:bg-dark-2 transition-colors"
        style={{ borderColor: "var(--border)" }}
      >
        <Icon className="w-9 h-9" style={{ color: meta.color }} strokeWidth={1.5} />
        <p className="mt-2 px-4 text-center text-sm font-medium text-gray-500 dark:text-[var(--muted)]">
          {ALLOWED[type].formats}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-[var(--muted)]">
          up to {ALLOWED[type].maxMb} MB
        </p>
      </div>
      {fileInput}
    </>
  );
}
