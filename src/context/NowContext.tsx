import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const NowContext = createContext<Date>(new Date());

/**
 * One shared clock for time-aware UI (planner states, countdowns). Ticks on
 * interval boundaries and immediately when the tab/phone becomes visible again,
 * so delegates never need to refresh.
 */
export function NowProvider({ children, intervalMs = 15_000 }: { children: ReactNode; intervalMs?: number }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs) + 25);
    };
    const tick = () => {
      setNow(new Date());
      schedule();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      tick();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return <NowContext value={now}>{children}</NowContext>;
}

export function useNow(): Date {
  return useContext(NowContext);
}
