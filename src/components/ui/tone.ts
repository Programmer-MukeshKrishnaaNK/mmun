import type { Tone } from "@/constants/conference";

// Full class names so Tailwind can see them statically.
export const TONE_CLASSES: Record<Tone, { text: string; soft: string; dot: string; border: string }> = {
  live: { text: "text-live", soft: "bg-live-soft", dot: "bg-live", border: "border-live/25" },
  amber: { text: "text-amber", soft: "bg-amber-soft", dot: "bg-amber", border: "border-amber/25" },
  sky: { text: "text-sky", soft: "bg-sky-soft", dot: "bg-sky", border: "border-sky/25" },
  rose: { text: "text-rose", soft: "bg-rose-soft", dot: "bg-rose", border: "border-rose/25" },
  slate: { text: "text-slate", soft: "bg-slate-soft", dot: "bg-slate", border: "border-slate/20" },
  brass: { text: "text-brass-600", soft: "bg-brass-100", dot: "bg-brass-500", border: "border-brass-400/40" },
};
