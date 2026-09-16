import { Check, Inbox, Search, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useSubscription } from "@/hooks/useSubscription";
import {
  deleteHelpRequest,
  fetchDelegates,
  resolveHelpRequest,
  subscribeAllHelpRequests,
  type AdminDelegate,
  type AdminHelpRequest,
} from "@/services/admin";
import { useConfirm } from "./ConfirmDialog";
import { InputField } from "./fields";
import { toAppError } from "@/utils/errors";

// ─── typo-tolerant search ─────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const rows: number[][] = [];
  for (let i = 0; i <= b.length; i++) rows[i] = [i];
  for (let j = 0; j <= a.length; j++) rows[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      rows[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? rows[i - 1][j - 1]
          : Math.min(rows[i - 1][j - 1] + 1, rows[i][j - 1] + 1, rows[i - 1][j] + 1);
    }
  }
  return rows[b.length][a.length];
}

/** Substring first, then a per-word edit distance so "Pranab" finds "Pranav". */
function fuzzyMatch(term: string, target: string | undefined): boolean {
  if (!term || !target) return false;
  const q = term.toLowerCase().trim();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;

  const words = t.split(/\s+/);
  return q.split(/\s+/).every((qw) => {
    const allowed = qw.length > 5 ? 2 : 1;
    return words.some((tw) => Math.abs(qw.length - tw.length) <= allowed && levenshtein(qw, tw) <= allowed);
  });
}

// ─── help requests ────────────────────────────────────────────────────────

export function HelpRequestsPanel() {
  const { state, retry } = useSubscription<AdminHelpRequest[]>("admin-help", subscribeAllHelpRequests);
  const [busy, setBusy] = useState<{ id: string; action: "resolve" | "delete" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const onResolve = async (id: string) => {
    setBusy({ id, action: "resolve" });
    setError(null);
    try {
      await resolveHelpRequest(id);
    } catch (err) {
      setError(toAppError(err, "That request couldn't be updated.").message);
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async (request: AdminHelpRequest) => {
    const ok = await confirm({
      title: "Delete this request?",
      description: `From ${request.userName}. It disappears from their own list too, and can't be recovered. To close it off instead, mark it resolved.`,
    });
    if (!ok) return;

    setBusy({ id: request.id, action: "delete" });
    setError(null);
    try {
      await deleteHelpRequest(request.id);
    } catch (err) {
      setError(toAppError(err, "That request couldn't be deleted.").message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="help-requests" className="max-w-3xl">
      <SectionHeader id="help-requests" title="Help requests" eyebrow="Sent by delegates" />
      <Panel>
        {state.status === "loading" && (
          <div className="space-y-3 p-4" aria-busy>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}
        {state.status === "error" && <ErrorState message={state.error.message} onRetry={retry} />}
        {state.status === "ready" && state.data.length === 0 && (
          <EmptyState icon={Inbox} title="No requests yet" description="Delegate questions arrive here." />
        )}
        {state.status === "ready" && state.data.length > 0 && (
          <ul className="divide-y divide-line">
            {state.data.map((r) => {
              const resolved = r.status.toLowerCase().includes("resolv");
              return (
                <li key={r.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={resolved ? "live" : "amber"}>{r.status}</Badge>
                      {r.category && <span className="text-xs text-ink-faint">{r.category}</span>}
                    </div>
                    {r.createdAt && (
                      <time dateTime={r.createdAt.toISOString()} className="text-xs text-ink-faint">
                        {r.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </time>
                    )}
                  </div>
                  {/* React escapes these by default — a delegate can put anything in them. */}
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink">{r.message}</p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink-faint">
                      <span className="font-medium text-ink-soft">{r.userName}</span>
                      {r.userEmail && <> · {r.userEmail}</>}
                    </p>
                    <div className="flex items-center gap-2">
                      {!resolved && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={busy?.id === r.id && busy.action === "resolve"}
                          onClick={() => onResolve(r.id)}
                          icon={<Check className="size-3.5" />}
                        >
                          Mark resolved
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        aria-label={`Delete request from ${r.userName}`}
                        loading={busy?.id === r.id && busy.action === "delete"}
                        onClick={() => onDelete(r)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-rose-soft px-3 py-2.5 text-sm text-rose">
          {error}
        </p>
      )}
      {dialog}
    </section>
  );
}

// ─── delegate lookup ──────────────────────────────────────────────────────

export function DelegatesPanel() {
  const [delegates, setDelegates] = useState<AdminDelegate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");

  useEffect(() => {
    let active = true;
    fetchDelegates()
      .then((rows) => active && setDelegates(rows))
      .catch(() => active && setError("The delegate list couldn't be loaded."));
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!delegates) return [];
    if (!term.trim()) return delegates;
    return delegates.filter(
      (d) =>
        fuzzyMatch(term, d.name) ||
        fuzzyMatch(term, d.school) ||
        fuzzyMatch(term, d.committee) ||
        fuzzyMatch(term, d.email),
    );
  }, [delegates, term]);

  return (
    <section aria-labelledby="delegates" className="max-w-3xl">
      <SectionHeader
        id="delegates"
        title="Delegates"
        eyebrow={delegates ? `${delegates.length} registered` : "Loading"}
      />
      <InputField
        label="Search"
        hint="name, school or committee — tolerates typos"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Pranab"
        className="mb-4"
      />
      <Panel>
        {error && <ErrorState compact message={error} />}
        {!error && !delegates && (
          <div className="space-y-3 p-4" aria-busy>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        )}
        {delegates && results.length === 0 && (
          <EmptyState
            compact
            icon={term.trim() ? Search : Users}
            title={term.trim() ? `No delegate matches “${term.trim()}”` : "No delegates yet"}
          />
        )}
        {results.length > 0 && (
          <ul className="divide-y divide-line">
            {results.map((d) => (
              <li key={d.uid} className="px-4 py-3">
                <p className="text-[0.9375rem] font-medium text-ink">{d.name ?? "(no name set)"}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {d.school ?? "no school"} · {d.committee ?? "no committee"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </section>
  );
}
