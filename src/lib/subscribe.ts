import {
  onSnapshot,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { SubscriptionHandlers, Unsubscribe } from "@/types";
import { isPermissionDenied, toAppError } from "@/utils/errors";

interface CollectionSubscribeOptions {
  fallbackMessage: string;
  /**
   * For organizer-managed collections that may not be provisioned yet: if
   * security rules deny access, render the empty state instead of an error.
   */
  deniedAsEmpty?: boolean;
}

export function subscribeToQuery<T>(
  q: Query<DocumentData>,
  parse: (snap: QueryDocumentSnapshot<DocumentData>) => T | null,
  handlers: SubscriptionHandlers<T[]>,
  { fallbackMessage, deniedAsEmpty = false }: CollectionSubscribeOptions,
): Unsubscribe {
  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        const item = parse(docSnap);
        if (item) items.push(item);
      });
      handlers.next(items);
    },
    (err) => {
      if (deniedAsEmpty && isPermissionDenied(err)) {
        if (import.meta.env.DEV) console.warn("[gmun] read denied, showing empty state:", q);
        handlers.next([]);
        return;
      }
      handlers.error(toAppError(err, fallbackMessage));
    },
  );
}
