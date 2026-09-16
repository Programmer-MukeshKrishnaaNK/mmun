import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { subscribeAnnouncements } from "@/services/announcements";
import type { AuthUser } from "@/services/auth";
import { subscribeDelegate } from "@/services/delegates";
import { buildNotifications, getLastSeen, setLastSeen } from "@/services/notifications";
import { subscribeSchedule } from "@/services/schedule";
import { subscribeLiveSession } from "@/services/session";
import type {
  Announcement,
  AppNotification,
  AsyncState,
  DelegateProfile,
  LiveSession,
  ScheduleEvent,
} from "@/types";
import { appliesToCommittee } from "@/utils/parse";
import { deriveSessionFromSchedule, sortEvents } from "@/utils/schedule";
import { useNow } from "./NowContext";

export interface ConferenceData {
  user: AuthUser;
  profile: AsyncState<DelegateProfile>;
  schedule: AsyncState<ScheduleEvent[]>;
  session: AsyncState<LiveSession | null>;
  announcements: AsyncState<Announcement[]>;
  notifications: AppNotification[];
  unreadCount: number;
  lastSeenAt: number;
  markNotificationsSeen: () => void;
  retryProfile: () => void;
  retrySchedule: () => void;
  retryAnnouncements: () => void;
}

export const ConferenceContext = createContext<ConferenceData | null>(null);

const LOADING = { status: "loading" } as const;

/**
 * Owns the app-wide real-time listeners (profile, schedule, live session,
 * announcements) so each is opened once per signed-in session, not per page.
 */
export function ConferenceProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  const now = useNow();

  const profileSub = useSubscription<DelegateProfile>(user.uid, (h) =>
    subscribeDelegate({ uid: user.uid, email: user.email, displayName: user.displayName }, h),
  );
  const scheduleSub = useSubscription("schedule", subscribeSchedule);
  const liveSub = useSubscription("live", subscribeLiveSession);
  const announcementSub = useSubscription("announcements", subscribeAnnouncements);

  const profileSettled = profileSub.state.status !== "loading";
  const committee = profileSub.state.status === "ready" ? profileSub.state.data.committee : undefined;

  const schedule = useMemo<AsyncState<ScheduleEvent[]>>(() => {
    if (scheduleSub.state.status !== "ready") return scheduleSub.state;
    if (!profileSettled) return LOADING;
    // Every event is general — the schedule is not committee-scoped.
    return { status: "ready", data: sortEvents(scheduleSub.state.data) };
  }, [scheduleSub.state, profileSettled]);

  const announcements = useMemo<AsyncState<Announcement[]>>(() => {
    if (announcementSub.state.status !== "ready") return announcementSub.state;
    if (!profileSettled) return LOADING;
    return {
      status: "ready",
      data: announcementSub.state.data.filter((a) => appliesToCommittee(a.committees, committee)),
    };
  }, [announcementSub.state, profileSettled, committee]);

  // Organizer-set status wins; otherwise derive from the published schedule.
  const session = useMemo<AsyncState<LiveSession | null>>(() => {
    if (liveSub.state.status === "loading") return LOADING;
    if (liveSub.state.status === "ready" && liveSub.state.data) return liveSub.state;
    if (schedule.status !== "ready") return schedule;
    return { status: "ready", data: deriveSessionFromSchedule(schedule.data, now) };
  }, [liveSub.state, schedule, now]);

  const [lastSeenAt, setLastSeenAt] = useState(() => getLastSeen(user.uid));

  const notifications = useMemo(
    () =>
      buildNotifications(
        announcements.status === "ready" ? announcements.data : [],
        schedule.status === "ready" ? schedule.data : [],
        now,
      ),
    [announcements, schedule, now],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.createdAt.getTime() > lastSeenAt).length,
    [notifications, lastSeenAt],
  );

  const markNotificationsSeen = useCallback(() => {
    const t = Date.now();
    setLastSeen(user.uid, t);
    setLastSeenAt(t);
  }, [user.uid]);

  const value = useMemo<ConferenceData>(
    () => ({
      user,
      profile: profileSub.state,
      schedule,
      session,
      announcements,
      notifications,
      unreadCount,
      lastSeenAt,
      markNotificationsSeen,
      retryProfile: profileSub.retry,
      retrySchedule: scheduleSub.retry,
      retryAnnouncements: announcementSub.retry,
    }),
    [
      user,
      profileSub.state,
      profileSub.retry,
      schedule,
      scheduleSub.retry,
      session,
      announcements,
      announcementSub.retry,
      notifications,
      unreadCount,
      lastSeenAt,
      markNotificationsSeen,
    ],
  );

  return <ConferenceContext value={value}>{children}</ConferenceContext>;
}

export function useConference(): ConferenceData {
  const ctx = useContext(ConferenceContext);
  if (!ctx) throw new Error("useConference must be used inside <ConferenceProvider>");
  return ctx;
}

/** The loaded profile, or undefined while loading / on error. */
export function useProfile(): DelegateProfile | undefined {
  const { profile } = useConference();
  return profile.status === "ready" ? profile.data : undefined;
}
