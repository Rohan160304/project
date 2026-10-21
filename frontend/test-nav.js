import { NESTED_NAV } from './src/constants/nav.config.js';

const isSuperAdmin = false;
const user = { primaryRoleKey: "TEMPLE_ADMIN", role: "TEMPLE_ADMIN" };
const authModules = [
  { module: "TEMPLES", action: "VIEW" },
  { module: "EVENTS", action: "VIEW" }
];
const orgFacilities = { activeModules: new Set(["BHOJANSHALAS"]) };

function isNodeAllowed(node, isSuperAdmin, user, authModules, orgFacilities = {}, parentModule = null) {
  if (!node) return false;

  if (node.roles && node.roles.length > 0) {
    const userRole = isSuperAdmin ? "SUPER_ADMIN" : (user?.primaryRoleKey || user?.role);
    if (!userRole || !node.roles.includes(userRole)) {
      return false;
    }
  }

  // Super Admin sees all tabs that passed the role check
  if (isSuperAdmin) return true;

  const granted = authModules;

  const route = node.route ? node.route.split("?")[0] : "";
  const isDashboard = node.id === "a-dashboard" || node.id === "sa-dashboard" || route === "/" || route === "/a-dashboard" || route === "/sa-dashboard";

  if (isDashboard) return true;

  const moduleForRoute = () => null; // Mock
  const ownModule = node.module || moduleForRoute(route);
  
  if (!isSuperAdmin && ownModule && ownModule !== "SETTINGS" && ownModule !== "DASHBOARD" && ownModule !== "MODULE_CONTROLLER" && orgFacilities.activeModules) {
    if (!orgFacilities.activeModules.has(ownModule)) {
      return false; 
    }
  }

  const effectiveParentModule = ownModule || parentModule;

  if (node.children && Array.isArray(node.children) && node.children.length > 0) {
    return node.children.some((child) =>
      isNodeAllowed(child, isSuperAdmin, user, granted, orgFacilities, effectiveParentModule)
    );
  }

  if (Array.isArray(granted)) {
    if (granted.length === 0) return false;

    const moduleKey = ownModule || parentModule;
    if (!moduleKey) return false;
    if (moduleKey && moduleKey !== "DASHBOARD") {
      let isAllowed = granted.some((m) => {
        const key = typeof m === "string" ? m : m.module;
        return key === moduleKey || key?.toUpperCase() === moduleKey.toUpperCase();
      });

      if (!isAllowed && (moduleKey === "EVENTS" || moduleKey === "ANNOUNCEMENTS" || moduleKey === "VOLUNTEERS" || moduleKey === "MODULE_CONTROLLER")) {
        const orgModules = ["TEMPLES", "DHARAMSHALAS", "JAIN_CENTERS", "STHANAKS", "BHOJANSHALAS", "COMMUNITY_PAGES"];
        isAllowed = granted.some((m) => {
          const key = typeof m === "string" ? m : m.module;
          return orgModules.includes(key?.toUpperCase());
        });
      }

      if (!isAllowed) return false;
    }
  } 
  
  return true;
}

const settings = NESTED_NAV.find(n => n.id === "group-settings");
console.log("Settings is allowed:", isNodeAllowed(settings, isSuperAdmin, user, authModules, orgFacilities));
