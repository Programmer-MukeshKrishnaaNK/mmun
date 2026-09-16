import { doc, onSnapshot } from "firebase/firestore";
import { COLLECTIONS, LIVE_SESSION_DOC_ID } from "@/lib/collections";
import { db } from "@/lib/db";
import type { LiveSession, SessionStatus, SubscriptionHandlers, Unsubscribe } from "@/types";
import { isPermissionDenied, toAppError } from "@/utils/errors";
import { asDate, asString } from "@/utils/parse";

export const SESSION_STATUSES: readonly SessionStatus[] = [
  "in_session",
  "upcoming",
  "break",
  "dismissed",
  "completed",
];

/**
 * ADMIN INTEGRATION POINT — conference/live
 *
 * {
 *   status:   "in_session" | "upcoming" | "break" | "dismissed" | "completed",
 *   title?:   string       // "General Speakers List"
 *   detail?:  string       // "Agenda: Climate finance"
 *   location?: string
 *   startsAt?: Timestamp
 *   endsAt?:   Timestamp
 *   updatedAt: Timestamp
 * }
 *
 * Emits `null` when the organizer hasn't set a status — the UI then falls back
 * to the published schedule (see deriveSessionFromSchedule).
 */
export function subscribeLiveSession(handlers: SubscriptionHandlers<LiveSession | null>): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTIONS.conference, LIVE_SESSION_DOC_ID),
    (snap) => {
      const data = snap.data({ serverTimestamps: "estimate" });
      const raw = typeof data?.status === "string" ? data.status.trim().toLowerCase().replace(/[\s-]+/g, "_") : "";
      if (!data || !(SESSION_STATUSES as readonly string[]).includes(raw)) {
        handlers.next(null);
        return;
      }
      handlers.next({
        status: raw as SessionStatus,
        title: asString(data.title),
        detail: asString(data.detail),
        location: asString(data.location),
        startsAt: asDate(data.startsAt),
        endsAt: asDate(data.endsAt),
        updatedAt: asDate(data.updatedAt),
        source: "organizer",
      });
    },
    (err) => {
      if (isPermissionDenied(err)) handlers.next(null);
      else handlers.error(toAppError(err, "Unable to load the live session status."));
    },
  );
}
