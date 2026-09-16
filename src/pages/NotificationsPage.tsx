import { motion } from "framer-motion";
import { BellOff, CalendarClock, CircleCheck, Mail, Megaphone, Radio, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { useConference } from "@/context/ConferenceContext";
import { useNow } from "@/context/NowContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { AppNotification, NotificationKind } from "@/types";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/time";

const KIND_META: Record<NotificationKind, { icon: LucideIcon; className: string }> = {
  announcement: { icon: Megaphone, className: "bg-brass-100 text-brass-600" },
  schedule_change: { icon: CalendarClock, className: "bg-amber-soft text-amber" },
  session_starting: { icon: Radio, className: "bg-sky-soft text-sky" },
  session_ended: { icon: CircleCheck, className: "bg-slate-soft text-slate" },
  organizer_message: { icon: Mail, className: "bg-navy-100 text-navy-700" },
};

export default function NotificationsPage() {
  usePageTitle("Notifications");
  const { notifications, lastSeenAt, markNotificationsSeen, announcements, schedule } = useConference();
  const now = useNow();
  // Snapshot the previous "last seen" so items stay highlighted while the page is open.
  const [seenBefore] = useState(lastSeenAt);

  useEffect(() => {
    markNotificationsSeen();
  }, [markNotificationsSeen, notifications.length]);

  const loading = announcements.status === "loading" || schedule.status === "loading";

  return (
    <>
      <PageHeader eyebrow="Inbox" title="Notifications" description="Announcements, schedule changes and session alerts." />

      <div className="mt-6 max-w-2xl">
        {loading ? (
          <Panel className="divide-y divide-line" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3 p-4">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </Panel>
        ) : notifications.length === 0 ? (
          <Panel>
            <EmptyState
              icon={BellOff}
              title="You're all caught up."
              description="New announcements, schedule changes and session alerts will appear here."
            />
          </Panel>
        ) : (
          <Panel>
            <ul className="divide-y divide-line">
              {notifications.map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.25) }}
                >
                  <NotificationRow notification={n} unread={n.createdAt.getTime() > seenBefore} now={now} />
                </motion.li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}

function NotificationRow({ notification: n, unread, now }: { notification: AppNotification; unread: boolean; now: Date }) {
  const meta = KIND_META[n.kind];
  const Icon = meta.icon;
  const content = (
    <div className="flex gap-3.5 px-4 py-3.5">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", meta.className)}>
        <Icon className="size-4" strokeWidth={1.9} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("leading-snug text-pretty", unread ? "font-semibold text-ink" : "font-medium text-ink")}>
          {n.title}
          {unread && <span className="sr-only"> (new)</span>}
        </p>
        {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{n.body}</p>}
        <p className="mt-1 text-xs text-ink-faint">
          <time dateTime={n.createdAt.toISOString()}>{formatRelative(n.createdAt, now)}</time>
        </p>
      </div>
      {unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-rose" aria-hidden />}
    </div>
  );
  return n.href ? (
    <Link to={n.href} className="block transition-colors hover:bg-paper/70">
      {content}
    </Link>
  ) : (
    content
  );
}
