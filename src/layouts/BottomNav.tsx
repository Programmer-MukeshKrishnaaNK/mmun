import { motion } from "framer-motion";
import { NavLink } from "react-router";
import { cn } from "@/utils/cn";
import { useNavItems } from "./navigation";

/** Native-feeling tab bar for phones. Hidden from md up (desktop uses the header nav). */
export function BottomNav() {
  const navItems = useNavItems();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-safe backdrop-blur-lg md:hidden"
    >
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className="flex h-[3.875rem] flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium tracking-wide"
            >
              {({ isActive }) => (
                <>
                  <span className="relative grid h-8 w-14 place-items-center">
                    {isActive && (
                      <motion.span
                        layoutId="bottom-nav-pill"
                        className="absolute inset-0 rounded-full bg-navy-100"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "relative size-[21px] transition-colors",
                        isActive ? "text-navy-900" : "text-ink-faint",
                      )}
                      strokeWidth={isActive ? 2.1 : 1.8}
                      aria-hidden
                    />
                  </span>
                  <span className={cn("transition-colors", isActive ? "text-navy-900" : "text-ink-faint")}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
