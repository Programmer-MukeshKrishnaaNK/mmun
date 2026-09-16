import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, Inbox, Send } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel, SectionHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import type { Tone } from "@/constants/conference";
import { HELP_CATEGORY_HINTS, HELP_CATEGORY_LABELS } from "@/constants/help";
import { useConference } from "@/context/ConferenceContext";
import { useNow } from "@/context/NowContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSubscription } from "@/hooks/useSubscription";
import { HELP_MESSAGE_MAX, submitHelpRequest, subscribeMyHelpRequests } from "@/services/help";
import { useDemo } from "@/context/DemoContext";
import type { AsyncState, HelpCategory, HelpRequest } from "@/types";
import { cn } from "@/utils/cn";
import { toAppError } from "@/utils/errors";
import { formatRelative } from "@/utils/time";

const CATEGORIES = Object.keys(HELP_CATEGORY_LABELS) as HelpCategory[];

export default function HelpPage() {
  usePageTitle("Help");

  return (
    <>
      <PageHeader
        eyebrow="Organizer support"
        title="How can we help?"
        description="Send a question or doubt straight to the MMUN organizers."
      />
      <div className="mt-6 grid gap-10 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <HelpForm />
        <MyRequests />
      </div>
    </>
  );
}

function HelpForm() {
  const { user, profile } = useConference();
  const demo = useDemo();
  const [category, setCategory] = useState<HelpCategory>("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageId = useId();

  const name = profile.status === "ready" ? profile.data.name : (user.displayName ?? "Delegate");
  const remaining = HELP_MESSAGE_MAX - message.length;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError("Please describe your question before sending.");
      return;
    }
    setSubmitting(true);
    try {
      if (demo) await demo.submitHelp({ category, message });
      else await submitHelpRequest({ uid: user.uid, name, email: user.email }, { category, message });
      setSent(true);
      setMessage("");
      setCategory("general");
    } catch (err) {
      setError(toAppError(err, "Your request couldn't be sent. Please try again.").message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel className="overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center px-6 py-12 text-center"
            role="status"
          >
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.05 }}
              className="grid size-14 place-items-center rounded-full bg-live-soft text-live"
            >
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                />
              </svg>
            </motion.span>
            <h2 className="mt-5 font-display text-2xl font-medium text-ink">Your request has been sent.</h2>
            <p className="mt-1.5 max-w-sm text-sm text-pretty text-ink-soft">
              An organizer will follow up with you. You can keep track of it under “Your requests”.
            </p>
            <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
              Send another request
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 sm:p-6"
          >
            <fieldset>
              <legend className="mb-2.5 text-sm font-medium text-ink">What is it about?</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <label key={c} className="relative">
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      checked={category === c}
                      onChange={() => setCategory(c)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors select-none",
                        "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy-600",
                        category === c
                          ? "border-navy-900 bg-navy-900 text-white"
                          : "border-line-strong bg-surface text-ink-soft hover:border-ink-faint/60 hover:text-ink",
                      )}
                    >
                      {HELP_CATEGORY_LABELS[c]}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-faint">{HELP_CATEGORY_HINTS[category]}</p>
            </fieldset>

            <div className="mt-6">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <label htmlFor={messageId} className="text-sm font-medium text-ink">
                  Your question
                </label>
                <span
                  className={cn("text-xs tabular-nums", remaining < 100 ? "text-amber" : "text-ink-faint")}
                  aria-live={remaining < 100 ? "polite" : "off"}
                >
                  {message.length}/{HELP_MESSAGE_MAX}
                </span>
              </div>
              <textarea
                id={messageId}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, HELP_MESSAGE_MAX))}
                maxLength={HELP_MESSAGE_MAX}
                rows={6}
                placeholder="Describe what you need help with. Include your committee or location if it's relevant."
                disabled={submitting}
                aria-invalid={error ? true : undefined}
                className="block min-h-40 w-full resize-y rounded-lg border border-line-strong bg-surface px-3.5 py-3 text-base leading-relaxed text-ink transition-[border-color,box-shadow] placeholder:text-ink-faint/70 focus:border-navy-600 focus:ring-4 focus:ring-navy-600/10 focus:outline-none disabled:bg-paper"
              />
            </div>

            <AnimatePresence initial={false}>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <span className="mt-3 flex items-start gap-2 rounded-lg bg-rose-soft px-3 py-2.5 text-sm text-rose">
                    <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
                    {error}
                  </span>
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-faint">
                Sending as <span className="font-medium text-ink-soft">{name}</span>
                {user.email && <> · {user.email}</>}
              </p>
              <Button
                type="submit"
                size="lg"
                loading={submitting}
                disabled={profile.status === "loading"}
                icon={<Send className="size-4" />}
                className="w-full sm:w-auto"
              >
                {submitting ? "Sending…" : "Send request"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Panel>
  );
}

function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s.includes("resolv") || s.includes("done") || s.includes("closed") || s.includes("answer")) return "live";
  if (s.includes("progress") || s.includes("review")) return "sky";
  if (s.includes("pending") || s.includes("open")) return "amber";
  return "slate";
}

function MyRequests() {
  const { user } = useConference();
  const now = useNow();
  const demo = useDemo();
  const sub = useSubscription<HelpRequest[]>(demo ? null : user.uid, (h) => subscribeMyHelpRequests(user.uid, h));
  const state: AsyncState<HelpRequest[]> = demo ? { status: "ready", data: demo.helpRequests } : sub.state;

  return (
    <section aria-labelledby="my-requests">
      <SectionHeader id="my-requests" title="Your requests" />
      {state.status === "loading" && (
        <Panel className="divide-y divide-line" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2 p-4">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </Panel>
      )}
      {state.status === "error" && (
        <Panel className="px-4 py-4 text-sm text-ink-soft">Your previous requests aren't available right now.</Panel>
      )}
      {state.status === "ready" && state.data.length === 0 && (
        <Panel>
          <EmptyState compact icon={Inbox} title="No requests yet" description="Need help? Send a request to the organizers." />
        </Panel>
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <Panel>
          <ul className="divide-y divide-line">
            {state.data.map((r) => (
              <li key={r.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  {r.createdAt && (
                    <time dateTime={r.createdAt.toISOString()} className="text-xs text-ink-faint">
                      {formatRelative(r.createdAt, now)}
                    </time>
                  )}
                </div>
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink">{r.message}</p>
                {r.category && <p className="mt-1 text-xs text-ink-faint">{HELP_CATEGORY_LABELS[r.category]}</p>}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  );
}
