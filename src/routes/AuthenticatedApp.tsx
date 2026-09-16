import { ConferenceProvider } from "@/context/ConferenceContext";
import { AppShell } from "@/layouts/AppShell";
import type { AuthUser } from "@/services/auth";

/**
 * Everything behind sign-in (Firestore, shell, listeners) lives in this lazily
 * loaded chunk, so the login page stays light on phones.
 */
export default function AuthenticatedApp({ user }: { user: AuthUser }) {
  return (
    <ConferenceProvider user={user}>
      <AppShell />
    </ConferenceProvider>
  );
}
