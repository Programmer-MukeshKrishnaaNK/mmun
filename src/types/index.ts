// ─── Async ────────────────────────────────────────────────────────────────

export interface AppError {
  code: string;
  message: string;
}

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: AppError }
  | { status: "ready"; data: T };

export interface SubscriptionHandlers<T> {
  next: (data: T) => void;
  error: (error: AppError) => void;
}

export type Unsubscribe = () => void;

// ─── Delegate ─────────────────────────────────────────────────────────────

export interface DelegateProfile {
  uid: string;
  email: string | null;
  /** Display name — Firestore `name`, falling back to auth display name / email. */
  name: string;
  /** False when users/{uid} has not been created yet. */
  exists: boolean;
  committee?: string;
  /** Optional future assignment fields — shown only when present. */
  country?: string;
  position?: string;
  updatedAt?: Date;
}

// ─── Live session ─────────────────────────────────────────────────────────

export type SessionStatus = "in_session" | "upcoming" | "break" | "dismissed" | "completed";

export interface LiveSession {
  status: SessionStatus;
  title?: string;
  detail?: string;
  location?: string;
  startsAt?: Date;
  endsAt?: Date;
  updatedAt?: Date;
  /** `organizer` = set live by the admin console; `schedule` = derived from the published schedule. */
  source: "organizer" | "schedule";
}

// ─── Schedule ─────────────────────────────────────────────────────────────

export type ScheduleEventKind = "session" | "ceremony" | "break" | "meal" | "social" | "other";

export interface ScheduleEvent {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  kind: ScheduleEventKind;
  location?: string;
  description?: string;
  /** Organizer note when the event was changed (e.g. "Moved to Hall B"). */
  changeNote?: string;
  updatedAt?: Date;
}

export type EventTimeState = "now" | "next" | "upcoming" | "completed";

export interface ScheduleDay {
  key: string;
  date: Date;
  /** 1-based conference day number. */
  index: number;
  events: ScheduleEvent[];
}

// ─── Announcements ────────────────────────────────────────────────────────

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  message?: string;
  priority: AnnouncementPriority;
  createdAt: Date;
  committees: string[];
}

// ─── Documents ────────────────────────────────────────────────────────────

export type DocumentType =
  | "agenda"
  | "rules"
  | "handbook"
  | "study_guide"
  | "committee"
  | "announcement"
  | "other";

export interface ConferenceDocument {
  id: string;
  title: string;
  type: DocumentType;
  url: string;
  description?: string;
  /** Present when a separate direct-download link is supported. */
  downloadUrl?: string;
  committees: string[];
  order: number;
  updatedAt?: Date;
}

// ─── Newspaper ────────────────────────────────────────────────────────────

export type NewsCategory =
  | "briefing"
  | "committee"
  | "interview"
  | "opinion"
  | "feature"
  | "notice";

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  /** Short standfirst shown in the list. Falls back to the first line of body. */
  summary?: string;
  author?: string;
  category: NewsCategory;
  coverUrl?: string;
  publishedAt: Date;
  updatedAt?: Date;
}

// ─── Help ─────────────────────────────────────────────────────────────────

export type HelpCategory = "general" | "procedure" | "logistics" | "technical" | "other";

export interface HelpRequestInput {
  message: string;
  category: HelpCategory;
}

export interface HelpRequest {
  id: string;
  message: string;
  status: string;
  category?: HelpCategory;
  createdAt?: Date;
}

// ─── Guide ────────────────────────────────────────────────────────────────

export type GuideIcon = "landmark" | "users" | "gavel" | "scroll" | "info" | "help";

export interface GuideItem {
  id: string;
  title: string;
  body: string;
}

export interface GuideSection {
  id: string;
  title: string;
  icon: GuideIcon;
  items: GuideItem[];
  order: number;
}

export interface Contact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  order: number;
}

// ─── Notifications ────────────────────────────────────────────────────────

export type NotificationKind =
  | "announcement"
  | "schedule_change"
  | "session_starting"
  | "session_ended"
  | "organizer_message";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  createdAt: Date;
  href?: string;
}
