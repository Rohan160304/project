import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl md:text-4xl font-brand font-bold text-[#00004d] mb-8">{t("Privacy Policy")}</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-8">
            {t("Last updated: August 24, 2026")}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("1. Information Collection")}</h2>
            <p className="mb-4">
              {t("We collect information you provide directly to us when you use our platform, including when you register, update your profile, make a donation, or communicate with us. This may include your name, email address, phone number, and any other details you choose to share.")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("2. Use of Information")}</h2>
            <p className="mb-4">
              {t("The information we collect is used to:")}
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>{t("Provide, maintain, and improve our services.")}</li>
              <li>{t("Process transactions and send related information.")}</li>
              <li>{t("Send administrative messages, security alerts, and support notifications.")}</li>
              <li>{t("Communicate with you about products, services, offers, and events.")}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("3. Information Sharing")}</h2>
            <p className="mb-4">
              {t("We do not share your personal information with third parties except as described in this privacy policy, such as with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.")}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("4. Data Security")}</h2>
            <p className="mb-4">
              {t("We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#00004d] mb-4">{t("5. Contact Us")}</h2>
            <p>
              {t("If you have any questions about this Privacy Policy, please contact us at support@jinanam.app.")}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
