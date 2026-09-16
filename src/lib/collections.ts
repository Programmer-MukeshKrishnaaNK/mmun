/**
 * Firestore collection names in one place.
 *
 * EXISTING (already used by the original portal):
 *   users/{uid}          — delegate profile: name, committee, updatedAt
 *   help_requests/{id}   — userId, userName, userEmail, message, status, createdAt
 *
 * ADMIN INTEGRATION POINTS (read-only for delegates; written by the organizer
 * console). The UI shows honest empty states until these are populated.
 * Field shapes are documented in each service file and in README.md.
 *   conference/live      — organizer-controlled live session status
 *   schedule/{id}        — agenda events
 *   announcements/{id}   — organizer announcements
 *   documents/{id}       — official conference documents
 *   guide_sections/{id}  — optional override for the built-in guide content
 *   contacts/{id}        — organizer / secretariat contacts
 */
export const COLLECTIONS = {
  users: "users",
  helpRequests: "help_requests",
  conference: "conference",
  schedule: "schedule",
  announcements: "announcements",
  documents: "documents",
  news: "news",
  guideSections: "guide_sections",
  contacts: "contacts",

  /**
   * Written by the original portal and still holding the live conference
   * data. Read alongside the collections above so nothing has to be migrated
   * before the app is useful.
   */
  legacySchedule: "schedule_events",
  legacyActivity: "activity",
} as const;

export const LIVE_SESSION_DOC_ID = "live";
