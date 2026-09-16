import type { AnnouncementPriority, DocumentType, EventTimeState, SessionStatus } from "@/types";

export const CONFERENCE = {
  shortName: "MMUN",
  fullName: "Mahatma Model United Nations",
  tagline: "Innovation to Unite Nations",
  portalName: "Delegate Portal",
} as const;

export type Tone = "live" | "amber" | "sky" | "rose" | "slate" | "brass";

export const SESSION_STATUS_META: Record<SessionStatus, { label: string; tone: Tone }> = {
  in_session: { label: "In session", tone: "live" },
  upcoming: { label: "Upcoming", tone: "sky" },
  break: { label: "On break", tone: "amber" },
  dismissed: { label: "Dismissed", tone: "rose" },
  completed: { label: "Completed", tone: "slate" },
};

export const EVENT_STATE_META: Record<EventTimeState, { label: string; tone: Tone }> = {
  now: { label: "Now", tone: "live" },
  next: { label: "Next", tone: "sky" },
  upcoming: { label: "Upcoming", tone: "slate" },
  completed: { label: "Completed", tone: "slate" },
};

export const PRIORITY_META: Record<AnnouncementPriority, { label: string; tone: Tone }> = {
  normal: { label: "Update", tone: "slate" },
  important: { label: "Important", tone: "amber" },
  urgent: { label: "Urgent", tone: "rose" },
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  agenda: "Agenda",
  rules: "Rules of Procedure",
  handbook: "Handbook",
  study_guide: "Study Guide",
  committee: "Committee",
  announcement: "Notice",
  other: "Document",
};

/** Display labels for users/{uid} fields. */
export const PROFILE_FIELD_LABELS = {
  committee: "Committee",
  country: "Country",
  position: "Position",
} as const;
