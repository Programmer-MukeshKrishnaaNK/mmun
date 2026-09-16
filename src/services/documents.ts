import { collection } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/collections";
import { db } from "@/lib/db";
import { subscribeToQuery } from "@/lib/subscribe";
import type { ConferenceDocument, DocumentType, SubscriptionHandlers, Unsubscribe } from "@/types";
import { asDate, asEnum, asNumber, asString, asStringArray } from "@/utils/parse";

const TYPES: readonly DocumentType[] = [
  "agenda",
  "rules",
  "handbook",
  "study_guide",
  "committee",
  "announcement",
  "other",
];

function asHttpUrl(value: unknown): string | undefined {
  const s = asString(value);
  if (!s) return undefined;
  try {
    const url = new URL(s);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * ADMIN INTEGRATION POINT — documents/{id}
 *
 * {
 *   title:        string
 *   url:          string   // https link to the PDF / doc (e.g. Firebase Storage download URL)
 *   type?:        "agenda" | "rules" | "handbook" | "study_guide" | "committee" | "announcement" | "other"
 *   description?: string
 *   downloadable?: boolean // true → offer a download action using `url`
 *   downloadUrl?: string   // or a separate direct-download link
 *   committees?:  string[]
 *   order?:       number
 *   updatedAt?:   Timestamp
 *   published?:   boolean
 * }
 */
export function subscribeDocuments(handlers: SubscriptionHandlers<ConferenceDocument[]>): Unsubscribe {
  return subscribeToQuery(
    collection(db, COLLECTIONS.documents),
    (snap) => {
      const data = snap.data();
      const title = asString(data.title);
      const url = asHttpUrl(data.url);
      if (!title || !url || data.published === false) return null;
      return {
        id: snap.id,
        title,
        url,
        type: asEnum(data.type, TYPES, "other"),
        description: asString(data.description),
        downloadUrl: asHttpUrl(data.downloadUrl) ?? (data.downloadable === true ? url : undefined),
        committees: asStringArray(data.committees),
        order: asNumber(data.order, 1000),
        updatedAt: asDate(data.updatedAt),
      };
    },
    {
      next: (docs) => handlers.next(docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))),
      error: handlers.error,
    },
    { fallbackMessage: "Unable to load conference documents.", deniedAsEmpty: true },
  );
}
