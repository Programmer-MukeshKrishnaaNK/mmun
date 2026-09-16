import { motion } from "framer-motion";
import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Skeleton } from "@/components/ui/Skeleton";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

function PageFallback() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-5 pb-nav sm:px-6 md:pt-9 md:pb-16">
        <Suspense fallback={<PageFallback />}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
