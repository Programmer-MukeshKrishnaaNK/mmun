export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDayLong(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

export function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Local-calendar day key, e.g. 2026-09-15. */
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** "1 h 15 min", "45 min", "under a minute" */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(Math.max(0, ms) / MINUTE);
  if (totalMinutes < 1) return "under a minute";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Countdown that rounds up so "ends in 1 min" never shows after it ended. */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  if (ms < MINUTE) return "under a minute";
  return formatDuration(Math.ceil(ms / MINUTE) * MINUTE);
}

/** "Starts in 25 min" when soon, otherwise "Starts Tue at 9:00 AM" / "Starts at 4:00 PM". */
export function formatStartsIn(start: Date, now: Date): string {
  const diff = start.getTime() - now.getTime();
  if (diff <= 0) return "Starting now";
  if (diff <= 3 * HOUR) return `Starts in ${formatCountdown(diff)}`;
  if (isSameDay(start, now)) return `Starts at ${formatTime(start)}`;
  return `Starts ${formatWeekdayShort(start)} at ${formatTime(start)}`;
}

export function formatRelative(date: Date, now: Date): string {
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (isSameDay(date, now)) return `Today, ${formatTime(date)}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Yesterday, ${formatTime(date)}`;
  return `${formatDateShort(date)}, ${formatTime(date)}`;
}
