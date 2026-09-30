import { Emblem } from "@/components/brand/Emblem";
import { Avatar } from "@/components/profile/Avatar";
import { Panel } from "@/components/ui/Panel";
import { ErrorState } from "@/components/ui/States";
import { useConference } from "@/context/ConferenceContext";

export function DelegateCard() {
  const { profile, retryProfile } = useConference();

  if (profile.status === "error") {
    return (
      <Panel>
        <ErrorState compact message="Unable to load your delegate details." onRetry={retryProfile} />
      </Panel>
    );
  }

  if (profile.status === "loading") {
    return (
      <div className="navy-field rounded-xl p-5" aria-hidden>
        <div className="h-3 w-16 rounded bg-white/10" />
        <div className="mt-3 h-6 w-44 rounded bg-white/10" />
        <div className="mt-2 h-4 w-28 rounded bg-white/10" />
        <div className="mt-2 h-4 w-24 rounded bg-white/10" />
      </div>
    );
  }

  const p = profile.data;

  return (
    <section
      aria-label="Your delegate details"
      className="navy-field relative overflow-hidden rounded-xl p-5 text-white shadow-raised"
    >
      <Emblem
        strokeWidth={0.5}
        className="pointer-events-none absolute -top-12 -right-12 size-48 text-brass-300/[0.16]"
      />
      <span className="gold-rule absolute inset-x-0 top-0" aria-hidden />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-brass-400">Delegate</p>
          <p className="mt-1 truncate font-display text-[1.5rem] leading-tight font-medium">{p.name}</p>
          {p.committee && <p className="mt-0.5 truncate text-sm text-white/70">{p.committee}</p>}
          {p.portfolio && (
            <p className="mt-0.5 truncate text-sm font-medium text-brass-300">{p.portfolio}</p>
          )}
        </div>
        <Avatar name={p.name} inverted />
      </div>

      {!p.committee && !p.portfolio && (
        <p className="relative mt-4 border-t border-white/10 pt-4 text-sm text-white/60">
          Your committee and portfolio will appear here once they're added.
        </p>
      )}
    </section>
  );
}
