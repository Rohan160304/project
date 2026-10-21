import { Shield, User as UserIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function PortalSwitcher({ currentPortal, user }) {
  const { t } = useLanguage();
  
  // If in member portal, user must not have a purely member role to see admin portal
  const isMemberRole = (role) => ["MEMBER", "NON_JAIN_MEMBER"].includes(String(role || "").toUpperCase());
  
  if (currentPortal === "member") {
    const showAdminSwitch = user && !isMemberRole(user.primaryRoleKey);
    if (!showAdminSwitch) return null;
  }

  if (currentPortal === "admin") {
    // If in admin portal, user must have a publicId (meaning they are linked to a member profile)
    if (!user?.publicId) return null;
  }

  const handleSwitchToMember = () => {
    if (currentPortal === "member") return;
    const token = localStorage.getItem("jinanam_access_token");
    const refresh = localStorage.getItem("jinanam_refresh_token");
    if (token) localStorage.setItem("jinanam_member_access_token", token);
    if (refresh) localStorage.setItem("jinanam_member_refresh_token", refresh);
    localStorage.setItem("jinanam_member_user", JSON.stringify(user));
    window.location.href = "/member/home";
  };

  const handleSwitchToAdmin = () => {
    if (currentPortal === "admin") return;
    const token = localStorage.getItem("jinanam_member_access_token");
    const refresh = localStorage.getItem("jinanam_member_refresh_token");
    if (token) localStorage.setItem("jinanam_access_token", token);
    if (refresh) localStorage.setItem("jinanam_refresh_token", refresh);
    localStorage.setItem("jinanam_user", JSON.stringify(user));
    window.location.href = "/admin/a-dashboard";
  };

  return (
    <div className="flex items-center bg-slate-100/80 p-0.5 rounded-full border border-slate-200/60 relative w-[130px] sm:w-[150px] h-8 shadow-inner overflow-hidden shrink-0">
      {/* Animated Sliding Background */}
      <div 
        className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          currentPortal === "admin" 
            ? "translate-x-full bg-orange-100 border border-orange-200" 
            : "translate-x-0 bg-white border border-slate-200"
        }`}
      />

      {/* Member Button */}
      <button
        onClick={handleSwitchToMember}
        className={`relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-full text-[10px] sm:text-[11px] font-bold transition-colors z-10 ${
          currentPortal === "member" ? "text-slate-700" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <UserIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("Member")}</span>
      </button>

      {/* Admin Button */}
      <button
        onClick={handleSwitchToAdmin}
        className={`relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-full text-[10px] sm:text-[11px] font-bold transition-colors z-10 ${
          currentPortal === "admin" ? "text-orange-700" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Shield className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("Admin")}</span>
      </button>
    </div>
  );
}
