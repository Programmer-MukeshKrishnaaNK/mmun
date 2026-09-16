import { Monitor, Moon, Sun } from "lucide-react";
import type { ComponentType } from "react";
import { useTheme, type ThemePreference } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

const OPTIONS: readonly { value: ThemePreference; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

export function ThemeToggle() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div className="mt-6 border-t border-line pt-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">Appearance</p>
        {preference === "system" && (
          <p className="text-xs text-ink-faint">Following your device · {resolved}</p>
        )}
      </div>
      <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-1 rounded-xl bg-paper-deep p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(value)}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600",
                selected
                  ? "bg-surface text-ink shadow-card"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
