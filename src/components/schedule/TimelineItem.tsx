import { motion } from "framer-motion";
import { Check, Info, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EVENT_STATE_META } from "@/constants/conference";
import type { EventTimeState, ScheduleEvent } from "@/types";
import { cn } from "@/utils/cn";
import { eventProgress, isBreakKind } from "@/utils/schedule";
import { formatCountdown, formatDuration, formatStartsIn, formatTime } from "@/utils/time";

interface TimelineItemProps {
  event: ScheduleEvent;
  state: EventTimeState;
  now: Date;
  compact?: boolean;
  index?: number;
}

export function TimelineItem({ event, state, now, compact = false, index = 0 }: TimelineItemProps) {
  const isNow = state === "now";
  const isNext = state === "next";
  const done = state === "completed";
  const isBreak = isBreakKind(event.kind);
  const duration = event.endAt.getTime() - event.startAt.getTime();

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      data-focus={isNow || isNext ? "true" : undefined}
      className="group relative grid scroll-mt-28 grid-cols-[4.25rem_0.875rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[4.75rem_1rem_minmax(0,1fr)] sm:gap-x-3"
    >
      {/* Time */}
      <div className={cn("pt-3.5 text-right whitespace-nowrap tabular-nums", done ? "text-ink-faint" : "text-ink")}>
        <time dateTime={event.startAt.toISOString()} className="block text-[0.8125rem] leading-5 font-semibold">
          {formatTime(event.startAt)}
        </time>
        {!compact && (
          <time dateTime={event.endAt.toISOString()} className="block text-xs leading-4 text-ink-faint">
            {formatTime(event.endAt)}
          </time>
        )}
      </div>

      {/* Rail */}
      <div className="relative flex justify-center" aria-hidden>
        <span className="absolute top-0 bottom-0 w-px bg-line group-first:top-5 group-last:bottom-auto group-last:h-5" />
        <span className="relative mt-[1.1rem] grid size-3.5 place-items-center">
          {isNow ? (
            <>
              <span className={cn("absolute inset-0 animate-live-ping rounded-full", isBreak ? "bg-amber" : "bg-live")} />
              <span className={cn("relative size-3 rounded-full ring-4", isBreak ? "bg-amber ring-amber/15" : "bg-live ring-live/15")} />
            </>
          ) : isNext ? (
            <span className="size-3 rounded-full border-2 border-sky bg-surface" />
          ) : done ? (
            <span className="grid size-3.5 place-items-center rounded-full bg-line text-ink-faint">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          ) : (
            <span className="size-2.5 rounded-full border-2 border-line-strong bg-paper" />
          )}
        </span>
      </div>

      {/* Card */}
      <div className="min-w-0 pb-2.5">
        <div
          className={cn(
            "rounded-xl border px-4 transition-[background-color,border-color,box-shadow] duration-300",
            isNow && cn("bg-surface py-3.5 shadow-raised", isBreak ? "border-amber/30" : "border-live/30"),
            isNext && "border-line bg-surface py-3.5 shadow-card",
            state === "upcoming" && "border-line/70 bg-surface/60 py-3",
            done && "border-transparent py-3",
          )}
        >
          {(isNow || isNext || isBreak || event.changeNote) && (
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              {isNow && <Badge tone={isBreak ? "amber" : "live"}>Now</Badge>}
              {isNext && <Badge tone="sky">Next</Badge>}
              {isBreak && <Badge tone="slate">{event.kind === "meal" ? "Meal" : "Break"}</Badge>}
              {event.changeNote && !done && <Badge tone="amber">Changed</Badge>}
            </div>
          )}

          <h3
            className={cn(
              "text-pretty",
              isNow ? "font-display text-[1.1875rem] leading-snug font-medium" : "text-[0.9375rem] leading-snug font-medium",
              done ? "text-ink-soft" : "text-ink",
            )}
          >
            {event.title}
          </h3>

          <p className={cn("mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.8125rem]", done ? "text-ink-faint" : "text-ink-soft")}>
            {event.location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
                <span className="truncate">{event.location}</span>
              </span>
            )}
            <span>{formatDuration(duration)}</span>
            <span className="sr-only">. {EVENT_STATE_META[state].label}.</span>
          </p>

          {isNow && (
            <div className="mt-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs whitespace-nowrap">
                <span className={cn("font-medium", isBreak ? "text-amber" : "text-live")}>
                  Ends in {formatCountdown(event.endAt.getTime() - now.getTime())}
                </span>
                <span className="text-ink-faint tabular-nums">until {formatTime(event.endAt)}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-paper-deep">
                <motion.div
                  className={cn("h-full rounded-full", isBreak ? "bg-amber" : "bg-live")}
                  initial={false}
                  animate={{ width: `${eventProgress(event, now) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {isNext && <p className="mt-2 text-xs font-medium text-sky">{formatStartsIn(event.startAt, now)}</p>}

          {!compact && event.description && !done && (
            <p className="mt-2 text-sm leading-relaxed text-pretty text-ink-soft">{event.description}</p>
          )}

          {!compact && event.changeNote && !done && (
            <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-soft px-2.5 py-2 text-xs leading-relaxed text-amber">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              {event.changeNote}
            </p>
          )}
        </div>
      </div>
    </motion.li>
  );
}
