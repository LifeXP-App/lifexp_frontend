"use client";

import { useEffect, useRef, useState } from "react";
import { hexToRgba } from "@/src/components/UserAccent";
import { formatDayLabel, localDayKey, parseDayKey, summarizeDay } from "@/src/components/profile/SessionTimeline";

export type HeatmapDay = {
  date: string;
  count: number;
  focused_seconds: number;
  xp: number;
};

const MIN_CELL = 11;
const GAP = 4;
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

// Intensity is focused minutes, not session count — one 2h deep-work block
// should read hotter than three 5-minute check-ins.
function levelFor(seconds: number): number {
  if (seconds <= 0) return 0;
  const minutes = seconds / 60;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

const LEVEL_ALPHA = [0, 0.3, 0.5, 0.75, 1];

// Monday-first columns of local day keys covering [from, to]; slots outside
// the range are null so the first/last weeks can be partial.
function buildWeeks(from: string, to: string): (string | null)[][] {
  const start = parseDayKey(from);
  const end = parseDayKey(to);
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));

  const weeks: (string | null)[][] = [];
  while (cursor <= end) {
    const week: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor >= start && cursor <= end ? localDayKey(cursor) : null);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function SessionHeatmap({
  days,
  from,
  to,
  color,
  selectedDay,
  onSelectDay,
}: {
  days: HeatmapDay[];
  from: string;
  to: string;
  color: string;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
}) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const byDate = new Map(days.map((d) => [d.date, d]));
  const weeks = buildWeeks(from, to);

  // Month label over the column containing that month's 1st.
  const monthLabels = weeks.map((week) => {
    const first = week.find((key) => key && parseDayKey(key).getDate() === 1);
    return first ? parseDayKey(first).toLocaleDateString("en-US", { month: "short" }) : "";
  });

  // Newest weeks sit on the right; start scrolled there on narrow screens.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [from, to]);

  const focusDay = hoveredDay ?? selectedDay;
  const focusData = focusDay ? byDate.get(focusDay) : undefined;

  return (
    <div>
      <div ref={scrollRef} className="overflow-x-auto noscrollbar">
        {/* One grid, label column first, so weekday labels always line up
            with the rows; week columns stretch to fill the card and only
            scroll once they'd shrink below MIN_CELL. */}
        <div
          role="group"
          aria-label="Sessions per day"
          className="grid grid-flow-col"
          style={{
            gridTemplateRows: "14px repeat(7, auto)",
            gridTemplateColumns: `28px repeat(${weeks.length}, minmax(${MIN_CELL}px, 1fr))`,
            gap: GAP,
            minWidth: 28 + weeks.length * (MIN_CELL + GAP),
          }}
          onMouseLeave={() => setHoveredDay(null)}
        >
            <span aria-hidden="true" />
            {WEEKDAY_LABELS.map((label, i) => (
              <span
                key={`wd-${i}`}
                aria-hidden="true"
                className="flex items-center text-[10px] text-gray-500 dark:text-[var(--muted)]"
              >
                {label}
              </span>
            ))}
            {weeks.map((week, w) => [
              <span
                key={`m-${w}`}
                aria-hidden="true"
                className="overflow-visible whitespace-nowrap text-[10px] leading-[14px] text-gray-500 dark:text-[var(--muted)]"
              >
                {monthLabels[w]}
              </span>,
              ...week.map((key, d) => {
                if (!key) return <span key={`${w}-${d}`} aria-hidden="true" className="aspect-square" />;
                const data = byDate.get(key);
                const level = levelFor(data?.focused_seconds ?? 0);
                const selected = key === selectedDay;
                const label = `${formatDayLabel(key, { relative: false })}: ${
                  data ? summarizeDay({ count: data.count, seconds: data.focused_seconds, xp: data.xp }) : "no sessions"
                }`;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={label}
                    aria-pressed={selected}
                    title={label}
                    onClick={() => onSelectDay(key)}
                    onMouseEnter={() => setHoveredDay(key)}
                    onFocus={() => setHoveredDay(key)}
                    onBlur={() => setHoveredDay(null)}
                    className={`aspect-square w-full rounded-[3px] cursor-pointer transition-transform hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 ${
                      level === 0 ? "bg-gray-200 dark:bg-[var(--dark-3)]" : ""
                    }`}
                    style={{
                      backgroundColor: level > 0 ? hexToRgba(color, LEVEL_ALPHA[level]) : undefined,
                      outline: selected ? `2px solid ${color}` : undefined,
                      outlineOffset: selected ? 1 : undefined,
                    }}
                  />
                );
              }),
          ])}
        </div>
      </div>

      <div className="mt-3 flex min-h-5 flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-[var(--muted)]">
        <span aria-live="polite">
          {focusDay ? (
            <>
              <span className="font-semibold text-gray-700 dark:text-[var(--foreground)]">
                {formatDayLabel(focusDay, { relative: false })}
              </span>
              {" · "}
              {focusData
                ? summarizeDay({ count: focusData.count, seconds: focusData.focused_seconds, xp: focusData.xp })
                : "No sessions"}
            </>
          ) : (
            "Tap a day to see its sessions"
          )}
        </span>
        <span className="flex items-center gap-1" aria-hidden="true">
          Less
          {LEVEL_ALPHA.map((alpha, level) => (
            <span
              key={level}
              className={`h-[10px] w-[10px] rounded-[2px] ${level === 0 ? "bg-gray-200 dark:bg-[var(--dark-3)]" : ""}`}
              style={level > 0 ? { backgroundColor: hexToRgba(color, alpha) } : undefined}
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
