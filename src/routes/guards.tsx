import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Emblem } from "@/components/brand/Emblem";
import { isAdmin } from "@/constants/admin";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";

const AuthenticatedApp = lazy(() => import("./AuthenticatedApp"));

function SplashScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper" role="status" aria-label="Loading MMUN portal">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="grid size-14 place-items-center rounded-2xl bg-navy-900 text-brass-400"
      >
        <Emblem className="size-8" />
      </motion.div>
    </div>
  );
}

interface FromState {
  from?: string;
}

/** Signed-out users go to /login (remembering where they were headed). */
export function RequireAuth() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <SplashScreen />;
  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname } satisfies FromState} />;
  }
  return (
    <Suspense fallback={<SplashScreen />}>
      <AuthenticatedApp key={user.uid} user={user} />
    </Suspense>
  );
}

/** Signed-in users skip the login page. */
export function PublicOnly() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <SplashScreen />;
  if (user) {
    const from = (location.state as FromState | null)?.from;
    const target = from && from !== ROUTES.login ? from : ROUTES.home;
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}

/**
 * Organizer-only routes. Sits inside RequireAuth, so `user` is already present.
 * This is presentation, not protection — firestore.rules is what actually stops
 * a delegate reading or writing organizer data. A non-organizer who reaches
 * /admin is sent home rather than shown an empty console.
 */
export function RequireAdmin() {
  const { user } = useAuth();
  if (!isAdmin(user?.uid)) return <Navigate to={ROUTES.home} replace />;
  return <Outlet />;
}
