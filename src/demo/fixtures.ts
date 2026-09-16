// SAMPLE DATA for local demo mode only. Never used by the real app.
import type { Announcement, ConferenceDocument, DelegateProfile, HelpRequest, ScheduleEvent } from "@/types";

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

export function buildDemoSchedule(base = Date.now()): ScheduleEvent[] {
  const at = (offsetMin: number) => new Date(base + offsetMin * MIN);
  const ev = (id: string, title: string, start: number, end: number, extra: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
    id,
    title,
    startAt: at(start),
    endAt: at(end),
    kind: "session",
    ...extra,
  });
  const y = -DAY / MIN;
  const t = DAY / MIN;
  return [
    // Yesterday
    ev("d1-1", "Registration & Opening Ceremony", y - 180, y - 90, { kind: "ceremony", location: "Main Auditorium" }),
    ev("d1-2", "Committee Session I", y - 75, y + 45, { location: "UNGA Hall" }),
    ev("d1-3", "Delegate Social", y + 60, y + 150, { kind: "social", location: "Courtyard" }),
    // Today — built around "now" so live states are visible
    ev("d2-1", "Committee Session II", -210, -120, { location: "UNGA Hall" }),
    ev("d2-2", "Lunch", -120, -75, { kind: "meal", location: "Dining Hall" }),
    ev("d2-3", "Committee Session III", -55, 20, {
      location: "UNGA Hall",
      description: "General Speakers' List, followed by a moderated caucus on the agenda.",
    }),
    ev("d2-4", "Break", 20, 35, { kind: "break" }),
    ev("d2-5", "Committee Session IV", 35, 140, {
      location: "Hall B",
      changeNote: "Moved from UNGA Hall to Hall B.",
      updatedAt: at(-6),
    }),
    // Tomorrow
    ev("d3-1", "Committee Session V", t - 120, t, { location: "UNGA Hall" }),
    ev("d3-2", "Voting Procedure", t + 15, t + 90, { location: "UNGA Hall" }),
    ev("d3-3", "Closing Ceremony", t + 120, t + 210, { kind: "ceremony", location: "Main Auditorium" }),
  ];
}

export const demoProfile: DelegateProfile = {
  uid: "demo-delegate",
  email: "demo.delegate@example.com",
  exists: true,
  name: "Demo Delegate",
  committee: "UNGA — DISEC",
};

export function buildDemoAnnouncements(base = Date.now()): Announcement[] {
  return [
    {
      id: "a1",
      title: "Venue change for Committee Session IV",
      message: "Session IV will be held in Hall B. Please carry your placards.",
      priority: "urgent",
      committees: [],
    createdAt: new Date(base - 6 * MIN),
    },
    {
      id: "a2",
      title: "Position papers due by 5 PM",
      message: "Submit to your Executive Board by email.",
      priority: "important",
      committees: [],
    createdAt: new Date(base - 95 * MIN),
    },
    { id: "a3", title: "Lunch is served in the Dining Hall", priority: "normal", createdAt: new Date(base - 125 * MIN), committees: [] },
  ];
}

// Placeholder links (example.com) — there are no real demo PDFs.
export const demoDocuments: ConferenceDocument[] = [
  { id: "doc1", title: "Conference Agenda", type: "agenda", url: "https://example.com/", description: "All days", committees: [], order: 1 },
  { id: "doc2", title: "Rules of Procedure", type: "rules", url: "https://example.com/", downloadUrl: "https://example.com/", committees: [], order: 2 },
  { id: "doc3", title: "DISEC Study Guide", type: "study_guide", url: "https://example.com/", description: "Committee background", committees: [], order: 3 },
];

export const demoHelpRequests: HelpRequest[] = [
  {
    id: "h1",
    message: "Can we use laptops during unmoderated caucus?",
    status: "Resolved",
    category: "procedure",
    createdAt: new Date(Date.now() - 180 * MIN),
  },
];
