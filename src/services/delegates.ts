import { doc, onSnapshot } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/collections";
import { db } from "@/lib/db";
import type { DelegateProfile, SubscriptionHandlers, Unsubscribe } from "@/types";
import { toAppError } from "@/utils/errors";
import { asDate, asString } from "@/utils/parse";

interface AuthIdentity {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/** Real-time listener on users/{uid} (schema: name, committee, updatedAt). */
export function subscribeDelegate(
  identity: AuthIdentity,
  handlers: SubscriptionHandlers<DelegateProfile>,
): Unsubscribe {
  const fallbackName = identity.displayName ?? identity.email ?? "Delegate";
  return onSnapshot(
    doc(db, COLLECTIONS.users, identity.uid),
    (snap) => {
      const data = snap.data({ serverTimestamps: "estimate" }) ?? {};
      handlers.next({
        uid: identity.uid,
        email: identity.email,
        exists: snap.exists(),
        name: asString(data.name) ?? fallbackName,
        committee: asString(data.committee),
        country: asString(data.country),
        position: asString(data.position),
        updatedAt: asDate(data.updatedAt),
      });
    },
    (err) => handlers.error(toAppError(err, "Unable to load your delegate profile. Please try again.")),
  );
}

/*
 * There is deliberately no write function here. Delegates cannot change their
 * own profile — assignments come from the organizers, and firestore.rules
 * denies client writes to users/{uid} outright. If a delegate's details are
 * wrong they raise it through the Help page.
 */
