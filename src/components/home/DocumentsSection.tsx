import { ArrowUpRight, BookOpen, CalendarDays, Download, FileText, Gavel, Megaphone, ScrollText, Users, type LucideIcon } from "lucide-react";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { DOCUMENT_TYPE_LABELS } from "@/constants/conference";
import { useDocuments } from "@/hooks/useDocuments";
import type { DocumentType } from "@/types";

const TYPE_ICONS: Record<DocumentType, LucideIcon> = {
  agenda: CalendarDays,
  rules: Gavel,
  handbook: BookOpen,
  study_guide: ScrollText,
  committee: Users,
  announcement: Megaphone,
  other: FileText,
};

export function DocumentsSection() {
  const { state, retry } = useDocuments();

  return (
    <section aria-labelledby="documents">
      <SectionHeader id="documents" eyebrow="Official" title="Documents" />

      {state.status === "loading" && (
        <Panel className="divide-y divide-line" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </Panel>
      )}

      {state.status === "error" && (
        <Panel>
          <ErrorState compact message={state.error.message} onRetry={retry} />
        </Panel>
      )}

      {state.status === "ready" && state.data.length === 0 && (
        <Panel>
          <EmptyState
            compact
            icon={FileText}
            title="Conference documents will appear here."
            description="Agenda, rules of procedure and study guides are added by the Secretariat."
          />
        </Panel>
      )}

      {state.status === "ready" && state.data.length > 0 && (
        <Panel>
          <ul className="divide-y divide-line">
            {state.data.map((d) => {
              const Icon = TYPE_ICONS[d.type];
              return (
                <li key={d.id} className="flex items-center gap-1 pr-2">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-w-0 flex-1 items-center gap-3.5 rounded-lg p-4 pr-2 transition-colors hover:bg-paper/70"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-paper text-navy-700">
                      <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{d.title}</span>
                      <span className="block truncate text-sm text-ink-soft">
                        {DOCUMENT_TYPE_LABELS[d.type]}
                        {d.description && ` · ${d.description}`}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-label="Opens in a new tab"
                    />
                  </a>
                  {d.downloadUrl && (
                    <a
                      href={d.downloadUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
                      aria-label={`Download ${d.title}`}
                    >
                      <Download className="size-[18px]" strokeWidth={1.8} />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </section>
  );
}
