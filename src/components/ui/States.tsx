import { CircleAlert, RefreshCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "px-4 py-6" : "px-6 py-10", className)}>
      <span className="mb-3 grid size-10 place-items-center rounded-full border border-line bg-paper text-ink-faint">
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-pretty text-ink-soft">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorState({ message, onRetry, className, compact }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center text-center", compact ? "px-4 py-6" : "px-6 py-10", className)}
    >
      <span className="mb-3 grid size-10 place-items-center rounded-full bg-rose-soft text-rose">
        <CircleAlert className="size-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="max-w-xs text-sm text-pretty text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry} icon={<RefreshCw className="size-3.5" />}>
          Try again
        </Button>
      )}
    </div>
  );
}
