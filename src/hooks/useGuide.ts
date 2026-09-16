import { useCallback, useEffect, useState } from "react";
import { fetchGuideContent, type GuideContent } from "@/services/guide";
import type { AsyncState } from "@/types";
import { toAppError } from "@/utils/errors";

export function useGuide(): { state: AsyncState<GuideContent>; retry: () => void } {
  const [state, setState] = useState<AsyncState<GuideContent>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((prev) => (prev.status === "loading" ? prev : { status: "loading" }));
    fetchGuideContent()
      .then((data) => active && setState({ status: "ready", data }))
      .catch((err: unknown) =>
        active && setState({ status: "error", error: toAppError(err, "Unable to load the guide. Please try again.") }),
      );
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
