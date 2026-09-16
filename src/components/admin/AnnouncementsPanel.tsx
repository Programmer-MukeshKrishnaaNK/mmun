import { Megaphone, Pencil, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { PRIORITY_META } from "@/constants/conference";
import { useSubscription } from "@/hooks/useSubscription";
import {
  deleteAnnouncement,
  saveAnnouncement,
  subscribeAdminAnnouncements,
  type AdminAnnouncementRow,
} from "@/services/admin";
import type { AnnouncementPriority } from "@/types";
import { parseCommittees } from "@/utils/datetime";
import { toAppError } from "@/utils/errors";
import { CheckboxField, FieldRow, FormMessage, InputField, ListRow, SelectField, TextAreaField } from "./fields";
import { useConfirm } from "./ConfirmDialog";

const PRIORITY_OPTIONS: readonly { value: AnnouncementPriority; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "important", label: "Important" },
  { value: "urgent", label: "Urgent" },
];

interface FormState {
  id: string | null;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  committees: string;
  published: boolean;
}

const EMPTY: FormState = { id: null, title: "", message: "", priority: "normal", committees: "", published: true };

export function AnnouncementsPanel() {
  const { state, retry } = useSubscription<AdminAnnouncementRow[]>("admin-announcements", subscribeAdminAnnouncements);
  const [form, setForm] = useState<FormState>(EMPTY);
  const { confirm, dialog } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    if (!form.title.trim()) {
      setMessage({ tone: "error", text: "A title is required — the portal hides announcements without one." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveAnnouncement(form.id, {
        title: form.title.trim(),
        message: form.message.trim(),
        priority: form.priority,
        committees: parseCommittees(form.committees),
        published: form.published,
      });
      const wasEdit = form.id !== null;
      setForm(EMPTY);
      setMessage({ tone: "ok", text: wasEdit ? "Announcement updated." : "Published to every delegate's feed." });
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "The announcement couldn't be saved.").message });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: AdminAnnouncementRow) => {
    const ok = await confirm({
      title: `Delete “${row.title}”?`,
      description: "It will be removed from every delegate's feed. This can't be undone.",
    });
    if (!ok) return;
    try {
      await deleteAnnouncement(row.id);
      if (form.id === row.id) setForm(EMPTY);
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "It couldn't be deleted.").message });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <Panel className="p-5 sm:p-6">
        <SectionHeader
          title={form.id ? "Edit announcement" : "New announcement"}
          eyebrow="Announcements"
          action={
            form.id && (
              <Button variant="ghost" size="sm" icon={<X className="size-3.5" />} onClick={() => { setForm(EMPTY); setMessage(null); }}>
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
            placeholder="UNGA moved to Hall 11"
          />
          <TextAreaField
            label="Message"
            hint="optional"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Longer detail, if the title isn't enough on its own."
          />
          <FieldRow>
            <SelectField
              label="Priority"
              value={form.priority}
              onChange={(v) => set("priority", v)}
              options={PRIORITY_OPTIONS}
            />
            <InputField
              label="Committees"
              hint="comma separated"
              value={form.committees}
              onChange={(e) => set("committees", e.target.value)}
              placeholder="Leave empty for everyone"
            />
          </FieldRow>
          <CheckboxField label="Published" checked={form.published} onChange={(v) => set("published", v)} />
          {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
          <Button onClick={onSave} loading={saving} icon={<Send className="size-4" />}>
            {form.id ? "Update announcement" : "Publish announcement"}
          </Button>
        </div>
      </Panel>

      <section aria-labelledby="announcement-list">
        <SectionHeader id="announcement-list" title="Published" />
        <Panel>
          {state.status === "loading" && (
            <div className="space-y-3 p-4" aria-busy>
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          )}
          {state.status === "error" && <ErrorState compact message={state.error.message} onRetry={retry} />}
          {state.status === "ready" && state.data.length === 0 && (
            <EmptyState compact icon={Megaphone} title="Nothing published yet" />
          )}
          {state.status === "ready" && state.data.length > 0 && (
            <ul className="divide-y divide-line">
              {state.data.map((row) => (
                <ListRow
                  key={row.id}
                  title={row.title}
                  badges={
                    <>
                      <Badge tone={PRIORITY_META[row.priority].tone}>{PRIORITY_META[row.priority].label}</Badge>
                      {row.draft && <Badge tone="amber">Draft</Badge>}
                    </>
                  }
                  meta={
                    <>
                      {row.createdAt ? row.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "no date"}
                      {row.committees.length ? ` · ${row.committees.join(", ")}` : " · all committees"}
                    </>
                  }
                  warning={row.hiddenReason}
                  actions={
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Edit ${row.title}`}
                        onClick={() => {
                          setForm({
                            id: row.id,
                            title: row.title,
                            message: row.message ?? "",
                            priority: row.priority,
                            committees: row.committees.join(", "),
                            published: !row.draft,
                          });
                          setMessage(null);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
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
