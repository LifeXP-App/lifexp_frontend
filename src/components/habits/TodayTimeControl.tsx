"use client";

import { useEffect, useRef, useState } from "react";
import { playTick } from "@/src/lib/utils/habitSounds";
import { from12Hour, stepHours, to12Hour } from "@/src/lib/utils/habitTime";

interface TodayTimeControlProps {
  // 24h "HH:MM"
  value: string;
  // `immediate` = a typed value, so the list can re-sort right away instead
  // of waiting for the user to stop stepping.
  onChange: (next: string, opts?: { immediate?: boolean }) => void;
}

// Wheel notches needed per hour, so a trackpad's burst of tiny events
// doesn't spin through the whole day.
const WHEEL_STEP_PX = 40;

// Clock for a Today habit: scroll the wheel over the time to step the hour
// (with a tick), double-click the time to type it.
// Typing follows the timer popup's behavior: a 4 digit HHMM shift register,
// each digit pushes the others left, Backspace shifts back. "a"/"p" set AM/PM.
export default function TodayTimeControl({ value, onChange }: TodayTimeControlProps) {
  const { hour12, minute, pm } = to12Hour(value);
  const [editing, setEditing] = useState(false);
  const [digits, setDigits] = useState("0000");
  const [editPm, setEditPm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelAccum = useRef(0);
  const latest = useRef({ value, onChange, editing });
  useEffect(() => {
    latest.current = { value, onChange, editing };
  });

  // React's onWheel is passive, so preventDefault (to stop the page from
  // scrolling while you scrub the hour) needs a native non-passive listener.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (latest.current.editing) return;
      e.preventDefault();
      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) < WHEEL_STEP_PX) return;
      const hours = wheelAccum.current > 0 ? 1 : -1;
      wheelAccum.current = 0;
      const next = stepHours(latest.current.value, hours);
      if (!next) return;
      playTick();
      latest.current.onChange(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const startEditing = () => {
    setDigits(`${String(hour12).padStart(2, "0")}${String(minute).padStart(2, "0")}`);
    setEditPm(pm);
    setEditing(true);
  };

  const commit = () => {
    const h = parseInt(digits.slice(0, 2), 10);
    const m = parseInt(digits.slice(2, 4), 10);
    onChange(from12Hour(Math.min(12, Math.max(1, h)), Math.min(59, m), editPm), { immediate: true });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!editing) return;
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setDigits((prev) => (prev + e.key).slice(-4));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setDigits((prev) => ("0" + prev).slice(0, 4));
    } else if (e.key === "a" || e.key === "A") {
      e.preventDefault();
      setEditPm(false);
    } else if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      setEditPm(true);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
    }
  };

  const shownPm = editing ? editPm : pm;
  const text = editing
    ? `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
    : `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return (
    <div
      ref={containerRef}
      // Nothing in here may bubble to the card, whose own click opens the
      // habit page (this also covers clicks that land on a disabled arrow).
      onClick={(e) => e.stopPropagation()}
      data-no-card-click
      className="flex flex-col items-center shrink-0 select-none mr-5 cursor-pointer"
    >
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          readOnly={!editing}
          value={text}
          onChange={() => {}}
          onKeyDown={handleKeyDown}
          onDoubleClick={startEditing}
          onBlur={() => editing && commit()}
          title="Double click to type a time, scroll to change the hour"
          className={`w-[5rem] shrink-0 text-center text-2xl font-bold bg-transparent outline-none border-b border-transparent text-black dark:text-[var(--foreground)] ${
            editing ? "border-gray-400 dark:border-[var(--muted)] cursor-text" : "cursor-pointer"
          }`}
        />
        {/* A/M or P/M stacked so the pair is no taller than one line of the time */}
        <div className="flex flex-col text-[9px] leading-[10px] font-semibold text-gray-400 dark:text-[var(--muted)]">
          <span>{shownPm ? "P" : "A"}</span>
          <span>M</span>
        </div>
      </div>
    </div>
  );
}
