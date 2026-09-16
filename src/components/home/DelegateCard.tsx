import { Emblem } from "@/components/brand/Emblem";
import { Avatar } from "@/components/profile/Avatar";
import { profileRows } from "@/components/profile/ProfileSheet";
import { Panel } from "@/components/ui/Panel";
import { ErrorState } from "@/components/ui/States";
import { PROFILE_FIELD_LABELS } from "@/constants/conference";
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
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
          <div className="h-8 rounded bg-white/5" />
          <div className="h-8 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  const p = profile.data;
  const details = profileRows(p).filter((r) => r.label !== PROFILE_FIELD_LABELS.committee);

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
        </div>
        <Avatar name={p.name} inverted />
      </div>

      {details.length > 0 ? (
        <dl className="relative mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-4">
          {details.map((r) => (
            <div key={r.label} className="min-w-0">
              <dt className="text-[0.6875rem] tracking-[0.1em] text-white/45 uppercase">{r.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        !p.committee && (
          <p className="relative mt-4 border-t border-white/10 pt-4 text-sm text-white/60">
            Your committee assignment will appear here once it's added.
          </p>
        )
      )}
    </section>
  );
}
