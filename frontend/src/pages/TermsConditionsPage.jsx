import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsConditionsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#00004d]/95 text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          <Link to="/info/policies" className="hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Link to="/info" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[#FFC107] flex items-center justify-center shadow-md overflow-hidden p-1">
              <img src="/logo.png" alt="JiNANAM Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-brand text-xl leading-none tracking-tight">JiNANAM</div>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-brand font-bold text-[#00004d] mb-8">{t("Terms and Conditions")}</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-8">
            {t("Last updated: August 24, 2026")}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("1. Acceptance of Terms")}</h2>
            <p className="mb-4">
              {t("By accessing and using JiNANAM, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("2. Use of Service")}</h2>
            <p className="mb-4">
              {t("You agree to use our services only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website. Prohibited behavior includes harassing or causing distress or inconvenience to any person, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our services.")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("3. Member Accounts")}</h2>
            <p className="mb-4">
              {t("If you create an account on the platform, you are responsible for maintaining the security of your account, and you are fully responsible for all activities that occur under the account and any other actions taken in connection with it. You must immediately notify us of any unauthorized uses of your account or any other breaches of security.")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("4. Intellectual Property")}</h2>
            <p className="mb-4">
              {t("The service and its original content, features, and functionality are and will remain the exclusive property of JiNANAM and its licensors. The service is protected by copyright, trademark, and other laws of both the local region and foreign countries.")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("5. Termination")}</h2>
            <p className="mb-4">
              {t("We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("6. Changes to Terms")}</h2>
            <p>
              {t("We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.")}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
