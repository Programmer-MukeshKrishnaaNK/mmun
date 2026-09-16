import { CONFERENCE } from "@/constants/conference";
import { cn } from "@/utils/cn";

/** Globe-meridian mark — a quiet diplomatic cue without literal flags. */
export function Emblem({ className, strokeWidth = 2.2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
        <circle cx="20" cy="20" r="15" />
        <ellipse cx="20" cy="20" rx="6.5" ry="15" />
        <path d="M5 20h30M7.8 12.5h24.4M7.8 27.5h24.4" />
      </g>
    </svg>
  );
}

export function Wordmark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid size-8 place-items-center rounded-lg ring-1",
          inverted
            ? "bg-white/10 text-brass-300 ring-brass-400/40"
            : "navy-field text-brass-300 ring-brass-500/30",
        )}
      >
        <Emblem className="size-5" />
      </span>
      <span
        className={cn(
          "font-display text-[1.3rem] leading-none font-semibold tracking-[0.06em]",
          inverted ? "gold-text" : "text-ink",
        )}
      >
        {CONFERENCE.shortName}
      </span>
    </span>
  );
}
