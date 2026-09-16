import type { EventTimeState, LiveSession, ScheduleDay, ScheduleEvent } from "@/types";
import { HOUR, dayKey, startOfDay } from "./time";

// All schedule maths works on absolute timestamps, so events that cross
// midnight (e.g. 22:00 → 01:00) are "now" at 00:30 without special-casing.
// Such events are grouped under the day they start.

export function sortEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  return [...events].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime() || a.endAt.getTime() - b.endAt.getTime(),
  );
}

export function isOngoing(event: ScheduleEvent, now: Date): boolean {
  const t = now.getTime();
  return event.startAt.getTime() <= t && t < event.endAt.getTime();
}

export interface TimelineSnapshot {
  current: ScheduleEvent[];
  next?: ScheduleEvent;
  states: Map<string, EventTimeState>;
}

/** Expects events sorted by start time. */
export function buildTimelineSnapshot(events: ScheduleEvent[], now: Date): TimelineSnapshot {
  const t = now.getTime();
  const current = events.filter((e) => isOngoing(e, now));
  const next = events.find((e) => e.startAt.getTime() > t);
  const states = new Map<string, EventTimeState>();
  for (const e of events) {
    if (e.endAt.getTime() <= t) states.set(e.id, "completed");
    else if (e.startAt.getTime() <= t) states.set(e.id, "now");
    else if (next && e.id === next.id) states.set(e.id, "next");
    else states.set(e.id, "upcoming");
  }
  return { current, next, states };
}

export function groupEventsByDay(events: ScheduleEvent[]): ScheduleDay[] {
  const map = new Map<string, ScheduleEvent[]>();
  for (const e of events) {
    const key = dayKey(e.startAt);
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list], i) => ({ key, date: startOfDay(list[0].startAt), index: i + 1, events: list }));
}

/** Today if scheduled, otherwise the next day with remaining events, otherwise the last day. */
export function pickDefaultDayKey(days: ScheduleDay[], now: Date): string | undefined {
  if (days.length === 0) return undefined;
  const today = dayKey(now);
  if (days.some((d) => d.key === today)) return today;
  const upcoming = days.find((d) => d.events.some((e) => e.endAt.getTime() > now.getTime()));
  return (upcoming ?? days[days.length - 1]).key;
}

export function eventProgress(event: ScheduleEvent | { startAt: Date; endAt: Date }, now: Date): number {
  const total = event.endAt.getTime() - event.startAt.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - event.startAt.getTime()) / total));
}

const BREAK_KINDS = new Set<ScheduleEvent["kind"]>(["break", "meal"]);

export function isBreakKind(kind: ScheduleEvent["kind"]): boolean {
  return BREAK_KINDS.has(kind);
}

/**
 * Fallback live status when the organizer hasn't set conference/live.
 * Derived only from the real published schedule — never invented.
 */
export function deriveSessionFromSchedule(events: ScheduleEvent[], now: Date): LiveSession | null {
  if (events.length === 0) return null;
  const { current, next } = buildTimelineSnapshot(events, now);

  if (current.length > 0) {
    const e = current[current.length - 1];
    return {
      status: isBreakKind(e.kind) ? "break" : "in_session",
      title: e.title,
      location: e.location,
      startsAt: e.startAt,
      endsAt: e.endAt,
      source: "schedule",
    };
  }

  if (next) {
    const hasPast = events.some((e) => e.endAt.getTime() <= now.getTime());
    const soon = next.startAt.getTime() - now.getTime() <= 12 * HOUR;
    return {
      status: hasPast && !soon ? "dismissed" : "upcoming",
      title: next.title,
      location: next.location,
      startsAt: next.startAt,
      endsAt: next.endAt,
      source: "schedule",
    };
  }

  return { status: "completed", source: "schedule" };
}
