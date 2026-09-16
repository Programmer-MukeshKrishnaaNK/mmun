import { collection, limit, orderBy, query } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/collections";
import { db } from "@/lib/db";
import { subscribeToQuery } from "@/lib/subscribe";
import type { Announcement, AnnouncementPriority, SubscriptionHandlers, Unsubscribe } from "@/types";
import { asDate, asEnum, asString, asStringArray } from "@/utils/parse";

const PRIORITIES: readonly AnnouncementPriority[] = ["normal", "important", "urgent"];

/**
 * The original portal only had NORMAL and HIGH. "high" isn't one of this app's
 * priorities, so without this it would quietly fall back to "normal" and an
 * urgent notice would render as a routine one.
 */
function readPriority(value: unknown): AnnouncementPriority {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "high") return "urgent";
  return asEnum(value, PRIORITIES, "normal");
}

/**
 * ADMIN INTEGRATION POINT — announcements/{id}
 *
 * {
 *   title:       string
 *   message?:    string
 *   priority?:   "normal" | "important" | "urgent"
 *   createdAt:   Timestamp
 *   committees?: string[]   // omit or [] for everyone
 *   published?:  boolean
 * }
 */
export function subscribeAnnouncements(handlers: SubscriptionHandlers<Announcement[]>): Unsubscribe {
  return subscribeToQuery(
    query(collection(db, COLLECTIONS.announcements), orderBy("createdAt", "desc"), limit(50)),
    (snap) => {
      const data = snap.data({ serverTimestamps: "estimate" });
      // `content` is the original portal's field for the announcement body.
      const title = asString(data.title) ?? asString(data.content) ?? asString(data.message);
      const createdAt = asDate(data.createdAt);
      if (!title || !createdAt || data.published === false) return null;
      return {
        id: snap.id,
        title,
        message: asString(data.title) ? asString(data.message) : undefined,
        priority: readPriority(data.priority),
        createdAt,
        committees: asStringArray(data.committees),
      };
    },
    handlers,
    { fallbackMessage: "Unable to load announcements.", deniedAsEmpty: true },
  );
}
