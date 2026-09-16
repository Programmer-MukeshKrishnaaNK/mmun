import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TextFieldProps extends ComponentProps<"input"> {
  label: string;
  hint?: string;
  trailing?: ReactNode;
}

export function TextField({ label, hint, trailing, id, className, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-describedby={hintId}
          className={cn(
            "h-12 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-base text-ink shadow-[inset_0_1px_1px_rgb(19_27_37/0.03)]",
            "transition-[border-color,box-shadow] placeholder:text-ink-faint/70",
            "focus:border-navy-600 focus:ring-4 focus:ring-navy-600/10 focus:outline-none",
            "disabled:bg-paper disabled:text-ink-faint",
            trailing ? "pr-12" : undefined,
          )}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-faint">
          {hint}
        </p>
      )}
    </div>
  );
}
