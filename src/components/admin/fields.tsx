// Form primitives for the organizer console. They match TextField's look so the
// console feels like the rest of the portal rather than a bolted-on admin page.
import { CircleAlert, CircleCheck } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/utils/cn";

const CONTROL =
  "w-full rounded-lg border border-line-strong bg-surface px-3.5 text-[0.9375rem] text-ink " +
  "shadow-[inset_0_1px_1px_rgb(19_27_37/0.03)] transition-[border-color,box-shadow] " +
  "placeholder:text-ink-faint/70 focus:border-navy-600 focus:ring-4 focus:ring-navy-600/10 " +
  "focus:outline-none disabled:bg-paper disabled:text-ink-faint";

function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
      {hint && <span className="ml-1.5 font-normal text-ink-faint">{hint}</span>}
    </label>
  );
}

interface InputFieldProps extends ComponentProps<"input"> {
  label: string;
  hint?: string;
}

export function InputField({ label, hint, id, className, ...rest }: InputFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>
      <input id={inputId} className={cn(CONTROL, "h-11")} {...rest} />
    </div>
  );
}

interface TextAreaFieldProps extends ComponentProps<"textarea"> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, id, className, ...rest }: TextAreaFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>
      <textarea id={inputId} rows={3} className={cn(CONTROL, "resize-y py-2.5 leading-relaxed")} {...rest} />
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  hint?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  className?: string;
  disabled?: boolean;
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  className,
  disabled,
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(CONTROL, "h-11 appearance-none bg-[length:0] pr-9")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237c8698' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1.05rem",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-line-strong text-navy-900 focus:ring-2 focus:ring-navy-600/20"
      />
      <label htmlFor={id} className="text-sm text-ink select-none">
        {label}
        {hint && <span className="ml-1.5 text-ink-faint">{hint}</span>}
      </label>
    </div>
  );
}

/** Inline success / failure line under a form's actions. */
export function FormMessage({ tone, children }: { tone: "ok" | "error"; children: ReactNode }) {
  const Icon = tone === "ok" ? CircleCheck : CircleAlert;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
        tone === "ok" ? "bg-live-soft text-live" : "bg-rose-soft text-rose",
      )}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/** Two-column grid that collapses on phones. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/** A row in one of the console's lists, with edit / delete actions. */
export function ListRow({
  title,
  meta,
  badges,
  warning,
  actions,
}: {
  title: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  warning?: string;
  actions: ReactNode;
}) {
  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        {badges && <div className="mb-1.5 flex flex-wrap items-center gap-1.5">{badges}</div>}
        <p className="truncate text-[0.9375rem] font-medium text-ink">{title}</p>
        {meta && <p className="mt-0.5 text-xs text-ink-faint">{meta}</p>}
        {warning && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-rose">
            <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
            {warning}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-1.5">{actions}</div>
    </li>
  );
}
