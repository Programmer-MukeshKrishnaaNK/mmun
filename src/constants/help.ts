import type { HelpCategory } from "@/types";

export const HELP_CATEGORY_LABELS: Record<HelpCategory, string> = {
  general: "General",
  procedure: "Procedure",
  logistics: "Logistics",
  technical: "Portal / Tech",
  other: "Other",
};

export const HELP_CATEGORY_HINTS: Record<HelpCategory, string> = {
  general: "Anything about the conference",
  procedure: "Motions, points, voting, resolutions",
  logistics: "Venue, timings, food, materials",
  technical: "Trouble with this portal",
  other: "Something else",
};
