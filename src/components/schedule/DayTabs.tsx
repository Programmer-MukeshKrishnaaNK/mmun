import { motion } from "framer-motion";
import { useRef, type KeyboardEvent } from "react";
import type { ScheduleDay } from "@/types";
import { cn } from "@/utils/cn";
import { formatDateShort, formatWeekdayShort } from "@/utils/time";

interface DayTabsProps {
  days: ScheduleDay[];
  activeKey: string;
  todayKey: string;
  onChange: (key: string) => void;
  panelId: string;
}

export function DayTabs({ days, activeKey, todayKey, onChange, panelId }: DayTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let target = -1;
    if (e.key === "ArrowRight") target = (i + 1) % days.length;
    else if (e.key === "ArrowLeft") target = (i - 1 + days.length) % days.length;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = days.length - 1;
    if (target < 0) return;
    e.preventDefault();
    onChange(days[target].key);
    refs.current[target]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Conference days"
      className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-full gap-1 rounded-xl border border-line bg-surface p-1 shadow-card sm:min-w-0">
        {days.map((day, i) => {
          const active = day.key === activeKey;
          return (
            <button
              key={day.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`day-tab-${day.key}`}
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(day.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative flex min-h-12 min-w-[5.25rem] flex-1 flex-col items-center justify-center rounded-lg px-3 py-1.5 transition-colors",
                active ? "text-white" : "text-ink-soft hover:bg-paper",
              )}
            >
              {active && (
                <motion.span
                  layoutId="planner-day-tab"
                  className="absolute inset-0 rounded-lg bg-navy-900"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              <span className={cn("eyebrow relative", active ? "text-brass-400" : "text-ink-faint")}>
                Day {day.index}
              </span>
              <span className="relative text-[0.8125rem] leading-tight font-medium whitespace-nowrap">
                {formatWeekdayShort(day.date)} {formatDateShort(day.date)}
              </span>
              {day.key === todayKey && (
                <span
                  className={cn("absolute top-1.5 right-1.5 size-1.5 rounded-full", active ? "bg-brass-400" : "bg-live")}
                  aria-label="Today"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
