import { ROUTES } from "@/constants/routes";
import type { Announcement, AppNotification, ScheduleEvent } from "@/types";
import { isBreakKind } from "@/utils/schedule";
import { MINUTE } from "@/utils/time";

const STARTING_WINDOW = 15 * MINUTE;
const ENDED_WINDOW = 30 * MINUTE;

/**
 * Notifications are derived from real data only: announcements, schedule
 * changes, and sessions starting/ending according to the published schedule.
 *
 * INTEGRATION POINT: direct organizer messages ("organizer_message") would come
 * from a future per-delegate collection (e.g. users/{uid}/notifications) and be
 * merged into this list.
 */
export function buildNotifications(
  announcements: Announcement[],
  events: ScheduleEvent[],
  now: Date,
): AppNotification[] {
  const t = now.getTime();
  const list: AppNotification[] = announcements.map((a) => ({
    id: `announcement:${a.id}`,
    kind: "announcement",
    title: a.title,
    body: a.message,
    createdAt: a.createdAt,
    href: ROUTES.home,
  }));

  for (const e of events) {
    if (e.changeNote && e.updatedAt) {
      list.push({
        id: `change:${e.id}:${e.updatedAt.getTime()}`,
        kind: "schedule_change",
        title: `Schedule change · ${e.title}`,
        body: e.changeNote,
        createdAt: e.updatedAt,
        href: ROUTES.planner,
      });
    }
    if (isBreakKind(e.kind)) continue;
    const untilStart = e.startAt.getTime() - t;
    if (untilStart > 0 && untilStart <= STARTING_WINDOW) {
      list.push({
        id: `starting:${e.id}`,
        kind: "session_starting",
        title: `${e.title} starts soon`,
        body: e.location,
        createdAt: new Date(e.startAt.getTime() - STARTING_WINDOW),
        href: ROUTES.planner,
      });
    }
    const sinceEnd = t - e.endAt.getTime();
    if (sinceEnd >= 0 && sinceEnd <= ENDED_WINDOW) {
      list.push({
        id: `ended:${e.id}`,
        kind: "session_ended",
        title: `${e.title} has ended`,
        createdAt: e.endAt,
        href: ROUTES.planner,
      });
    }
  }

  return list.filter((n) => n.createdAt.getTime() <= t).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Read state is per device (localStorage). Swap for a Firestore field if
// read receipts need to sync across devices.
const storageKey = (uid: string) => `gmun:notifications:lastSeen:${uid}`;

export function getLastSeen(uid: string): number {
  try {
    return Number(localStorage.getItem(storageKey(uid))) || 0;
  } catch {
    return 0;
  }
}

export function setLastSeen(uid: string, at: number): void {
  try {
    localStorage.setItem(storageKey(uid), String(at));
  } catch {
    /* storage unavailable — unread badge simply won't persist */
  }
}
