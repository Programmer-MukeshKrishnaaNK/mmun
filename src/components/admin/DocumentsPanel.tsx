import { FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { DOCUMENT_TYPE_LABELS } from "@/constants/conference";
import { useSubscription } from "@/hooks/useSubscription";
import {
  deleteDocument,
  isUsableUrl,
  saveDocument,
  subscribeAdminDocuments,
  type AdminDocumentRow,
} from "@/services/admin";
import type { DocumentType } from "@/types";
import { parseCommittees } from "@/utils/datetime";
import { toAppError } from "@/utils/errors";
import { CheckboxField, FieldRow, FormMessage, InputField, ListRow, SelectField } from "./fields";
import { useConfirm } from "./ConfirmDialog";

const TYPE_OPTIONS = (Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((value) => ({
  value,
  label: DOCUMENT_TYPE_LABELS[value],
}));

interface FormState {
  id: string | null;
  title: string;
  url: string;
  type: DocumentType;
  description: string;
  committees: string;
  order: string;
  downloadable: boolean;
  published: boolean;
}

const EMPTY: FormState = {
  id: null,
  title: "",
  url: "",
  type: "handbook",
  description: "",
  committees: "",
  order: "100",
  downloadable: true,
  published: true,
};

export function DocumentsPanel() {
  const { state, retry } = useSubscription<AdminDocumentRow[]>("admin-documents", subscribeAdminDocuments);
  const [form, setForm] = useState<FormState>(EMPTY);
  const { confirm, dialog } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    const url = form.url.trim();
    if (!form.title.trim() || !url) {
      setMessage({ tone: "error", text: "A title and a link are both required." });
      return;
    }
    // The portal only accepts http/https links and silently ignores the rest.
    if (!isUsableUrl(url)) {
      setMessage({ tone: "error", text: "The link must be a full http:// or https:// URL." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await saveDocument(form.id, {
        title: form.title.trim(),
        url,
        type: form.type,
        description: form.description.trim(),
        committees: parseCommittees(form.committees),
        order: Number(form.order) || 1000,
        downloadable: form.downloadable,
        published: form.published,
      });
      const wasEdit = form.id !== null;
      setForm(EMPTY);
      setMessage({ tone: "ok", text: wasEdit ? "Document updated." : "Document added." });
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "The document couldn't be saved.").message });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: AdminDocumentRow) => {
    const ok = await confirm({
      title: `Remove “${row.title}”?`,
      description: "Delegates will no longer see this document. The file itself isn't deleted.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    try {
      await deleteDocument(row.id);
      if (form.id === row.id) setForm(EMPTY);
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "It couldn't be deleted.").message });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <Panel className="p-5 sm:p-6">
        <SectionHeader
          title={form.id ? "Edit document" : "Add a document"}
          eyebrow="Documents"
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
            placeholder="Delegate Handbook"
          />
          <InputField
            label="Link"
            hint="must start with https://"
            type="url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://example.com/handbook.pdf"
          />
          <FieldRow>
            <SelectField label="Type" value={form.type} onChange={(v) => set("type", v)} options={TYPE_OPTIONS} />
            <InputField
              label="Order"
              hint="lower shows first"
              type="number"
              value={form.order}
              onChange={(e) => set("order", e.target.value)}
            />
          </FieldRow>
          <InputField
            label="Description"
            hint="optional"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Everything a delegate needs before day one."
          />
          <InputField
            label="Committees"
            hint="comma separated"
            value={form.committees}
            onChange={(e) => set("committees", e.target.value)}
            placeholder="Leave empty for everyone"
          />
          <CheckboxField label="Offer a download action" checked={form.downloadable} onChange={(v) => set("downloadable", v)} />
          <CheckboxField label="Published" checked={form.published} onChange={(v) => set("published", v)} />
          {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
          <Button onClick={onSave} loading={saving} icon={<Plus className="size-4" />}>
            {form.id ? "Update document" : "Add document"}
          </Button>
        </div>
      </Panel>

      <section aria-labelledby="documents-list">
        <SectionHeader id="documents-list" title="Published" />
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
            <EmptyState
              compact
              icon={FileText}
              title="No documents yet"
              description="The portal shows an empty state until you add one."
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
                      <Badge tone="slate">{DOCUMENT_TYPE_LABELS[row.type]}</Badge>
                      {row.draft && <Badge tone="amber">Draft</Badge>}
                    </>
                  }
                  meta={<span className="break-all">{row.url}</span>}
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
                            url: row.url,
                            type: row.type,
                            description: row.description ?? "",
                            committees: row.committees.join(", "),
                            order: String(row.order),
                            downloadable: row.downloadable,
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
