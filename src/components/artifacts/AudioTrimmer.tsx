"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";

interface AudioTrimmerProps {
  file: File;
  color: string;
  // Called with the trimmed clip (or the original file when nothing is trimmed).
  onTrim: (file: File) => void;
}

const BUCKETS = 120;
const MIN_LENGTH = 0.5; // seconds

function computePeaks(audio: AudioBuffer): number[] {
  const data = audio.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / BUCKETS));
  const peaks: number[] = [];
  for (let i = 0; i < BUCKETS; i++) {
    let max = 0;
    for (let j = i * step; j < Math.min(data.length, (i + 1) * step); j++) {
      max = Math.max(max, Math.abs(data[j]));
    }
    peaks.push(max);
  }
  const top = Math.max(...peaks, 0.001);
  return peaks.map((p) => p / top);
}

// 16-bit PCM WAV of audio[start, end] seconds, keeping the channel layout.
function encodeWav(audio: AudioBuffer, start: number, end: number): Blob {
  const rate = audio.sampleRate;
  const from = Math.floor(start * rate);
  const length = Math.max(1, Math.floor(end * rate) - from);
  const channels = audio.numberOfChannels;
  const dataBytes = length * channels * 2;
  const view = new DataView(new ArrayBuffer(44 + dataBytes));
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataBytes, true);

  const chans = Array.from({ length: channels }, (_, c) => audio.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][from + i] ?? 0));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
}

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(1).padStart(4, "0")}`;
};

// Waveform with two draggable handles: everything outside them is cut when
// the clip is saved. Hold/release a handle to apply; Play previews the part
// that's kept.
export default function AudioTrimmer({ file, color, onTrim }: AudioTrimmerProps) {
  const [audio, setAudio] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<[number, number]>([0, 0]);
  const playCtx = useRef<AudioContext | null>(null);
  const playSource = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAudio(null);
    setError(null);
    (async () => {
      const ctx = new AudioContext();
      try {
        const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
        if (cancelled) return;
        setAudio(decoded);
        setPeaks(computePeaks(decoded));
        const full: [number, number] = [0, decoded.duration];
        rangeRef.current = full;
        setRange(full);
      } catch {
        if (!cancelled) setError("Couldn't read this audio file for trimming.");
      } finally {
        void ctx.close();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const stop = () => {
    try {
      playSource.current?.stop();
    } catch {
      // already stopped
    }
    playSource.current = null;
    setPlaying(false);
  };
  useEffect(() => () => {
    try {
      playSource.current?.stop();
    } catch {
      // already stopped
    }
    void playCtx.current?.close();
  }, []);

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }
  if (!audio) {
    return <div className="h-28 rounded-2xl bg-gray-200 dark:bg-dark-3 animate-pulse" />;
  }

  const duration = audio.duration;
  const [start, end] = range;

  const emit = () => {
    const [s, e] = rangeRef.current;
    if (s <= 0.01 && e >= duration - 0.01) {
      onTrim(file);
      return;
    }
    const base = file.name.replace(/\.[^.]+$/, "");
    onTrim(new File([encodeWav(audio, s, e)], `${base}-trimmed.wav`, { type: "audio/wav" }));
  };

  const startDrag = (which: 0 | 1) => (e: React.PointerEvent) => {
    e.preventDefault();
    stop();
    const onMove = (ev: PointerEvent) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const t = Math.min(Math.max((ev.clientX - rect.left) / rect.width, 0), 1) * duration;
      const [s, en] = rangeRef.current;
      const next: [number, number] =
        which === 0 ? [Math.min(t, en - MIN_LENGTH), en] : [s, Math.max(t, s + MIN_LENGTH)];
      next[0] = Math.max(0, next[0]);
      next[1] = Math.min(duration, next[1]);
      rangeRef.current = next;
      setRange(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      emit();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const togglePlay = () => {
    if (playing) {
      stop();
      return;
    }
    const ctx = (playCtx.current ??= new AudioContext());
    void ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = audio;
    source.connect(ctx.destination);
    source.onended = () => {
      if (playSource.current === source) {
        playSource.current = null;
        setPlaying(false);
      }
    };
    source.start(0, start, end - start);
    playSource.current = source;
    setPlaying(true);
  };

  const pct = (t: number) => `${(t / duration) * 100}%`;

  return (
    <div className="space-y-3 select-none touch-none">
      <div ref={trackRef} className="relative h-24 rounded-2xl bg-white dark:bg-dark-2 border border-gray-200 dark:border-[var(--border)] overflow-hidden">
        <div className="absolute inset-0 flex items-center gap-px px-2">
          {peaks.map((p, i) => {
            const t = ((i + 0.5) / peaks.length) * duration;
            const kept = t >= start && t <= end;
            return (
              <span
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: `${Math.max(6, p * 80)}%`,
                  backgroundColor: kept ? color : "var(--muted)",
                  opacity: kept ? 1 : 0.35,
                }}
              />
            );
          })}
        </div>
        {[start, end].map((t, i) => (
          <div
            key={i}
            onPointerDown={startDrag(i as 0 | 1)}
            className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize flex justify-center"
            style={{ left: pct(t) }}
            aria-label={i === 0 ? "Trim start" : "Trim end"}
          >
            <span className="w-1 h-full rounded-full" style={{ backgroundColor: color }} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play selection"}
          className="h-9 w-9 rounded-full flex items-center justify-center text-white cursor-pointer active:opacity-80 transition"
          style={{ backgroundColor: color }}
        >
          {playing ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
        </button>
        <p className="text-gray-500 dark:text-[var(--muted)] tabular-nums">
          {fmt(start)} to {fmt(end)} ({fmt(end - start)} of {fmt(duration)})
        </p>
      </div>
    </div>
  );
}
