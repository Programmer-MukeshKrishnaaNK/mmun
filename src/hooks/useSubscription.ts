import { useCallback, useEffect, useRef, useState } from "react";
import type { AsyncState, SubscriptionHandlers, Unsubscribe } from "@/types";

/**
 * Binds a service-layer real-time subscription to component state.
 * Resubscribes when `key` changes (pass null to pause) and unsubscribes on unmount.
 */
export function useSubscription<T>(
  key: string | null,
  subscribe: (handlers: SubscriptionHandlers<T>) => Unsubscribe,
): { state: AsyncState<T>; retry: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const subscribeRef = useRef(subscribe);

  useEffect(() => {
    subscribeRef.current = subscribe;
  });

  useEffect(() => {
    if (key === null) return;
    let active = true;
    setState((prev) => (prev.status === "loading" ? prev : { status: "loading" }));
    const unsubscribe = subscribeRef.current({
      next: (data) => active && setState({ status: "ready", data }),
      error: (error) => active && setState({ status: "error", error }),
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
