import { CalendarClock, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useSubscription } from "@/hooks/useSubscription";
import {
  deleteScheduleEvent,
  saveScheduleEvent,
  subscribeAdminSchedule,
  type AdminScheduleRow,
  type ScheduleSource,
} from "@/services/admin";
import type { ScheduleEventKind } from "@/types";
import { toDateTimeLocal, toTimestamp } from "@/utils/datetime";
import { toAppError } from "@/utils/errors";
import { CheckboxField, FieldRow, FormMessage, InputField, ListRow, SelectField, TextAreaField } from "./fields";
import { useConfirm } from "./ConfirmDialog";

const KIND_OPTIONS: readonly { value: ScheduleEventKind; label: string }[] = [
  { value: "session", label: "Session" },
  { value: "ceremony", label: "Ceremony" },
  { value: "break", label: "Break" },
  { value: "meal", label: "Meal" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

interface FormState {
  id: string | null;
  /** Which collection this event came from; new ones default to the one the
   *  delegate app reads and the published rules already allow. */
  source: ScheduleSource;
  title: string;
  startAt: string;
  endAt: string;
  kind: ScheduleEventKind;
  location: string;
  description: string;
  changeNote: string;
  published: boolean;
}

const EMPTY: FormState = {
  id: null,
  source: "schedule_events",
  title: "",
  startAt: "",
  endAt: "",
  kind: "session",
  location: "",
  description: "",
  changeNote: "",
  published: true,
};

const fmt = (d: Date | undefined) =>
  d ? d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

export function SchedulePanel() {
  const { state, retry } = useSubscription<AdminScheduleRow[]>("admin-schedule", subscribeAdminSchedule);
  const [form, setForm] = useState<FormState>(EMPTY);
  const { confirm, dialog } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const reset = () => {
    setForm(EMPTY);
    setMessage(null);
  };

  const onSave = async () => {
    const startAt = toTimestamp(form.startAt);
    const endAt = toTimestamp(form.endAt);

    if (!form.title.trim() || !startAt || !endAt) {
      setMessage({ tone: "error", text: "A title, start time and end time are all required." });
      return;
    }
    // The portal drops any event where endAt <= startAt, so reject it here
    // rather than saving something delegates will never see.
    if (endAt.toMillis() <= startAt.toMillis()) {
      setMessage({ tone: "error", text: "The end time must be after the start time." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await saveScheduleEvent({ id: form.id, source: form.source }, {
        title: form.title.trim(),
        startAt,
        endAt,
        kind: form.kind,
        location: form.location.trim(),
        description: form.description.trim(),
        changeNote: form.changeNote.trim(),
        published: form.published,
      });
      const wasEdit = form.id !== null;
      setForm(EMPTY);
      setMessage({ tone: "ok", text: wasEdit ? "Event updated." : "Event added to the schedule." });
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "The event couldn't be saved.").message });
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row: AdminScheduleRow) => {
    setForm({
      id: row.id,
      source: row.source,
      title: row.title,
      startAt: toDateTimeLocal(row.startAt),
      endAt: toDateTimeLocal(row.endAt),
      kind: row.kind,
      location: row.location ?? "",
      description: row.description ?? "",
      changeNote: row.changeNote ?? "",
      published: !row.draft,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (row: AdminScheduleRow) => {
    const ok = await confirm({
      title: `Delete “${row.title}”?`,
      description: "It will disappear from every delegate's planner straight away. This can't be undone.",
    });
    if (!ok) return;
    try {
      await deleteScheduleEvent({ id: row.id, source: row.source });
      if (form.id === row.id) setForm(EMPTY);
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "The event couldn't be deleted.").message });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <Panel className="p-5 sm:p-6">
        <SectionHeader
          title={form.id ? "Edit event" : "Add an event"}
          eyebrow="Schedule"
          action={
            form.id && (
              <Button variant="ghost" size="sm" icon={<X className="size-3.5" />} onClick={reset}>
                Cancel
              </Button>
            )
          }
        />
        <div className="space-y-4">
          <InputField
            label="Title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Committee Session III"
          />
          <FieldRow>
            <InputField
              label="Starts"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => set("startAt", e.target.value)}
            />
            <InputField
              label="Ends"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => set("endAt", e.target.value)}
            />
          </FieldRow>
          <FieldRow>
            <SelectField label="Kind" value={form.kind} onChange={(v) => set("kind", v)} options={KIND_OPTIONS} />
            <InputField
              label="Location"
              hint="optional"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="UNGA Hall"
            />
          </FieldRow>
          <TextAreaField
            label="Description"
            hint="optional"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What delegates should know before this session."
          />
          <InputField
            label="Change note"
            hint="optional — flags the event as changed"
            value={form.changeNote}
            onChange={(e) => set("changeNote", e.target.value)}
            placeholder="Moved from UNGA Hall to Hall B."
          />
          <CheckboxField
            label="Published"
            hint="— uncheck to keep it as a draft"
            checked={form.published}
            onChange={(v) => set("published", v)}
          />
          {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
          <Button onClick={onSave} loading={saving} icon={<Plus className="size-4" />}>
            {form.id ? "Update event" : "Add event"}
          </Button>
        </div>
      </Panel>

      <section aria-labelledby="schedule-list">
        <SectionHeader id="schedule-list" title="Schedule" />
        <Panel>
          {state.status === "loading" && (
            <div className="space-y-3 p-4" aria-busy>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          )}
          {state.status === "error" && <ErrorState compact message={state.error.message} onRetry={retry} />}
          {state.status === "ready" && state.data.length === 0 && (
            <EmptyState
              compact
              icon={CalendarClock}
              title="No events yet"
              description="Add the first one and it appears in every delegate's planner."
            />
          )}
          {state.status === "ready" && state.data.length > 0 && (
            <ul className="divide-y divide-line">
              {state.data.map((row) => (
                <ListRow
                  key={row.id}
                  title={row.title}
                  badges={
                    <>
                      <Badge tone="slate">{row.kind}</Badge>
                      {row.draft && <Badge tone="amber">Draft</Badge>}
                      {row.changeNote && <Badge tone="brass">Changed</Badge>}
                    </>
                  }
                  meta={
                    <>
                      {fmt(row.startAt)} – {row.endAt ? row.endAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—"}
                      {row.location ? ` · ${row.location}` : ""}
                    </>
                  }
                  warning={row.hiddenReason}
                  actions={
                    <>
                      <Button variant="secondary" size="sm" aria-label={`Edit ${row.title}`} onClick={() => onEdit(row)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="danger" size="sm" aria-label={`Delete ${row.title}`} onClick={() => onDelete(row)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </Panel>
      </section>
      {dialog}
    </div>
  );
}
