import { useEffect } from "react";
import { CONFERENCE } from "@/constants/conference";

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${CONFERENCE.shortName}`;
  }, [title]);
}
