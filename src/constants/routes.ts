export const ROUTES = {
  login: "/login",
  home: "/home",
  planner: "/planner",
  help: "/help",
  guide: "/guide",
  newspaper: "/newspaper",
  notifications: "/notifications",
  admin: "/admin",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const PAGE_TITLES: Record<string, string> = {
  [ROUTES.home]: "Home",
  [ROUTES.planner]: "Planner",
  [ROUTES.help]: "Help",
  [ROUTES.guide]: "Guide",
  [ROUTES.newspaper]: "Newspaper",
  [ROUTES.notifications]: "Notifications",
  [ROUTES.admin]: "Organizer",
};
