import { collection, onSnapshot, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/collections";
import { db } from "@/lib/db";
import type { ScheduleEvent, ScheduleEventKind, SubscriptionHandlers, Unsubscribe } from "@/types";
import { isPermissionDenied, toAppError } from "@/utils/errors";
import { asDate, asEnum, asString } from "@/utils/parse";

const KINDS: readonly ScheduleEventKind[] = ["session", "ceremony", "break", "meal", "social", "other"];

/**
 * ADMIN INTEGRATION POINT — schedule/{eventId}
 *
 * {
 *   title:       string
 *   startAt:     Timestamp
 *   endAt:       Timestamp
 *   kind?:       "session" | "ceremony" | "break" | "meal" | "social" | "other"
 *   location?:   string
 *   description?: string
 *   changeNote?: string     // shown to delegates when an event is changed
 *   updatedAt?:  Timestamp
 *   published?:  boolean    // false hides a draft
 * }
 */
function parseEvent(snap: QueryDocumentSnapshot<DocumentData>): ScheduleEvent | null {
  const data = snap.data({ serverTimestamps: "estimate" });
  const title = asString(data.title);
  const startAt = asDate(data.startAt);
  const endAt = asDate(data.endAt);
  if (!title || !startAt || !endAt || endAt <= startAt || data.published === false) return null;
  return {
    id: snap.id,
    title,
    startAt,
    endAt,
    kind: asEnum(data.kind, KINDS, "session"),
    location: asString(data.location),
    description: asString(data.description),
    changeNote: asString(data.changeNote),
    updatedAt: asDate(data.updatedAt),
  };
}

/**
 * LEGACY — schedule_events/{eventId}, written by the original portal.
 *
 * Same event, different spelling: `startTime`/`endTime` instead of
 * `startAt`/`endAt`, `type` instead of `kind`, `notes` instead of
 * `description`, and a separate `changed` boolean guarding `changeNote`.
 *
 * Read so the conference works without migrating anything first. Once these
 * are gone the function and its collection can go with them.
 */
function parseLegacyEvent(snap: QueryDocumentSnapshot<DocumentData>): ScheduleEvent | null {
  const data = snap.data({ serverTimestamps: "estimate" });
  const title = asString(data.title);
  const startAt = asDate(data.startTime);
  const endAt = asDate(data.endTime);
  if (!title || !startAt || !endAt || endAt <= startAt || data.published === false) return null;
  return {
    id: `legacy:${snap.id}`,
    title,
    startAt,
    endAt,
    // asEnum lowercases, so the legacy "SESSION" / "MEAL" / "BREAK" land on
    // the matching kinds without a translation table.
    kind: asEnum(data.type, KINDS, "session"),
    location: asString(data.location),
    description: asString(data.notes) ?? asString(data.description),
    changeNote: data.changed === true || asString(data.changeNote) ? asString(data.changeNote) : undefined,
    updatedAt: asDate(data.updatedAt),
  };
}

/**
 * Both collections, merged into one stream. Either can be empty or denied
 * without taking the other down: an organizer mid-migration sees both, and a
 * project that never had the legacy collection just sees the new one.
 */
export function subscribeSchedule(handlers: SubscriptionHandlers<ScheduleEvent[]>): Unsubscribe {
  let current: ScheduleEvent[] = [];
  let legacy: ScheduleEvent[] = [];
  let currentReady = false;
  let legacyReady = false;

  // Hold the first emit until both sides have reported, so the planner doesn't
  // flash "no schedule" before the second collection arrives.
  const emit = () => {
    if (!currentReady || !legacyReady) return;
    handlers.next(
      [...current, ...legacy].sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    );
  };

  const read = (
    name: string,
    parse: (snap: QueryDocumentSnapshot<DocumentData>) => ScheduleEvent | null,
    assign: (rows: ScheduleEvent[]) => void,
    markReady: () => void,
  ): Unsubscribe =>
    onSnapshot(
      collection(db, name),
      (snapshot) => {
        const rows: ScheduleEvent[] = [];
        snapshot.forEach((docSnap) => {
          const parsed = parse(docSnap);
          if (parsed) rows.push(parsed);
        });
        assign(rows);
        markReady();
        emit();
      },
      (err) => {
        // A missing or locked-down collection is not an error for the delegate:
        // it just contributes nothing.
        if (isPermissionDenied(err)) {
          assign([]);
          markReady();
          emit();
          return;
        }
        handlers.error(toAppError(err, "Unable to load the schedule. Please try again."));
      },
    );

  const stopCurrent = read(
    COLLECTIONS.schedule,
    parseEvent,
    (rows) => (current = rows),
    () => (currentReady = true),
  );
  const stopLegacy = read(
    COLLECTIONS.legacySchedule,
    parseLegacyEvent,
    (rows) => (legacy = rows),
    () => (legacyReady = true),
  );

  return () => {
    stopCurrent();
    stopLegacy();
  };
}
