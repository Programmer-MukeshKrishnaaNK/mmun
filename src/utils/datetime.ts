// Conversions between Firestore Timestamps and <input type="datetime-local">.
// The input has no timezone, so both directions work in the organizer's local
// time — which is what they mean when they type "14:20".

import { Timestamp } from "firebase/firestore";

/** Date -> "2026-09-26T11:21". Empty string when there's no date. */
export function toDateTimeLocal(date: Date | undefined): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** "2026-09-26T11:21" -> Timestamp. Null for empty or unparseable input. */
export function toTimestamp(value: string): Timestamp | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
}

/** "UNGA, UNSC" -> ["UNGA","UNSC"]. An empty array means "every delegate". */
export function parseCommittees(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
