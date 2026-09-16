import { cn, initialsOf } from "@/utils/cn";

interface AvatarProps {
  name: string;
  size?: "sm" | "lg";
  /** For use on dark (navy) surfaces. */
  inverted?: boolean;
}

export function Avatar({ name, size = "sm", inverted = false }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold tracking-wide text-brass-400",
        inverted ? "bg-white/10 ring-1 ring-brass-400/40" : "bg-navy-900",
        size === "sm" ? "size-8 text-xs" : "size-14 text-lg",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
