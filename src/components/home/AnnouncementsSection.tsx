import { AnimatePresence, motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { PRIORITY_META } from "@/constants/conference";
import { useConference } from "@/context/ConferenceContext";
import { useNow } from "@/context/NowContext";
import { cn } from "@/utils/cn";
import { formatRelative } from "@/utils/time";

const COLLAPSED_COUNT = 4;

export function AnnouncementsSection() {
  const { announcements, retryAnnouncements } = useConference();
  const now = useNow();
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-labelledby="announcements">
      <SectionHeader id="announcements" eyebrow="Updates" title="Announcements" />

      {announcements.status === "loading" && (
        <Panel className="divide-y divide-line" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </Panel>
      )}

      {announcements.status === "error" && (
        <Panel>
          <ErrorState compact message={announcements.error.message} onRetry={retryAnnouncements} />
        </Panel>
      )}

      {announcements.status === "ready" && announcements.data.length === 0 && (
        <Panel>
          <EmptyState compact icon={Megaphone} title="No new announcements." description="Updates from organizers will show up here instantly." />
        </Panel>
      )}

      {announcements.status === "ready" && announcements.data.length > 0 && (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-line" aria-live="polite">
            <AnimatePresence initial={false}>
              {(expanded ? announcements.data : announcements.data.slice(0, COLLAPSED_COUNT)).map((a) => {
                const meta = PRIORITY_META[a.priority];
                return (
                  <motion.li
                    key={a.id}
                    layout="position"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      a.priority === "urgent" && "bg-rose-soft/40",
                    )}
                  >
                    {a.priority !== "normal" && (
                      <span
                        className={cn("absolute inset-y-0 left-0 w-0.5", a.priority === "urgent" ? "bg-rose" : "bg-brass-500")}
                        aria-hidden
                      />
                    )}
                    <div className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium leading-snug text-pretty text-ink">{a.title}</p>
                        {a.priority !== "normal" && <Badge tone={meta.tone} className="mt-0.5 shrink-0">{meta.label}</Badge>}
                      </div>
                      {a.message && <p className="mt-1 text-sm leading-relaxed text-pretty whitespace-pre-line text-ink-soft">{a.message}</p>}
                      <p className="mt-1.5 text-xs text-ink-faint">
                        <time dateTime={a.createdAt.toISOString()}>{formatRelative(a.createdAt, now)}</time>
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {announcements.data.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="w-full border-t border-line px-4 py-3 text-sm font-medium text-navy-700 transition-colors hover:bg-paper"
            >
              {expanded ? "Show fewer" : `Show all ${announcements.data.length}`}
            </button>
          )}
        </Panel>
      )}
    </section>
  );
}
