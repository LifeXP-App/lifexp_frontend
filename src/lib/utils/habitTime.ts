// Time-of-day helpers for the habits "Today" list. Times are player-local
// 24h "HH:MM" strings (what the API stores); the UI shows 12h with A/M or P/M.

export const DEFAULT_TODAY_TIME = "12:00";
const DAY_MINUTES = 24 * 60;

export function timeToMinutes(time: string | null | undefined): number {
  const [h, m] = (time ?? DEFAULT_TODAY_TIME).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

// 24h "HH:MM" -> { hour12: 1-12, minute, pm }
export function to12Hour(time: string) {
  const minutes = timeToMinutes(time);
  const h24 = Math.floor(minutes / 60);
  return { hour12: h24 % 12 === 0 ? 12 : h24 % 12, minute: minutes % 60, pm: h24 >= 12 };
}

export function from12Hour(hour12: number, minute: number, pm: boolean): string {
  return minutesToTime(((hour12 % 12) + (pm ? 12 : 0)) * 60 + minute);
}

// +/- whole hours within the same day: null when that would pass 12:00 AM
// (before) or the 11 PM hour (after), so the Today list never wraps around.
export function stepHours(time: string, hours: number): string | null {
  const next = timeToMinutes(time) + hours * 60;
  return next < 0 || next >= DAY_MINUTES ? null : minutesToTime(next);
}

const floorToHour = (minutes: number) => Math.floor(minutes / 60) * 60;

// Default time for a habit dropped at `index` in a Today list whose other
// habits (excluding the dropped one) have these times, already sorted:
// - empty list: 12:00
// - above everything: 2h before the first, minutes stripped (min 00:00)
// - below everything: 2h after the last, minutes stripped (max 23:59)
// - between two: the middle hour of the two (falls back to the exact middle
//   when the whole hour would sort outside them, e.g. 2:35 and 3:10)
export function defaultTimeForIndex(sortedTimes: string[], index: number): string {
  const mins = sortedTimes.map(timeToMinutes);
  if (mins.length === 0) return DEFAULT_TODAY_TIME;
  if (index <= 0) return minutesToTime(Math.max(0, floorToHour(mins[0] - 120)));
  if (index >= mins.length) {
    return minutesToTime(Math.min(DAY_MINUTES - 1, floorToHour(mins[mins.length - 1] + 120)));
  }
  const above = mins[index - 1];
  const below = mins[index];
  const middle = (above + below) / 2;
  const hour = floorToHour(middle);
  return minutesToTime(hour > above && hour < below ? hour : Math.floor(middle));
}
