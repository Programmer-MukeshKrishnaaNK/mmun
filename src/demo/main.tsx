// LOCAL DEMO MODE — sample data, no Firebase reads or writes. Served only by the dev server at /demo.
import { MotionConfig } from "framer-motion";
import { StrictMode, lazy, useCallback, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createMemoryRouter, useNavigate } from "react-router";
import { Wordmark } from "@/components/brand/Emblem";
import { Button } from "@/components/ui/Button";
import { ConferenceContext, type ConferenceData } from "@/context/ConferenceContext";
import { DemoContext, type DemoData } from "@/context/DemoContext";
import { NowProvider, useNow } from "@/context/NowContext";
import { AppShell } from "@/layouts/AppShell";
import type { AuthUser } from "@/services/auth";
import { buildNotifications } from "@/services/notifications";
import type { DelegateProfile, HelpRequest } from "@/types";
import { deriveSessionFromSchedule } from "@/utils/schedule";
import { buildDemoAnnouncements, buildDemoSchedule, demoDocuments, demoHelpRequests, demoProfile } from "./fixtures";
import "@/styles/index.css";

const HomePage = lazy(() => import("@/pages/HomePage"));
const PlannerPage = lazy(() => import("@/pages/PlannerPage"));
const HelpPage = lazy(() => import("@/pages/HelpPage"));
const GuidePage = lazy(() => import("@/pages/GuidePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));

const demoUser = { uid: demoProfile.uid, email: demoProfile.email, displayName: null } as unknown as AuthUser;
const loadedAt = Date.now();
const schedule = buildDemoSchedule(loadedAt);
const announcements = buildDemoAnnouncements(loadedAt);

function SignedOut() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-[80dvh] place-items-center px-6 text-center">
      <div>
        <Wordmark />
        <h1 className="mt-6 font-display text-3xl font-medium">You've signed out of the demo.</h1>
        <p className="mt-2 text-ink-soft">In the real portal this returns you to the sign-in page.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate("/home")}>Restart demo</Button>
          <a href="/login" className="inline-flex h-11 items-center rounded-lg border border-line-strong px-4 text-sm font-medium">
            Real sign-in page
          </a>
        </div>
      </div>
    </div>
  );
}

const router = createMemoryRouter(
  [
    { path: "/login", element: <SignedOut /> },
    {
      element: <AppShell />,
      children: [
        { path: "/home", element: <HomePage /> },
        { path: "/planner", element: <PlannerPage /> },
        { path: "/help", element: <HelpPage /> },
        { path: "/guide", element: <GuidePage /> },
        { path: "/notifications", element: <NotificationsPage /> },
      ],
    },
  ],
  { initialEntries: ["/home"] },
);

function DemoProviders() {
  const now = useNow();
  // Read-only: the demo profile can't be edited, same as the real app.
  const [profile] = useState<DelegateProfile>(demoProfile);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(demoHelpRequests);
  const [lastSeenAt, setLastSeenAt] = useState(0);

  const markNotificationsSeen = useCallback(() => setLastSeenAt(Date.now()), []);
  const noop = useCallback(() => {}, []);

  const notifications = useMemo(() => buildNotifications(announcements, schedule, now), [now]);

  const conference = useMemo<ConferenceData>(
    () => ({
      user: demoUser,
      profile: { status: "ready", data: profile },
      schedule: { status: "ready", data: schedule },
      session: { status: "ready", data: deriveSessionFromSchedule(schedule, now) },
      announcements: { status: "ready", data: announcements },
      notifications,
      unreadCount: notifications.filter((n) => n.createdAt.getTime() > lastSeenAt).length,
      lastSeenAt,
      markNotificationsSeen,
      retryProfile: noop,
      retrySchedule: noop,
      retryAnnouncements: noop,
    }),
    [profile, now, notifications, lastSeenAt, markNotificationsSeen, noop],
  );

  const demo = useMemo<DemoData>(
    () => ({
      documents: demoDocuments,
      helpRequests,
      submitHelp: async (input) => {
        await new Promise((r) => setTimeout(r, 700));
        setHelpRequests((prev) => [
          { id: `h${Date.now()}`, message: input.message.trim(), category: input.category, status: "Pending", createdAt: new Date() },
          ...prev,
        ]);
      },
    }),
    [helpRequests],
  );

  return (
    <DemoContext value={demo}>
      <ConferenceContext value={conference}>
        <div className="bg-brass-100 px-4 py-1.5 text-center text-xs font-medium text-brass-600">
          Demo mode · sample data · nothing is saved
        </div>
        <RouterProvider router={router} />
      </ConferenceContext>
    </DemoContext>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <NowProvider>
        <DemoProviders />
      </NowProvider>
    </MotionConfig>
  </StrictMode>,
);
