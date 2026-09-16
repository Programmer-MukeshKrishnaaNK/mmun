import { ArrowRight, CalendarClock } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { TimelineItem } from "@/components/schedule/TimelineItem";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ROUTES } from "@/constants/routes";
import { useConference } from "@/context/ConferenceContext";
import { useNow } from "@/context/NowContext";
import { buildTimelineSnapshot, isOngoing } from "@/utils/schedule";
import { formatWeekdayShort, isSameDay } from "@/utils/time";

const MAX_VISIBLE = 4;

export function TodayAgenda() {
  const { schedule, retrySchedule } = useConference();
  const now = useNow();

  const view = useMemo(() => {
    if (schedule.status !== "ready") return null;
    const events = schedule.data;
    const snapshot = buildTimelineSnapshot(events, now);
    const today = events.filter((e) => isSameDay(e.startAt, now) || isOngoing(e, now));
    const remaining = today.filter((e) => snapshot.states.get(e.id) !== "completed");
    return {
      snapshot,
      hasEvents: events.length > 0,
      remaining,
      earlierCount: today.length - remaining.length,
    };
  }, [schedule, now]);

  const plannerLink = (
    <Link
      to={ROUTES.planner}
      className="inline-flex items-center gap-1 rounded-md py-1 text-sm font-medium text-navy-700 hover:text-navy-900"
    >
      Planner <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );

  return (
    <section aria-labelledby="today-agenda">
      <SectionHeader id="today-agenda" eyebrow="Agenda" title="Today" action={plannerLink} />

      {schedule.status === "loading" && (
        <div className="space-y-2.5" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-4">
              <Skeleton className="mt-3 h-4 w-12 justify-self-end" />
              <Skeleton className="h-[4.5rem] rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {schedule.status === "error" && (
        <Panel>
          <ErrorState compact message={schedule.error.message} onRetry={retrySchedule} />
        </Panel>
      )}

      {view && !view.hasEvents && (
        <Panel>
          <EmptyState
            compact
            icon={CalendarClock}
            title="Your schedule hasn't been published yet."
            description="Sessions and events will appear here as soon as organizers publish them."
          />
        </Panel>
      )}

      {view && view.hasEvents && (
        <>
          {view.remaining.length > 0 ? (
            <ol className="relative">
              {view.remaining.slice(0, MAX_VISIBLE).map((e, i) => (
                <TimelineItem key={e.id} event={e} state={view.snapshot.states.get(e.id) ?? "upcoming"} now={now} compact index={i} />
              ))}
            </ol>
          ) : (
            <Panel className="px-5 py-4">
              <p className="font-medium text-ink">
                {view.earlierCount > 0 ? "That's everything for today." : "Nothing scheduled today."}
              </p>
              {view.snapshot.next ? (
                <p className="mt-0.5 text-sm text-ink-soft">
                  Next up: <span className="font-medium text-ink">{view.snapshot.next.title}</span> ·{" "}
                  {formatWeekdayShort(view.snapshot.next.startAt)}{" "}
                  {view.snapshot.next.startAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-ink-soft">There are no further events on the schedule.</p>
              )}
            </Panel>
          )}

          {(view.remaining.length > MAX_VISIBLE || view.earlierCount > 0) && (
            <p className="mt-1 pl-[6.125rem] text-sm text-ink-faint sm:pl-[7.25rem]">
              {view.remaining.length > MAX_VISIBLE && `${view.remaining.length - MAX_VISIBLE} more later today`}
              {view.remaining.length > MAX_VISIBLE && view.earlierCount > 0 && " · "}
              {view.earlierCount > 0 && `${view.earlierCount} earlier`}
              {" — "}
              <Link to={ROUTES.planner} className="font-medium text-navy-700 underline-offset-2 hover:underline">
                see full day
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
