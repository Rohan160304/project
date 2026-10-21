import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowRight, Sparkles, Star, PhoneCall, Mail, MapPin, Rocket
} from "lucide-react";
import PublicNavbar from "@/components/layout/PublicNavbar";

export default function LandingPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white text-slate-900" data-testid="landing-page">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#00004d] text-white">
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(255,193,7,0.35), transparent 40%), radial-gradient(circle at 80% 90%, rgba(255,193,7,0.25), transparent 40%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs tracking-wider uppercase mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[#FFC107]" />
              {t("Serving the Jain community since 2026")}
            </div>
            <h1 className="font-brand text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              {t("One platform.")}<br />
              <span className="text-[#FFC107]">{t("Every temple, monk & seva")}</span> {t("— beautifully organised.")}
            </h1>
            <p className="mt-6 text-white/80 text-base md:text-lg leading-relaxed max-w-2xl">
              {t("Bookings, donations, events, monk tracking, tour management, dharamshalas and 30+ more modules — real-time, role-scoped, and built for the way Jain organisations actually operate.")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start">
              <Link
                to="/login/admin"
                className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[#FFC107] text-[#00004d] font-semibold hover:brightness-95 transition"
              >
                {t("Admin Login")}
              </Link>
              <Link
                to="/member/login"
                className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-white/20 text-white hover:bg-white/10 transition"
              >
                {t("Member Login")}
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { n: "38+", l: t("Modules") },
                { n: "83", l: t("Gacchas") },
                { n: "23", l: t("Tirthankaras") },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-mono-num font-bold text-3xl text-[#FFC107]">{s.n}</div>
                  <div className="text-xs uppercase tracking-widest text-white/60 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero card visual */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#FFC107]/20 blur-3xl rounded-full" />
              <div className="relative bg-white text-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="bg-[#00004d] text-white p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] tracking-widest uppercase text-[#FFC107]">{t("Live Now")}</div>
                    <div className="text-sm font-semibold">{t("Palitana · Ahmedabad · Mumbai")}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs">{t("3 sockets")}</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {[
                    { label: t("Today's Visitors"), value: "1,250", tone: "text-emerald-600" },
                    { label: t("Donations"), value: "₹2.45L", tone: "text-orange-600" },
                    { label: t("Active Journeys"), value: "12", tone: "text-blue-600" },
                    { label: t("Room Occupancy"), value: "92%", tone: "text-purple-600" },
                  ].map((c) => (
                    <div key={c.label} className="border border-slate-200 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">{t(c.label)}</div>
                      <div className={`font-heading font-bold text-2xl mt-1 font-mono-num ${c.tone}`}>{c.value}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">{t("Incoming Monks")}</div>
                  {[
                    { n: "Muni Shree Pranam Sagar", eta: "1:10 PM", tag: "Arrived" },
                    { n: "Muni Shree Suvir Sagar", eta: "3:45 PM", tag: "Moving" },
                  ].map((m) => (
                    <div key={m.n} className="flex items-center justify-between py-2">
                      <div className="text-sm truncate">{m.n}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500">ETA {m.eta}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.tag === "Arrived" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                          {m.tag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / partners */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "We moved off spreadsheets in a week. Bookings, receipts, and 80G — all clean.", who: "Trustee, Palitana Dharamshala" },
            { quote: "The monk tracking dashboard has changed how we plan yatras entirely.", who: "Sangh Coordinator, Ahmedabad" },
            { quote: "Every module respects our roles. Staff sees exactly what they should.", who: "Temple Admin, Mumbai" },
          ].map((t) => (
            <div key={t.who} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Star className="h-4 w-4 text-[#FFC107] mb-3" />
              <p className="text-sm text-slate-700 leading-relaxed">"{t.quote}"</p>
              <div className="mt-4 text-xs text-slate-500">— {t.who}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-gradient-to-br from-[#00004d] via-[#000066] to-[#00004d] text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
          <Rocket className="h-8 w-8 mx-auto text-[#FFC107] mb-4" />
          <h2 className="font-brand text-3xl md:text-5xl tracking-tight">{t("Ready to bring order to your seva?")}</h2>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            {t("Sign in with your admin credentials. The Super Admin demo account is pre-seeded in your backend — try it now.")}
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              onClick={() => window.location.assign("https://jinanam.org/admin/login")}
              className="bg-[#FFC107] hover:bg-[#FFB300] text-[#00004d] font-semibold h-12 px-8 rounded-full"
            >
              {t("Open Admin Panel")} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#00004d] text-white/80 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-[#FFC107] flex items-center justify-center overflow-hidden p-1">
                <img src="/logo.png" alt={t("JiNANAM Logo")} className="w-full h-full object-contain" />
              </div>
              <div className="font-brand text-xl text-white">{t("JiNANAM")}</div>
            </div>
            <p className="text-xs mt-4 leading-relaxed">
              {t("A unified admin panel for the modern Jain community — temples, dharamshalas, monks, and members, together at last.")}
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[#FFC107] mb-3">{t("Platform")}</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/info" className="hover:text-[#FFC107]">{t("Home")}</Link></li>
              <li><Link to="/info/about" className="hover:text-[#FFC107]">{t("About")}</Link></li>
              <li><Link to="/info/contact" className="hover:text-[#FFC107]">{t("Contact")}</Link></li>
              <li><Link to="/info/policies" className="hover:text-[#FFC107]">{t("Policies")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[#FFC107] mb-3">{t("Access")}</div>
            <ul className="space-y-2 text-sm">
              <li><a href="https://jinanam.org/admin/login" className="hover:text-[#FFC107]">{t("Admin Sign In")}</a></li>
              <li><a href="https://jinanam.org/member/login" className="hover:text-[#FFC107]">{t("Member Sign In")}</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[#FFC107] mb-3">{t("Contact")}</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><PhoneCall className="h-3.5 w-3.5 text-[#FFC107]" /> +91 99999 00000</li>
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#FFC107]" /> support@jinanam.org</li>
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#FFC107]" /> {t("Ahmedabad, India")}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
          {t("© 2026 JiNANAM. Made with devotion.")} <span className="text-[#FFC107]">{t("Jai Jinendra")}</span>
        </div>
      </footer>
    </div>
  );
}
