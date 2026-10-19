"use client";

import { useEffect, useRef, useState } from "react";

interface ImageCropperProps {
  // The image being shown (and cropped).
  file: File;
  color: string;
  // True when `file` is already a cropped copy, so Reset can restore the original.
  canReset: boolean;
  onApply: (cropped: File) => void;
  onReset: () => void;
  onChangeImage: () => void;
}

type Box = { x: number; y: number; w: number; h: number };
type Mode = "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

const MIN_SIZE = 24;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const HANDLES: { mode: Mode; style: React.CSSProperties; cursor: string }[] = [
  { mode: "nw", style: { left: -6, top: -6 }, cursor: "nwse-resize" },
  { mode: "ne", style: { right: -6, top: -6 }, cursor: "nesw-resize" },
  { mode: "sw", style: { left: -6, bottom: -6 }, cursor: "nesw-resize" },
  { mode: "se", style: { right: -6, bottom: -6 }, cursor: "nwse-resize" },
  { mode: "n", style: { left: "calc(50% - 6px)", top: -6 }, cursor: "ns-resize" },
  { mode: "s", style: { left: "calc(50% - 6px)", bottom: -6 }, cursor: "ns-resize" },
  { mode: "w", style: { top: "calc(50% - 6px)", left: -6 }, cursor: "ew-resize" },
  { mode: "e", style: { top: "calc(50% - 6px)", right: -6 }, cursor: "ew-resize" },
];

// The image preview with a crop frame sitting right on it (starting as the
// full image = no crop). Drag the frame to move it, drag its handles to
// resize, then "Apply crop" to cut from the original pixels.
export default function ImageCropper({
  file,
  color,
  canReset,
  onApply,
  onReset,
  onChangeImage,
}: ImageCropperProps) {
  const [url, setUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const sizeRef = useRef(size);
  const boxRef = useRef(box);
  useEffect(() => {
    sizeRef.current = size;
    boxRef.current = box;
  });

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);
    setSize(null);
    setBox(null);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Measure the picture as shown on screen, carrying the frame along
  // proportionally when that size changes (window resize, popup reflow).
  const measure = () => {
    const el = imgRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const prev = sizeRef.current;
    if (!w || !h || (prev && prev.w === w && prev.h === h)) return;
    const b = boxRef.current;
    setSize({ w, h });
    setBox(
      prev && b
        ? { x: (b.x / prev.w) * w, y: (b.y / prev.h) * h, w: (b.w / prev.w) * w, h: (b.h / prev.h) * h }
        : { x: 0, y: 0, w, h },
    );
  };

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [url]);

  const startDrag = (mode: Mode) => (e: React.PointerEvent) => {
    const start = boxRef.current;
    const bounds = sizeRef.current;
    if (!start || !bounds) return;
    e.preventDefault();
    e.stopPropagation();
    const origin = { x: e.clientX, y: e.clientY };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - origin.x;
      const dy = ev.clientY - origin.y;
      let { x, y, w, h } = start;
      if (mode === "move") {
        x = clamp(start.x + dx, 0, bounds.w - start.w);
        y = clamp(start.y + dy, 0, bounds.h - start.h);
      } else {
        if (mode.includes("w")) {
          x = clamp(start.x + dx, 0, start.x + start.w - MIN_SIZE);
          w = start.x + start.w - x;
        }
        if (mode.includes("e")) w = clamp(start.w + dx, MIN_SIZE, bounds.w - start.x);
        if (mode.includes("n")) {
          y = clamp(start.y + dy, 0, start.y + start.h - MIN_SIZE);
          h = start.y + start.h - y;
        }
        if (mode.includes("s")) h = clamp(start.h + dy, MIN_SIZE, bounds.h - start.y);
      }
      setBox({ x, y, w, h });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const isCropped =
    !!box && !!size && (box.w < size.w - 1 || box.h < size.h - 1);

  const apply = () => {
    const img = imgRef.current;
    if (!img || !box || !size || !isCropped) return;
    const sx = img.naturalWidth / size.w;
    const sy = img.naturalHeight / size.h;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(box.w * sx));
    canvas.height = Math.max(1, Math.round(box.h * sy));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      img,
      box.x * sx, box.y * sy, canvas.width, canvas.height,
      0, 0, canvas.width, canvas.height,
    );
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const base = file.name.replace(/\.[^.]+$/, "").replace(/-cropped$/, "");
        onApply(
          new File([blob], `${base}-cropped.${mime === "image/png" ? "png" : "jpg"}`, { type: mime }),
        );
      },
      mime,
      0.92,
    );
  };

  const dim = "absolute bg-black/55 pointer-events-none";
  const linkButton = "text-sm font-semibold cursor-pointer hover:underline";

  return (
    <div>
      <div className="flex justify-center">
        <div className="relative inline-block max-w-full select-none touch-none">
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={url}
              alt="Crop preview"
              draggable={false}
              onLoad={measure}
              className="block h-auto w-auto max-w-full max-h-[50vh] rounded-lg"
            />
          )}

          {box && size && (
            <>
              {/* Dim everything outside the frame */}
              <div className={dim} style={{ left: 0, top: 0, width: size.w, height: box.y }} />
              <div className={dim} style={{ left: 0, top: box.y + box.h, width: size.w, height: size.h - box.y - box.h }} />
              <div className={dim} style={{ left: 0, top: box.y, width: box.x, height: box.h }} />
              <div className={dim} style={{ left: box.x + box.w, top: box.y, width: size.w - box.x - box.w, height: box.h }} />

              <div
                onPointerDown={startDrag("move")}
                className="absolute cursor-move"
                style={{
                  left: box.x,
                  top: box.y,
                  width: box.w,
                  height: box.h,
                  border: `2px solid ${color}`,
                }}
              >
                {HANDLES.map((h) => (
                  <span
                    key={h.mode}
                    onPointerDown={startDrag(h.mode)}
                    className="absolute h-3 w-3 rounded-sm border-2 border-white"
                    style={{ ...h.style, cursor: h.cursor, backgroundColor: color }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={apply}
          disabled={!isCropped}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition active:opacity-80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: color }}
        >
          Apply crop
        </button>
        {canReset && (
          <button type="button" onClick={onReset} className={`${linkButton} text-gray-500 dark:text-[var(--muted)]`}>
            Reset
          </button>
        )}
        <button type="button" onClick={onChangeImage} className={`${linkButton} ml-auto text-gray-500 dark:text-[var(--muted)]`}>
          Change image
        </button>
      </div>
    </div>
  );
}
