import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Emblem, Wordmark } from "@/components/brand/Emblem";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CONFERENCE } from "@/constants/conference";
import { usePageTitle } from "@/hooks/usePageTitle";
import { signIn } from "@/services/auth";
import { authErrorMessage } from "@/utils/errors";

export default function LoginPage() {
  usePageTitle("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      // Redirect is handled by the PublicOnly guard once auth state updates.
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-paper md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="navy-field relative overflow-hidden px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-20 text-white md:flex md:flex-col md:justify-between md:p-12 lg:p-16">
        <Emblem
          strokeWidth={0.35}
          className="pointer-events-none absolute -right-28 -bottom-40 size-[26rem] text-brass-300/[0.17] md:-right-40 md:-bottom-56 md:size-[44rem]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgb(29_78_150/0.4),transparent_60%)]"
          aria-hidden
        />
        <div className="relative">
          <Wordmark inverted />
        </div>
        <motion.div
          className="relative mt-12 md:mt-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow text-brass-400">{CONFERENCE.fullName}</p>
          <h1 className="mt-3 font-display text-[2.625rem] leading-[1.02] font-medium tracking-tight md:text-[4.25rem]">
            Delegate
            <br />
            Portal
          </h1>
          <p className="mt-3 text-sm tracking-[0.18em] text-brass-400/80 uppercase">{CONFERENCE.tagline}</p>
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-white/70">
            Live session status, your schedule, official documents and a direct line to the organizers — in one place.
          </p>
        </motion.div>
        <p className="relative hidden text-xs text-white/40 md:block">For registered MMUN delegates and organizers.</p>
      </aside>

      <main className="relative -mt-10 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:mt-0 md:flex md:items-center md:justify-center md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-raised sm:p-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none"
        >
          <h2 className="font-display text-[1.75rem] leading-tight font-medium text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-soft">Use the email address registered for MMUN.</p>

          <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              disabled={submitting}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              disabled={submitting}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="grid size-10 place-items-center rounded-md text-ink-faint transition-colors hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              }
            />

            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  key={error}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto", x: [0, -4, 4, -2, 0] }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-soft px-3 py-2.5 text-sm text-rose">
                    <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" size="lg" block loading={submitting} className="mt-2">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
            Trouble signing in? Visit the registration or Secretariat desk.
          </p>
          {import.meta.env.DEV && (
            <a
              href="/demo"
              className="mt-4 block rounded-lg border border-dashed border-brass-400 px-3 py-2.5 text-center text-sm font-medium text-brass-600 hover:bg-brass-100"
            >
              Dev only: preview with demo data →
            </a>
          )}
        </motion.div>
      </main>
    </div>
  );
}
