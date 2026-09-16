import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Radio } from "lucide-react";
import { StatusDot } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TONE_CLASSES } from "@/components/ui/tone";
import { SESSION_STATUS_META } from "@/constants/conference";
import { useConference } from "@/context/ConferenceContext";
import { useNow } from "@/context/NowContext";
import type { LiveSession } from "@/types";
import { cn } from "@/utils/cn";
import { eventProgress } from "@/utils/schedule";
import { formatCountdown, formatStartsIn, formatTime } from "@/utils/time";

const FALLBACK_HEADLINE: Record<LiveSession["status"], string> = {
  in_session: "Committee in session",
  upcoming: "Starting soon",
  break: "On break",
  dismissed: "Committee dismissed",
  completed: "The conference has concluded",
};

export function LiveStatusCard() {
  const { session, retrySchedule } = useConference();
  const now = useNow();

  if (session.status === "loading") {
    return (
      <Panel className="p-5" aria-busy>
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-4 h-7 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/3" />
        <Skeleton className="mt-5 h-1.5 w-full" />
      </Panel>
    );
  }

  if (session.status === "error") {
    return (
      <Panel>
        <ErrorState compact message={session.error.message} onRetry={retrySchedule} />
      </Panel>
    );
  }

  const s = session.data;
  if (!s) {
    return (
      <Panel>
        <EmptyState
          compact
          icon={Radio}
          title="Live session status will appear here"
          description="Once organizers publish the schedule or go live, you'll see what's happening in real time."
        />
      </Panel>
    );
  }

  const meta = SESSION_STATUS_META[s.status];
  const tone = TONE_CLASSES[meta.tone];
  const running = (s.status === "in_session" || s.status === "break") && s.endsAt && s.endsAt > now;
  const waiting = (s.status === "upcoming" || s.status === "dismissed") && s.startsAt && s.startsAt > now;

  return (
    <Panel className="relative overflow-hidden">
      <span className={cn("absolute inset-y-0 left-0 w-1", tone.dot)} aria-hidden />
      <div className="p-5 pl-6" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <span className={cn("eyebrow inline-flex items-center gap-2", tone.text)}>
            <StatusDot tone={meta.tone} pulse={s.status === "in_session"} />
            {meta.label}
          </span>
          <span className="text-xs text-ink-faint">
            {s.source === "organizer" ? "Live from organizers" : "Per schedule"}
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${s.status}:${s.title ?? ""}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="mt-3 font-display text-[1.625rem] leading-[1.15] font-medium text-pretty text-ink md:text-[1.875rem]">
              {s.status === "upcoming" || s.status === "dismissed" ? (
                <>
                  <span className="block text-sm font-sans font-normal text-ink-faint">
                    {s.status === "dismissed" ? "Resumes with" : "Up next"}
                  </span>
                  {s.title ?? FALLBACK_HEADLINE[s.status]}
                </>
              ) : (
                (s.title ?? FALLBACK_HEADLINE[s.status])
              )}
            </h2>

            {(s.detail || s.location) && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                {s.detail && <span>{s.detail}</span>}
                {s.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-ink-faint" aria-hidden />
                    {s.location}
                  </span>
                )}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {running && s.endsAt && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={cn("font-medium", tone.text)}>Ends in {formatCountdown(s.endsAt.getTime() - now.getTime())}</span>
              <span className="text-ink-faint tabular-nums">
                {s.startsAt ? `${formatTime(s.startsAt)} – ` : "until "}
                {formatTime(s.endsAt)}
              </span>
            </div>
            {s.startsAt && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                <motion.div
                  className={cn("h-full rounded-full", tone.dot)}
                  initial={false}
                  animate={{ width: `${eventProgress({ startAt: s.startsAt, endAt: s.endsAt }, now) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        )}

        {waiting && s.startsAt && (
          <p className={cn("mt-4 text-sm font-medium", tone.text)}>{formatStartsIn(s.startsAt, now)}</p>
        )}

        {s.status === "completed" && (
          <p className="mt-2 text-sm text-ink-soft">Thank you for being part of MMUN.</p>
        )}
      </div>
    </Panel>
  );
}
