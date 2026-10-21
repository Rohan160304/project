import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, Shield } from "lucide-react";

export default function PublicNavbar() {
  const { t } = useLanguage();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    const baseClass = "transition-colors";
    const activeClass = "text-[#FFC107] font-semibold";
    const inactiveClass = "hover:text-[#FFC107]";
    
    return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[#00004d]/95 text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-[#FFC107] flex items-center justify-center shadow-md overflow-hidden p-1">
            <img src="/logo.png" alt={t("JiNANAM Logo")} className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-brand text-xl leading-none tracking-tight">{t("JiNANAM")}</div>
            <div className="text-[10px] tracking-[0.28em] uppercase text-white/70 mt-0.5">{t("Admin Panel")}</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/80">
          <Link to="/info" className={navLinkClass("/info")}>{t("Home")}</Link>
          <Link to="/info/about" className={navLinkClass("/info/about")}>{t("About")}</Link>
          <Link to="/info/contact" className={navLinkClass("/info/contact")}>{t("Contact")}</Link>
          <Link to="/info/policies" className={navLinkClass("/info/policies")}>{t("Policies")}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/member/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/30 text-white text-sm hover:bg-white/10 transition"
          >
            <User className="h-4 w-4" /> <span className="hidden sm:inline">{t("Member Login")}</span>
          </Link>
          <Link
            to="/login/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFC107] text-[#00004d] font-semibold text-sm hover:brightness-95 transition"
          >
            <Shield className="h-4 w-4" /> <span className="hidden sm:inline">{t("Admin Login")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
