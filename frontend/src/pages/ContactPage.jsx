import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import PublicNavbar from "@/components/layout/PublicNavbar";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-16">
        <h1 className="text-4xl font-brand font-bold text-[#00004d] mb-6">{t("Contact Us")}</h1>
        <div className="prose prose-slate max-w-none">
          <p>{t("Get in touch with the JiNANAM team.")}</p>
          <ul className="list-disc pl-5 mt-4">
            <li><strong>Email:</strong> support@jinanam.org</li>
            <li><strong>Phone:</strong> +91 99999 00000</li>
            <li><strong>Location:</strong> Ahmedabad, India</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
