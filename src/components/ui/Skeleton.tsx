import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,#ebe7de_0%,#f6f3ec_50%,#ebe7de_100%)] bg-size-[200%_100%]",
        className,
      )}
    />
  );
}

/** Visually hidden loading announcement for screen readers. */
export function LoadingLabel({ children }: { children: string }) {
  return (
    <span role="status" className="sr-only">
      {children}
    </span>
  );
}
