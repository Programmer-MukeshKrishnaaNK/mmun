import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-brass-600">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-[2rem] leading-[1.1] font-medium tracking-tight text-ink md:text-[2.5rem]">
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-xl text-[0.9375rem] text-pretty text-ink-soft">{description}</p>}
      </div>
      {action}
    </header>
  );
}
