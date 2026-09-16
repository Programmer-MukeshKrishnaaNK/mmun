import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { PROFILE_FIELD_LABELS } from "@/constants/conference";
import { useConference } from "@/context/ConferenceContext";
import type { DelegateProfile } from "@/types";
import { formatRelative } from "@/utils/time";
import { Avatar } from "./Avatar";
import { ThemeToggle } from "./ThemeToggle";

export function profileRows(p: DelegateProfile): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: PROFILE_FIELD_LABELS.committee, value: p.committee },
    { label: PROFILE_FIELD_LABELS.country, value: p.country },
    { label: PROFILE_FIELD_LABELS.position, value: p.position },
  ];
  return rows.filter((r): r is { label: string; value: string } => Boolean(r.value));
}

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

/**
 * Read-only. Assignments are set by the organizers, so there is no edit path
 * here and no client-side write to users/{uid} anywhere in the app — see the
 * matching rule in firestore.rules, which is what actually enforces it.
 */
export function ProfileSheet({ open, onClose, onSignOut }: ProfileSheetProps) {
  const { profile, retryProfile } = useConference();

  return (
    <Sheet open={open} onClose={onClose} title="Your profile" description="Signed in to the MMUN Delegate Portal">
      {profile.status === "loading" && (
        <div className="space-y-3" aria-hidden>
          <div className="flex items-center gap-3">
            <Skeleton className="size-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-52" />
            </div>
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )}

      {profile.status === "error" && <ErrorState compact message={profile.error.message} onRetry={retryProfile} />}

      {profile.status === "ready" && (
        <>
          <div className="flex items-center gap-3.5">
            <Avatar name={profile.data.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-medium text-ink">{profile.data.name}</p>
              {profile.data.email && <p className="truncate text-sm text-ink-soft">{profile.data.email}</p>}
            </div>
          </div>
          <ProfileDetails profile={profile.data} />
        </>
      )}

      <ThemeToggle />

      <div className="mt-6 border-t border-line pt-4">
        <Button variant="danger" block onClick={onSignOut} icon={<LogOut className="size-4" />}>
          Sign out
        </Button>
      </div>
    </Sheet>
  );
}

function ProfileDetails({ profile }: { profile: DelegateProfile }) {
  const rows = profileRows(profile);
  return (
    <div className="mt-5">
      {rows.length > 0 ? (
        <dl className="divide-y divide-line rounded-xl border border-line">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-ink-soft">{r.label}</dt>
              <dd className="text-right text-sm font-medium text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-4 text-sm text-ink-soft">
          Your assignment details haven't been added yet.
        </p>
      )}
      <p className="mt-3 text-xs text-ink-faint">
        Set by the organizers
        {profile.updatedAt ? ` · updated ${formatRelative(profile.updatedAt, new Date()).toLowerCase()}` : ""}.
        Something wrong? Send a request from the Help page.
      </p>
    </div>
  );
}
