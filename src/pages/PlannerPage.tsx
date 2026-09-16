import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, CornerDownLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayTabs } from "@/components/schedule/DayTabs";
import { TimelineItem } from "@/components/schedule/TimelineItem";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useConference } from "@/context/ConferenceContext";
import { useNow } from "@/context/NowContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { buildTimelineSnapshot, groupEventsByDay, pickDefaultDayKey } from "@/utils/schedule";
import { dayKey, formatDayLong } from "@/utils/time";

const PANEL_ID = "planner-day-panel";

export default function PlannerPage() {
  usePageTitle("Planner");
  const { schedule, retrySchedule } = useConference();
  const now = useNow();
  const [selectedKey, setSelectedKey] = useState<string>();
  const scrolledFor = useRef<string | null>(null);

  const events = schedule.status === "ready" ? schedule.data : null;
  const days = useMemo(() => (events ? groupEventsByDay(events) : []), [events]);
  const snapshot = useMemo(() => buildTimelineSnapshot(events ?? [], now), [events, now]);

  const defaultKey = pickDefaultDayKey(days, now);
  const activeKey = selectedKey && days.some((d) => d.key === selectedKey) ? selectedKey : defaultKey;
  const activeDay = days.find((d) => d.key === activeKey);
  const todayKey = dayKey(now);

  // Bring "now"/"next" into view once per day selection — useful on long days.
  useEffect(() => {
    if (!activeKey || scrolledFor.current === activeKey) return;
    scrolledFor.current = activeKey;
    const el = document.querySelector<HTMLElement>(`#${PANEL_ID} [data-focus="true"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 120 || rect.bottom > window.innerHeight - 100) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeKey, activeDay]);

  const focusEvent = snapshot.current[0] ?? snapshot.next;
  const focusDayKey = focusEvent ? dayKey(focusEvent.startAt) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Delegate planner"
        title={activeDay ? `Day ${activeDay.index}` : "Planner"}
        description={activeDay ? formatDayLong(activeDay.date) : "What's happening, when and where."}
      />

      {schedule.status === "loading" && (
        <div className="mt-6 space-y-3" aria-busy>
          <Skeleton className="h-14 w-full rounded-xl" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-5">
              <Skeleton className="mt-3 h-4 w-12 justify-self-end" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {schedule.status === "error" && (
        <Panel className="mt-6">
          <ErrorState message={schedule.error.message} onRetry={retrySchedule} />
        </Panel>
      )}

      {schedule.status === "ready" && days.length === 0 && (
        <Panel className="mt-6">
          <EmptyState
            icon={CalendarClock}
            title="Your schedule hasn't been published yet."
            description="Once organizers publish the agenda, every session, break and ceremony will appear here with live now/next status."
          />
        </Panel>
      )}

      {activeDay && activeKey && (
        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
          <div className="min-w-0">
            {days.length > 1 && (
              <DayTabs days={days} activeKey={activeKey} todayKey={todayKey} onChange={setSelectedKey} panelId={PANEL_ID} />
            )}

            {focusDayKey && focusDayKey !== activeKey && (
              <button
                type="button"
                onClick={() => {
                  scrolledFor.current = null;
                  setSelectedKey(focusDayKey);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-navy-700 hover:text-navy-900"
              >
                <CornerDownLeft className="size-3.5" aria-hidden />
                Jump to {snapshot.current.length ? "what's on now" : "what's next"}
              </button>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.ol
                key={activeKey}
                id={PANEL_ID}
                role={days.length > 1 ? "tabpanel" : undefined}
                aria-labelledby={days.length > 1 ? `day-tab-${activeKey}` : undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-5"
              >
                {activeDay.events.map((e, i) => (
                  <TimelineItem key={e.id} event={e} state={snapshot.states.get(e.id) ?? "upcoming"} now={now} index={i} />
                ))}
              </motion.ol>
            </AnimatePresence>
          </div>

          <DaySummary
            total={activeDay.events.length}
            completed={activeDay.events.filter((e) => snapshot.states.get(e.id) === "completed").length}
            first={activeDay.events[0].startAt}
            last={activeDay.events.reduce((max, e) => (e.endAt > max ? e.endAt : max), activeDay.events[0].endAt)}
          />
        </div>
      )}
    </>
  );
}

function DaySummary({ total, completed, first, last }: { total: number; completed: number; first: Date; last: Date }) {
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <aside className="hidden lg:block">
      <Panel className="sticky top-24 p-5">
        <p className="eyebrow text-ink-faint">This day</p>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Events</dt>
            <dd className="font-medium text-ink tabular-nums">{total}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Completed</dt>
            <dd className="font-medium text-ink tabular-nums">{completed}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">Hours</dt>
            <dd className="font-medium text-ink tabular-nums">
              {time(first)} – {time(last)}
            </dd>
          </div>
        </dl>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-deep">
          <div className="h-full rounded-full bg-navy-700 transition-[width] duration-700" style={{ width: `${(completed / total) * 100}%` }} />
        </div>
      </Panel>
    </aside>
  );
}
