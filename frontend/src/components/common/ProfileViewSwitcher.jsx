import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, User as UserIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function ProfileViewSwitcher({
  currentView,
  publicId,
  userId,
  hasAdminAccess,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // If we don't have enough info to show the toggle, render nothing
  if (!publicId || (!hasAdminAccess && currentView === "member")) {
    return null;
  }

  const handleSwitchToMember = () => {
    if (currentView === "member") return;
    if (publicId) {
      navigate(`/admin/members/${publicId}`);
    }
  };

  const handleSwitchToAdmin = () => {
    if (currentView === "admin") return;
    if (userId) {
      navigate(`/admin/admins/${userId}`);
    }
  };

  return (
    <div className="flex items-center bg-slate-100/80 p-0.5 rounded-full border border-slate-200/60 relative w-[180px] h-9 shadow-inner overflow-hidden shrink-0">
      {/* Animated Sliding Background */}
      <div
        className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          currentView === "admin"
            ? "translate-x-full bg-orange-100 border border-orange-200"
            : "translate-x-0 bg-white border border-slate-200"
        }`}
      />

      {/* Member Profile Button */}
      <button
        onClick={handleSwitchToMember}
        className={`relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-full text-xs font-bold transition-colors z-10 ${
          currentView === "member"
            ? "text-slate-700"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <UserIcon className="h-4 w-4" />
        <span>{t("Member")}</span>
      </button>

      {/* Admin Profile Button */}
      <button
        onClick={handleSwitchToAdmin}
        className={`relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-full text-xs font-bold transition-colors z-10 ${
          currentView === "admin"
            ? "text-orange-700"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Shield className="h-4 w-4" />
        <span>{t("Admin")}</span>
      </button>
    </div>
  );
}
