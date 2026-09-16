import { MotionConfig } from "framer-motion";
import { lazy } from "react";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router";
import { ROUTES } from "./constants/routes";
import { AuthProvider } from "./context/AuthContext";
import { NowProvider } from "./context/NowContext";
import LoginPage from "./pages/LoginPage";
import { PublicOnly, RequireAdmin, RequireAuth } from "./routes/guards";

const HomePage = lazy(() => import("./pages/HomePage"));
const PlannerPage = lazy(() => import("./pages/PlannerPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const NewspaperPage = lazy(() => import("./pages/NewspaperPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

const router = createBrowserRouter([
  { path: "/", element: <Navigate to={ROUTES.home} replace /> },
  {
    element: <PublicOnly />,
    children: [{ path: ROUTES.login, element: <LoginPage /> }],
  },
  {
    // RequireAuth renders the lazily-loaded shell (ConferenceProvider + AppShell + <Outlet />).
    element: <RequireAuth />,
    children: [
      { path: ROUTES.home, element: <HomePage /> },
      { path: ROUTES.planner, element: <PlannerPage /> },
      { path: ROUTES.help, element: <HelpPage /> },
      { path: ROUTES.guide, element: <GuidePage /> },
      { path: ROUTES.newspaper, element: <NewspaperPage /> },
      { path: ROUTES.notifications, element: <NotificationsPage /> },
      {
        // Organizer console — its own chunk, so delegates never download it.
        element: <RequireAdmin />,
        children: [{ path: ROUTES.admin, element: <AdminPage /> }],
      },
    ],
  },
  { path: "*", element: <Navigate to={ROUTES.home} replace /> },
]);

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <NowProvider>
          <RouterProvider router={router} />
        </NowProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
