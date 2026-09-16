import { Skeleton } from "@/components/ui/Skeleton";
import { useConference } from "@/context/ConferenceContext";
import { useNow } from "@/context/NowContext";
import { firstNameOf } from "@/utils/cn";
import { formatDayLong, greetingFor } from "@/utils/time";

export function Greeting() {
  const { profile } = useConference();
  const now = useNow();

  return (
    <header>
      <p className="eyebrow text-brass-600">{formatDayLong(now)}</p>
      <h1 className="mt-1 font-display text-[2rem] leading-[1.1] font-medium tracking-tight text-ink md:text-[2.625rem]">
        {greetingFor(now)}
        {profile.status === "loading" ? (
          <>
            , <Skeleton className="inline-block h-7 w-28 align-middle md:h-9" />
          </>
        ) : profile.status === "ready" ? (
          `, ${firstNameOf(profile.data.name)}.`
        ) : (
          "."
        )}
      </h1>
      <p className="mt-1 text-[0.9375rem] text-ink-soft">Your MMUN dashboard</p>
    </header>
  );
}
