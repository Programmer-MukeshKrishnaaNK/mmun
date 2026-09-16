import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonStyle {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink-faint/50 hover:bg-paper",
  ghost: "text-ink-soft hover:bg-paper-deep hover:text-ink",
  danger: "border border-rose/30 bg-surface text-rose hover:bg-rose-soft",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[0.9375rem]",
  lg: "h-12 px-5 text-base",
};

export function buttonClasses({ variant = "primary", size = "md", block = false }: ButtonStyle = {}): string {
  return cn(
    "relative inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
  );
}

interface ButtonProps extends ButtonStyle, Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant,
  size,
  block,
  loading = false,
  icon,
  children,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, block }), className)}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      <span>{children}</span>
    </motion.button>
  );
}
