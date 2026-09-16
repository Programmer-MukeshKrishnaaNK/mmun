import { BookOpen, CalendarClock, House, LifeBuoy, Newspaper, ShieldCheck, type LucideIcon } from "lucide-react";
import { isAdmin } from "@/constants/admin";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { to: ROUTES.home, label: "Home", icon: House },
  { to: ROUTES.planner, label: "Planner", icon: CalendarClock },
  { to: ROUTES.newspaper, label: "News", icon: Newspaper },
  { to: ROUTES.help, label: "Help", icon: LifeBuoy },
  { to: ROUTES.guide, label: "Guide", icon: BookOpen },
];

export const ADMIN_NAV: NavItem = { to: ROUTES.admin, label: "Admin", icon: ShieldCheck };

/**
 * Nav for the signed-in user. Organizers get one extra tab; everyone else sees
 * no trace of it — the console isn't even downloaded, since it's a lazy chunk
 * behind a route they can't reach.
 */
export function useNavItems(): NavItem[] {
  const { user } = useAuth();
  return isAdmin(user?.uid) ? [...PRIMARY_NAV, ADMIN_NAV] : PRIMARY_NAV;
}
