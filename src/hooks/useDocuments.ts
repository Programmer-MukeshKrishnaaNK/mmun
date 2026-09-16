import { useMemo } from "react";
import { useConference } from "@/context/ConferenceContext";
import { useDemo } from "@/context/DemoContext";
import { subscribeDocuments } from "@/services/documents";
import type { AsyncState, ConferenceDocument } from "@/types";
import { appliesToCommittee } from "@/utils/parse";
import { useSubscription } from "./useSubscription";

export function useDocuments(): { state: AsyncState<ConferenceDocument[]>; retry: () => void } {
  const demo = useDemo();
  const { profile } = useConference();
  const { state, retry } = useSubscription(demo ? null : "documents", subscribeDocuments);
  const committee = profile.status === "ready" ? profile.data.committee : undefined;
  const settled = profile.status !== "loading";

  const filtered = useMemo<AsyncState<ConferenceDocument[]>>(() => {
    if (demo) return { status: "ready", data: demo.documents };
    if (state.status !== "ready") return state;
    if (!settled) return { status: "loading" };
    return { status: "ready", data: state.data.filter((d) => appliesToCommittee(d.committees, committee)) };
  }, [demo, state, settled, committee]);

  return { state: filtered, retry };
}
