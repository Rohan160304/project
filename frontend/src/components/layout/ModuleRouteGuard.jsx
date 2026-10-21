import { useLocation, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { moduleForRoute, moduleLabel } from "@/lib/access";

/**
 * ModuleRouteGuard — enforces tab access at the route, not just in the sidebar.
 *
 * Hiding a nav link only removes the signpost; the URL still worked. An admin
 * granted the Temple tab could type /admin/donations and get the full page.
 * This wraps the admin outlet and blocks any route whose module the account
 * wasn't granted, so the sidebar and the router agree on one answer.
 *
 * Routes that map to no module (or to DASHBOARD) stay open — those are the
 * shared shell screens every signed-in admin needs.
 */
/**
 * Routes every signed-in admin may reach regardless of tab grants. These show
 * the account its *own* access and team — no privileged data — so gating them
 * behind a module would lock an admin out of the page that explains why they
 * are locked out. `/admins` in particular is the Team & Access Management
 * screen for non-Super-Admins.
 */
const SELF_SERVICE_ROUTES = ["/admins", "/account-status", "/profile"];

function isSelfServiceRoute(pathname) {
  const path = (pathname || "").replace(/^\/admin/, "") || "/";
  return SELF_SERVICE_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));
}

export default function ModuleRouteGuard({ children }) {
  const { pathname } = useLocation();
  const { canDo, isSuperAdmin, allowedModules } = useAuth();
  const { t } = useLanguage();

  const moduleKey = moduleForRoute(pathname);

  const blocked =
    !isSuperAdmin &&
    !isSelfServiceRoute(pathname) &&
    moduleKey &&
    moduleKey !== "DASHBOARD" &&
    !canDo(moduleKey, "VIEW");

  if (!blocked) return children;

  // If a user manually types a URL they don't have permission for, silently redirect to the dashboard
  // instead of showing the full-page "Tab not available" error screen.
  return <Navigate to="/admin/a-dashboard" replace />;
}
