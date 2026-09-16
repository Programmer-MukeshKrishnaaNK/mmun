import { CalendarClock, FileText, Inbox, Megaphone, Newspaper, RadioTower, Users } from "lucide-react";
import { useState, type ComponentType } from "react";
import { AnnouncementsPanel } from "@/components/admin/AnnouncementsPanel";
import { DocumentsPanel } from "@/components/admin/DocumentsPanel";
import { LiveSessionPanel } from "@/components/admin/LiveSessionPanel";
import { NewspaperPanel } from "@/components/admin/NewspaperPanel";
import { DelegatesPanel, HelpRequestsPanel } from "@/components/admin/RequestsPanel";
import { SchedulePanel } from "@/components/admin/SchedulePanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/utils/cn";

interface Tab {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  Panel: ComponentType;
}

const TABS: readonly Tab[] = [
  { id: "live", label: "Live", icon: RadioTower, Panel: LiveSessionPanel },
  { id: "schedule", label: "Schedule", icon: CalendarClock, Panel: SchedulePanel },
  { id: "announcements", label: "Announcements", icon: Megaphone, Panel: AnnouncementsPanel },
  { id: "documents", label: "Documents", icon: FileText, Panel: DocumentsPanel },
  { id: "news", label: "Newspaper", icon: Newspaper, Panel: NewspaperPanel },
  { id: "requests", label: "Requests", icon: Inbox, Panel: HelpRequestsPanel },
  { id: "delegates", label: "Delegates", icon: Users, Panel: DelegatesPanel },
];

export default function AdminPage() {
  usePageTitle("Organizer");
  const [active, setActive] = useState<string>(TABS[0].id);
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <>
      <PageHeader
        eyebrow="Organizer"
        title="Console"
        description="Everything here is what delegates see. Changes are live the moment you save."
      />

      <div className="mt-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Console sections" className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = id === active;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setActive(id)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                  selected
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-line-strong bg-surface text-ink-soft hover:border-ink-faint/60 hover:text-ink",
                )}
              >
                <Icon className="size-4" strokeWidth={1.9} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7">
        <current.Panel />
      </div>
    </>
  );
}
