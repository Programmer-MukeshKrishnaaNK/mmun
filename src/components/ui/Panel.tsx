import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Panel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  id?: string;
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ id, title, eyebrow, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-0.5 text-ink-faint">{eyebrow}</p>}
        <h2 id={id} className="font-display text-[1.3125rem] leading-tight font-medium text-ink">
          {title}
        </h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
