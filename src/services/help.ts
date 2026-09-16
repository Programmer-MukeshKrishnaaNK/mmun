import { addDoc, collection, limit, query, serverTimestamp, where } from "firebase/firestore";
import { HELP_CATEGORY_LABELS } from "@/constants/help";
import { COLLECTIONS } from "@/lib/collections";
import { db } from "@/lib/db";
import { subscribeToQuery } from "@/lib/subscribe";
import type {
  HelpCategory,
  HelpRequest,
  HelpRequestInput,
  SubscriptionHandlers,
  Unsubscribe,
} from "@/types";
import { isPermissionDenied } from "@/utils/errors";
import { asDate, asString } from "@/utils/parse";

interface Requester {
  uid: string;
  name: string;
  email: string | null;
}

export const HELP_MESSAGE_MAX = 1000;

/**
 * Writes to help_requests using the EXISTING schema:
 * userId, userName, userEmail, message, status: "Pending", createdAt.
 *
 * `category` is an additive field. If the project's security rules only allow
 * the original keys, we retry with the original schema and prefix the category
 * into the message so no information is lost.
 */
export async function submitHelpRequest(requester: Requester, input: HelpRequestInput): Promise<void> {
  const message = input.message.trim().slice(0, HELP_MESSAGE_MAX);
  const base = {
    userId: requester.uid,
    userName: requester.name,
    userEmail: requester.email,
    message,
    status: "Pending",
    createdAt: serverTimestamp(),
  };
  const ref = collection(db, COLLECTIONS.helpRequests);
  try {
    await addDoc(ref, { ...base, category: input.category });
  } catch (err) {
    if (!isPermissionDenied(err)) throw err;
    await addDoc(ref, { ...base, message: `[${HELP_CATEGORY_LABELS[input.category]}] ${message}` });
  }
}

const CATEGORY_KEYS = Object.keys(HELP_CATEGORY_LABELS) as HelpCategory[];

/** The delegate's own recent requests. Hidden quietly if rules don't allow reads. */
export function subscribeMyHelpRequests(uid: string, handlers: SubscriptionHandlers<HelpRequest[]>): Unsubscribe {
  return subscribeToQuery(
    query(collection(db, COLLECTIONS.helpRequests), where("userId", "==", uid), limit(25)),
    (snap) => {
      const data = snap.data({ serverTimestamps: "estimate" });
      const message = asString(data.message);
      if (!message) return null;
      const category = CATEGORY_KEYS.find((c) => c === data.category);
      return {
        id: snap.id,
        message,
        status: asString(data.status) ?? "Pending",
        category,
        createdAt: asDate(data.createdAt),
      };
    },
    {
      next: (items) =>
        handlers.next(items.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))),
      error: handlers.error,
    },
    { fallbackMessage: "Unable to load your previous requests." },
  );
}
