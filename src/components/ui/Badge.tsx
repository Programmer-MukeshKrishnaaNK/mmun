import type { ReactNode } from "react";
import type { Tone } from "@/constants/conference";
import { cn } from "@/utils/cn";
import { TONE_CLASSES } from "./tone";

export function Badge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-[5px] px-1.5 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase",
        t.soft,
        t.text,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone, pulse = false, className }: { tone: Tone; pulse?: boolean; className?: string }) {
  const t = TONE_CLASSES[tone];
  return (
    <span className={cn("relative inline-flex size-2", className)} aria-hidden>
      {pulse && <span className={cn("absolute inset-0 animate-live-ping rounded-full", t.dot)} />}
      <span className={cn("relative inline-flex size-2 rounded-full", t.dot)} />
    </span>
  );
}
