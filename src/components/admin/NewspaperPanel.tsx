import { Newspaper, Pencil, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useSubscription } from "@/hooks/useSubscription";
import {
  deleteNewsArticle,
  saveNewsArticle,
  subscribeAdminNews,
  type AdminNewsRow,
} from "@/services/admin";
import { NEWS_CATEGORIES, NEWS_CATEGORY_LABELS } from "@/services/news";
import type { NewsCategory } from "@/types";
import { toTimestamp } from "@/utils/datetime";
import { toAppError } from "@/utils/errors";
import { useConfirm } from "./ConfirmDialog";
import { CheckboxField, FieldRow, FormMessage, InputField, ListRow, SelectField, TextAreaField } from "./fields";

const CATEGORY_OPTIONS = NEWS_CATEGORIES.map((value) => ({ value, label: NEWS_CATEGORY_LABELS[value] }));

interface FormState {
  id: string | null;
  title: string;
  summary: string;
  body: string;
  author: string;
  category: NewsCategory;
  coverUrl: string;
  published: boolean;
  /** Preserved on edit so correcting a typo doesn't reorder the front page. */
  publishedAt: string;
}

const EMPTY: FormState = {
  id: null,
  title: "",
  summary: "",
  body: "",
  author: "",
  category: "briefing",
  coverUrl: "",
  published: true,
  publishedAt: "",
};

export function NewspaperPanel() {
  const { state, retry } = useSubscription<AdminNewsRow[]>("admin-news", subscribeAdminNews);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const { confirm, dialog } = useConfirm();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setMessage({ tone: "error", text: "A headline and an article body are both required." });
      return;
    }
    const cover = form.coverUrl.trim();
    if (cover && !/^https?:\/\//i.test(cover)) {
      setMessage({ tone: "error", text: "The cover image must be a full http:// or https:// URL." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await saveNewsArticle(form.id, {
        title: form.title.trim(),
        body: form.body.trim(),
        summary: form.summary.trim(),
        author: form.author.trim(),
        category: form.category,
        coverUrl: cover,
        published: form.published,
        publishedAt: form.publishedAt ? toTimestamp(form.publishedAt) : null,
      });
      const wasEdit = form.id !== null;
      setForm(EMPTY);
      setMessage({
        tone: "ok",
        text: wasEdit ? "Article updated." : form.published ? "Published to the newspaper." : "Saved as a draft.",
      });
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "The article couldn't be saved.").message });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: AdminNewsRow) => {
    const ok = await confirm({
      title: `Delete “${row.title}”?`,
      description: "It will be removed from the newspaper for every delegate. This can't be undone.",
    });
    if (!ok) return;
    try {
      await deleteNewsArticle(row.id);
      if (form.id === row.id) setForm(EMPTY);
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "It couldn't be deleted.").message });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <Panel className="p-5 sm:p-6">
        <SectionHeader
          title={form.id ? "Edit article" : "Write an article"}
          eyebrow="Newspaper"
          action={
            form.id && (
              <Button variant="ghost" size="sm" icon={<X className="size-3.5" />} onClick={() => { setForm(EMPTY); setMessage(null); }}>
                Cancel
              </Button>
            )
          }
        />
        <div className="space-y-4">
          <InputField label="Headline" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Security Council deadlocked on draft resolution" />
          <InputField label="Standfirst" hint="optional — shown on the front page" value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="One line summarising the story." />
          <TextAreaField
            label="Article"
            hint="leave a blank line between paragraphs"
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            rows={10}
            placeholder={"Opening paragraph.\n\nSecond paragraph."}
          />
          <FieldRow>
            <InputField label="Byline" hint="optional" value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Press Team" />
            <SelectField label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORY_OPTIONS} />
          </FieldRow>
          <InputField label="Cover image" hint="optional — https:// link" type="url" value={form.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} placeholder="https://example.com/photo.jpg" />
          <CheckboxField label="Published" hint="— uncheck to keep it as a draft" checked={form.published} onChange={(v) => set("published", v)} />
          {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
          <Button onClick={onSave} loading={saving} icon={<Send className="size-4" />}>
            {form.id ? "Update article" : form.published ? "Publish article" : "Save draft"}
          </Button>
        </div>
      </Panel>

      <section aria-labelledby="news-list">
        <SectionHeader id="news-list" title="Articles" />
        <Panel>
          {state.status === "loading" && (
            <div className="space-y-3 p-4" aria-busy>
              {[0, 1].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
            </div>
          )}
          {state.status === "error" && <ErrorState compact message={state.error.message} onRetry={retry} />}
          {state.status === "ready" && state.data.length === 0 && (
            <EmptyState compact icon={Newspaper} title="Nothing written yet" description="The first article appears here." />
          )}
          {state.status === "ready" && state.data.length > 0 && (
            <ul className="divide-y divide-line">
              {state.data.map((row) => (
                <ListRow
                  key={row.id}
                  title={row.title}
                  badges={
                    <>
                      <Badge tone="slate">{NEWS_CATEGORY_LABELS[row.category]}</Badge>
                      {row.draft && <Badge tone="amber">Draft</Badge>}
                    </>
                  }
                  meta={
                    <>
                      {row.publishedAt ? row.publishedAt.toLocaleDateString(undefined, { dateStyle: "medium" }) : "no date"}
                      {row.author ? ` · ${row.author}` : ""}
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
                            summary: row.summary ?? "",
                            body: row.body,
                            author: row.author ?? "",
                            category: row.category,
                            coverUrl: row.coverUrl ?? "",
                            published: !row.draft,
                            publishedAt: row.publishedAt
                              ? new Date(row.publishedAt.getTime() - row.publishedAt.getTimezoneOffset() * 60000)
                                  .toISOString()
                                  .slice(0, 16)
                              : "",
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
