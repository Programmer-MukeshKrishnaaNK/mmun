import { motion } from "framer-motion";
import { Bell, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { Wordmark } from "@/components/brand/Emblem";
import { Avatar } from "@/components/profile/Avatar";
import { ProfileSheet } from "@/components/profile/ProfileSheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { PAGE_TITLES, ROUTES } from "@/constants/routes";
import { useConference } from "@/context/ConferenceContext";
import { signOut } from "@/services/auth";
import { cn } from "@/utils/cn";
import { useNavItems } from "./navigation";

const iconButton =
  "relative grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink";

export function Header() {
  const { profile, unreadCount } = useConference();
  const navItems = useNavItems();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.login, { replace: true });
  };

  const name = profile.status === "ready" ? profile.data.name : undefined;
  const committee = profile.status === "ready" ? profile.data.committee : undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 pt-safe backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6 md:h-16">
        <Link to={ROUTES.home} aria-label="MMUN home" className="shrink-0 rounded-lg">
          <Wordmark />
        </Link>

        <span className="h-5 w-px bg-line-strong md:hidden" aria-hidden />
        <span className="truncate text-sm font-medium text-ink-soft md:hidden">{PAGE_TITLES[pathname] ?? ""}</span>

        <nav aria-label="Primary" className="ml-8 hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-ink" : "text-ink-soft hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="desktop-nav-underline"
                      className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brass-500"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 md:gap-1.5">
          <Link
            to={ROUTES.notifications}
            className={cn(iconButton, pathname === ROUTES.notifications && "bg-paper-deep text-ink")}
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
          >
            <Bell className="size-5" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-rose px-1 text-[0.625rem] leading-4 font-semibold text-white ring-2 ring-paper">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-paper-deep md:py-1 md:pr-3 md:pl-1"
            aria-haspopup="dialog"
            aria-label={name ? `Profile: ${name}` : "Profile"}
          >
            {name ? <Avatar name={name} /> : <Skeleton className="size-8 rounded-full" />}
            <span className="hidden min-w-0 text-left md:block">
              {name ? (
                <>
                  <span className="block max-w-40 truncate text-sm leading-tight font-medium text-ink">{name}</span>
                  {committee && (
                    <span className="block max-w-40 truncate text-xs leading-tight text-ink-faint">{committee}</span>
                  )}
                </>
              ) : (
                <Skeleton className="h-3.5 w-24" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className={cn(iconButton, "hidden md:grid")}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-[18px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onSignOut={handleSignOut} />
    </header>
  );
}
