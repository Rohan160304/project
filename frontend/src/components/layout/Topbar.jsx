import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { Bell, LogOut, User as UserIcon, Menu, ChevronDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { initials } from "@/lib/utils";
import { ROLE_LABELS } from "@/constants/modules";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { PortalSwitcher } from "@/components/common/PortalSwitcher";

export default function Topbar({ onToggleSidebar }) {
  const { user, logout, isSuperAdmin, canDo, organizations, activeOrganizationId, setActiveOrganizationId } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [activeAdmins, setActiveAdmins] = useState(1);

  const { socket, connected } = useSocket(
    "/dashboards",
    {
      "admins:active-count": (evt) => {
        if (evt && typeof evt.count === "number") {
          setActiveAdmins(evt.count);
        }
      },
    },
    { enabled: isSuperAdmin }
  );

  useEffect(() => {
    if (connected && socket && isSuperAdmin) {
      socket.emit("subscribe:platform");
    }
  }, [connected, socket, isSuperAdmin]);



  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.mobile ||
    "Admin";

  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 h-16 md:h-20 bg-white border-b border-border flex items-center px-3 md:px-6 gap-2 md:gap-3">
      {/* Hamburger + Admin Name — Attendo-style left group */}
      <button
        className="flex items-center gap-2.5 shrink-0 group hover:opacity-80 transition-opacity"
        onClick={onToggleSidebar}
        data-testid="topbar-menu-button"
        aria-label={t("Toggle sidebar")}
      >
        <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center bg-white group-hover:bg-slate-50 transition-colors">
          <Menu className="h-4.5 w-4.5 text-slate-700" style={{ width: 18, height: 18 }} />
        </div>
        <span className="hidden sm:block text-sm font-bold text-slate-800 tracking-tight">{name}</span>
      </button>

      {/* Divider */}
      <div className="hidden sm:block h-7 w-px bg-slate-200 mx-1 shrink-0" />



      <div className="flex items-center gap-2 md:gap-3 ml-auto shrink-0">
        {/* Active users chip - hidden on mobile */}
        {isSuperAdmin && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-foreground">{activeAdmins} {t("Active Admin")}{activeAdmins > 1 ? 's' : ''}</span>
          </div>
        )}

        {organizations && organizations.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 transition-colors"
                title={t("topbar.switchOrganization", "Switch Organization")}
              >
                <Building2 className="h-4 w-4 text-slate-500" />
                <span className="hidden lg:block text-xs font-semibold max-w-[150px] truncate text-slate-700">
                  {organizations.find(o => o.id === activeOrganizationId)?.name || "Select Org"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("topbar.myOrganizations", "My Organizations")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.map(org => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => setActiveOrganizationId(org.id)}
                  className={`flex flex-col items-start gap-0.5 cursor-pointer ${activeOrganizationId === org.id ? "bg-orange-50/50" : ""}`}
                >
                  <span className={`font-semibold text-xs truncate w-full ${activeOrganizationId === org.id ? "text-orange-700" : ""}`}>{org.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">{org.type}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <PortalSwitcher currentPortal="admin" user={user} />

        <LanguageSwitcher />

        {(isSuperAdmin || canDo("NOTIFICATIONS", "VIEW")) && (
          <button
            className="relative h-9 w-9 md:h-10 md:w-10 rounded-full border border-border bg-white flex items-center justify-center hover:bg-secondary/60 transition-colors"
            onClick={() => navigate("/notifications")}
            data-testid="topbar-notifications-button"
          >
            <Bell className="h-4 w-4 text-foreground" />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 pl-1 pr-2 md:pr-3 py-1 rounded-full border border-border bg-white hover:bg-secondary/60 transition-colors"
              data-testid="topbar-user-menu"
            >
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-sm font-semibold">{name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {ROLE_LABELS[user?.primaryRoleKey] || "Member"}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">{user?.mobile}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              data-testid="topbar-menu-settings"
            >
              <UserIcon className="h-4 w-4 mr-2" /> {t("Profile & Settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              data-testid="topbar-menu-logout"
            >
              <LogOut className="h-4 w-4 mr-2" /> {t("Logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

