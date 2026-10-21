import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import PublicNavbar from "@/components/layout/PublicNavbar";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-16">
        <h1 className="text-4xl font-brand font-bold text-[#00004d] mb-6">{t("About Us")}</h1>
        <div className="prose prose-slate max-w-none">
          <p>
            {t("JiNANAM is a unified platform for the modern Jain community, seamlessly integrating temples, dharamshalas, monks, and members.")}
          </p>
          <p>
            {t("Our mission is to bring order to your seva, empowering organizations to manage bookings, donations, events, monk tracking, and much more in real-time.")}
          </p>
        </div>
      </main>
    </div>
  );
}
