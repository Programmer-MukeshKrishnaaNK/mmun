import { RadioTower, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { SESSION_STATUS_META } from "@/constants/conference";
import { clearLiveSession, fetchLiveSessionDraft, saveLiveSession } from "@/services/admin";
import type { SessionStatus } from "@/types";
import { toDateTimeLocal, toTimestamp } from "@/utils/datetime";
import { toAppError } from "@/utils/errors";
import { FieldRow, FormMessage, InputField, SelectField } from "./fields";
import { useConfirm } from "./ConfirmDialog";

const STATUS_OPTIONS: readonly { value: SessionStatus | ""; label: string }[] = [
  { value: "", label: "Not set — follow the schedule" },
  ...(Object.keys(SESSION_STATUS_META) as SessionStatus[]).map((value) => ({
    value,
    label: SESSION_STATUS_META[value].label,
  })),
];

interface FormState {
  status: SessionStatus | "";
  title: string;
  detail: string;
  location: string;
  startsAt: string;
  endsAt: string;
}

const EMPTY: FormState = { status: "", title: "", detail: "", location: "", startsAt: "", endsAt: "" };

export function LiveSessionPanel() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const { confirm, dialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetchLiveSessionDraft()
      .then((draft) => {
        if (!active) return;
        setForm({
          status: draft.status,
          title: draft.title,
          detail: draft.detail,
          location: draft.location,
          startsAt: toDateTimeLocal(draft.startsAt),
          endsAt: toDateTimeLocal(draft.endsAt),
        });
      })
      .catch((err) => active && setMessage({ tone: "error", text: toAppError(err, "Couldn't load the current status.").message }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    if (!form.status) {
      setMessage({ tone: "error", text: "Pick a status, or use Reset to hand control back to the schedule." });
      return;
    }
    const startsAt = toTimestamp(form.startsAt);
    const endsAt = toTimestamp(form.endsAt);
    if (startsAt && endsAt && endsAt.toMillis() <= startsAt.toMillis()) {
      setMessage({ tone: "error", text: "The end time must be after the start time." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await saveLiveSession({
        status: form.status,
        title: form.title.trim(),
        detail: form.detail.trim(),
        location: form.location.trim(),
        startsAt,
        endsAt,
      });
      setMessage({ tone: "ok", text: "Live status updated — delegates see it straight away." });
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "The status couldn't be saved.").message });
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    const ok = await confirm({
      title: "Reset the live status?",
      description: "The portal will work out what's happening from the schedule instead.",
      confirmLabel: "Reset",
      destructive: false,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await clearLiveSession();
      setForm((f) => ({ ...f, status: "" }));
      setMessage({ tone: "ok", text: "Cleared. The portal is deriving status from the schedule again." });
    } catch (err) {
      setMessage({ tone: "error", text: toAppError(err, "It couldn't be cleared.").message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel className="max-w-2xl p-5 sm:p-6">
      <SectionHeader
        title="Live session"
        eyebrow="Delegate home screen"
        action={
          form.status ? (
            <Badge tone={SESSION_STATUS_META[form.status].tone}>{SESSION_STATUS_META[form.status].label}</Badge>
          ) : (
            <Badge tone="slate">Following schedule</Badge>
          )
        }
      />

      {loading ? (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-2/3" />
        </div>
      ) : (
        <div className="space-y-4">
          <SelectField
            label="Status"
            hint="— leave unset and the portal works it out from the schedule"
            value={form.status}
            onChange={(v) => set("status", v)}
            options={STATUS_OPTIONS}
          />
          <FieldRow>
            <InputField
              label="Title"
              hint="optional"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="General Speakers List"
            />
            <InputField
              label="Location"
              hint="optional"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="UNGA Hall"
            />
          </FieldRow>
          <InputField
            label="Detail"
            hint="optional"
            value={form.detail}
            onChange={(e) => set("detail", e.target.value)}
            placeholder="Agenda: Climate finance"
          />
          <FieldRow>
            <InputField
              label="Starts"
              hint="optional"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
            />
            <InputField
              label="Ends"
              hint="optional"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
            />
          </FieldRow>
          {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
          <div className="flex flex-wrap gap-3">
            <Button onClick={onSave} loading={saving} icon={<RadioTower className="size-4" />}>
              Update live status
            </Button>
            <Button variant="secondary" onClick={onReset} disabled={saving} icon={<RotateCcw className="size-4" />}>
              Reset to schedule
            </Button>
          </div>
        </div>
      )}
      {dialog}
    </Panel>
  );
}
