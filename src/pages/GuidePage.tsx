import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  Gavel,
  Info,
  Landmark,
  Mail,
  Phone,
  ScrollText,
  Search,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useGuide } from "@/hooks/useGuide";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Contact, GuideIcon, GuideItem, GuideSection } from "@/types";
import { cn } from "@/utils/cn";

const ICONS: Record<GuideIcon, LucideIcon> = {
  landmark: Landmark,
  users: Users,
  gavel: Gavel,
  scroll: ScrollText,
  info: Info,
  help: CircleHelp,
};

export default function GuidePage() {
  usePageTitle("Guide");
  const { state, retry } = useGuide();
  const [query, setQuery] = useState("");
  const searchId = useId();

  const q = query.trim().toLowerCase();
  const sections = useMemo<GuideSection[]>(() => {
    if (state.status !== "ready") return [];
    if (!q) return state.data.sections;
    return state.data.sections
      .map((s) => ({
        ...s,
        items: s.title.toLowerCase().includes(q)
          ? s.items
          : s.items.filter((i) => i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length > 0);
  }, [state, q]);

  return (
    <>
      <PageHeader eyebrow="Conference guide" title="Guide" description="How MMUN works, committee procedure and answers to common questions." />

      <div className="relative mt-6 max-w-2xl">
        <label htmlFor={searchId} className="sr-only">
          Search the guide
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-ink-faint" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search — e.g. “caucus”, “voting”"
          className="h-12 w-full appearance-none rounded-xl border border-line-strong bg-surface pr-11 pl-11 text-base text-ink shadow-card transition-[border-color,box-shadow] placeholder:text-ink-faint/80 focus:border-navy-600 focus:ring-4 focus:ring-navy-600/10 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-ink-faint hover:text-ink"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {state.status === "loading" && (
        <div className="mt-8 space-y-4" aria-busy>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <Panel className="mt-8">
          <ErrorState message={state.error.message} onRetry={retry} />
        </Panel>
      )}

      {state.status === "ready" && (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="space-y-8">
            {sections.length === 0 ? (
              <Panel>
                <EmptyState icon={Search} title={`No results for “${query.trim()}”`} description="Try a different word, or ask the organizers from the Help tab." />
              </Panel>
            ) : (
              sections.map((s) => <GuideSectionBlock key={s.id} section={s} forceOpen={Boolean(q)} />)
            )}
          </div>
          <ContactsBlock contacts={state.data.contacts} />
        </div>
      )}
    </>
  );
}

function GuideSectionBlock({ section, forceOpen }: { section: GuideSection; forceOpen: boolean }) {
  const Icon = ICONS[section.icon];
  const headingId = `guide-${section.id}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg bg-navy-900 text-brass-400">
          <Icon className="size-4" strokeWidth={1.9} aria-hidden />
        </span>
        <h2 id={headingId} className="font-display text-[1.3125rem] font-medium text-ink">
          {section.title}
        </h2>
      </div>
      <Panel className="divide-y divide-line">
        {section.items.map((item) => (
          <AccordionItem key={item.id} item={item} forceOpen={forceOpen} />
        ))}
      </Panel>
    </section>
  );
}

function AccordionItem({ item, forceOpen }: { item: GuideItem; forceOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const expanded = open || forceOpen;
  const buttonId = useId();
  const panelId = useId();

  return (
    <div>
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-14 w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left font-medium text-ink transition-colors hover:bg-paper/60"
        >
          <span className="text-pretty">{item.title}</span>
          <ChevronDown
            className={cn("size-[18px] shrink-0 text-ink-faint transition-transform duration-200", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-prose px-4 pb-4 text-[0.9375rem] leading-relaxed text-pretty whitespace-pre-line text-ink-soft">
              {item.body}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactsBlock({ contacts }: { contacts: Contact[] }) {
  return (
    <aside aria-labelledby="contacts" className="lg:sticky lg:top-24">
      <SectionHeader id="contacts" title="Important contacts" />
      {contacts.length === 0 ? (
        <Panel>
          <EmptyState
            compact
            icon={BookOpen}
            title="Organizer contacts will be listed here."
            description="For anything urgent, use the Help tab or find the Secretariat desk."
          />
        </Panel>
      ) : (
        <Panel className="divide-y divide-line">
          {contacts.map((c) => (
            <div key={c.id} className="px-4 py-3.5">
              <p className="font-medium text-ink">{c.name}</p>
              {c.role && <p className="text-sm text-ink-soft">{c.role}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {c.phone && (
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, "")}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-lg border border-line px-3 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <Mail className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{c.email}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </Panel>
      )}
    </aside>
  );
}
