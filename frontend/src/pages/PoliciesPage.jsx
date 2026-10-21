import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import PublicNavbar from "@/components/layout/PublicNavbar";

export default function PoliciesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-brand font-bold text-[#00004d] mb-6">{t("Policies & Agreements")}</h1>
        
        <div className="prose prose-slate max-w-none mb-10">
          <p className="text-lg text-slate-600">
            {t("Welcome to the JiNANAM Policy Center. Please review the following documents to understand our guidelines, how we handle your data, and the terms of using our services.")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Privacy Policy Card */}
          <Link 
            to="/info/policies/privacy-policy" 
            className="group block p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-200"
          >
            <h2 className="text-xl font-semibold text-[#00004d] mb-2 group-hover:text-orange-600 transition-colors">
              {t("Privacy Policy")}
            </h2>
            <p className="text-slate-600 text-sm">
              {t("Learn about how we collect, use, and protect your personal information when you use our platform.")}
            </p>
            <div className="mt-4 text-orange-600 text-sm font-medium flex items-center gap-1">
              {t("Read Policy")} <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Terms and Conditions Card */}
          <Link 
            to="/info/policies/terms-conditions" 
            className="group block p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-orange-500 transition-all duration-200"
          >
            <h2 className="text-xl font-semibold text-[#00004d] mb-2 group-hover:text-orange-600 transition-colors">
              {t("Terms and Conditions")}
            </h2>
            <p className="text-slate-600 text-sm">
              {t("Understand the rules, guidelines, and agreements for using the JiNANAM services and website.")}
            </p>
            <div className="mt-4 text-orange-600 text-sm font-medium flex items-center gap-1">
              {t("Read Terms")} <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
