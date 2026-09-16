import { createContext, useContext } from "react";
import type { ConferenceDocument, HelpRequest, HelpRequestInput } from "@/types";

/**
 * Local demo mode only (demo.html, dev server). When present, the few
 * components that read/write Firestore outside ConferenceContext use this
 * in-memory data instead. It is always null in the real app.
 */
export interface DemoData {
  documents: ConferenceDocument[];
  helpRequests: HelpRequest[];
  submitHelp: (input: HelpRequestInput) => Promise<void>;
}

export const DemoContext = createContext<DemoData | null>(null);

export function useDemo(): DemoData | null {
  return useContext(DemoContext);
}
