// Defensive readers for Firestore document data. Organizer-entered data can be
// incomplete, so every field is validated rather than cast.

export function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asStringArray(value: unknown): string[] {
  if (typeof value === "string") return asString(value) ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter((v): v is string => Boolean(v));
}

/** Accepts Firestore Timestamps, Dates, ISO strings and epoch millis. */
export function asDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const toDate = (value as { toDate: unknown }).toDate;
    if (typeof toDate === "function") {
      const d: unknown = toDate.call(value);
      return d instanceof Date ? d : undefined;
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const s = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

/** True if a record targeted at `committees` should be shown to a delegate in `committee`. */
export function appliesToCommittee(committees: string[], committee: string | undefined): boolean {
  if (committees.length === 0) return true;
  const keys = committees.map(normalizeKey);
  if (keys.includes("all")) return true;
  return committee ? keys.includes(normalizeKey(committee)) : false;
}
