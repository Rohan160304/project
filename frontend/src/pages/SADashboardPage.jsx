import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Landmark, HeartHandshake, HandHeart, ClipboardList, BarChart3, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const ORG_TYPES = [
  { key: "ALL",            label: "All Types" },
  { key: "TEMPLE",         label: "Temples" },
  { key: "DHARAMSHALA",    label: "Dharamshalas" },
  { key: "JAIN_CENTER",    label: "Jain Centers" },
  { key: "STHANAK",        label: "Sthanaks" },
  { key: "COMMUNITY_PAGE", label: "Community Pages" },
];

const AREAS  = ["Palitana", "Girnar", "Shatrunjaya", "Pawapuri", "Rajgir"];
const CITIES = ["Ahmedabad", "Mumbai", "Surat", "Rajkot", "Vadodara", "Pune", "Delhi"];
const STATES = ["Gujarat", "Maharashtra", "Rajasthan", "Karnataka", "Tamil Nadu", "Uttar Pradesh"];

function SectionCard({ number, title, viewAll, viewAllTo, children }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <Card className="p-5 rounded-xl border-border bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-base md:text-lg font-semibold text-foreground">
          {number && <span className="text-primary">{number}.</span>} {title}
        </h2>
        {viewAll && (
          <button
            onClick={() => viewAllTo && navigate(viewAllTo)}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5 font-bold"
          >
            {t("action.viewAll", "View All")} <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      {children}
    </Card>
  );
}

export default function SADashboardPage() {
  const { isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [platformData, setPlatformData] = useState(null);
  const [allOrgs, setAllOrgs] = useState([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedOrgType, setSelectedOrgType] = useState("ALL");
  const [selectedArea, setSelectedArea] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedState, setSelectedState] = useState("ALL");

  useEffect(() => {
    if (!isSuperAdmin) { navigate("/", { replace: true }); return; }

    api.get("/dashboard/platform")
      .then((res) => setPlatformData(res.data?.data || null))
      .catch(() => {});

    // Fetch all org types in parallel and merge
    Promise.all([
      api.get("/temples").then((r) => (r.data?.data?.items || r.data?.data || []).map((o) => ({ ...o, type: o.type || "TEMPLE" }))).catch(() => []),
      api.get("/dharamshalas").then((r) => (r.data?.data?.items || r.data?.data || []).map((o) => ({ ...o, type: o.type || "DHARAMSHALA" }))).catch(() => []),
      api.get("/jain-centers").then((r) => (r.data?.data?.items || r.data?.data || []).map((o) => ({ ...o, type: o.type || "JAIN_CENTER" }))).catch(() => []),
    ]).then(([temples, dharamshalas, jainCenters]) => {
      setAllOrgs([...temples, ...dharamshalas, ...jainCenters]);
    });
  }, [isSuperAdmin, navigate]);

  const filteredOrgs = allOrgs.filter((o) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!o.name?.toLowerCase().includes(q) && !o.publicId?.toLowerCase().includes(q)) return false;
    }
    if (selectedOrgType !== "ALL" && o.type !== selectedOrgType) return false;
    if (selectedCity !== "ALL" && o.city !== selectedCity) return false;
    if (selectedState !== "ALL" && o.state !== selectedState) return false;
    return true;
  });

  // Use filtered recent orgs for the "Newest Organizations" section
  const recentOrgs = searchQuery || selectedOrgType !== "ALL" || selectedCity !== "ALL" || selectedState !== "ALL"
    ? filteredOrgs.slice(0, 5)
    : (platformData?.recentOrgs || []);

  return (
    <div className="space-y-6" data-testid="sa-dashboard-view">

      {/* Inline filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search with results dropdown */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder={t("Search organisation…")}
            className="w-full pl-9 pr-3 h-10 text-xs rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-slate-400"
          />
          {showResults && searchQuery.trim() && filteredOrgs.length > 0 && (
            <div className="absolute top-11 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto p-1 space-y-0.5">
              {filteredOrgs.slice(0, 8).map((o) => (
                <button
                  key={o.id}
                  onMouseDown={() => { setSearchQuery(o.name); setShowResults(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-md font-medium text-slate-700 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold">O</span>
                  <span className="flex-1 min-w-0">
                    <span className="font-bold block truncate">{o.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {o.publicId && <span className="font-mono text-orange-500 mr-1">{o.publicId}</span>}
                      {[o.city, o.state].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* All Areas */}
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-32 h-10 text-xs font-semibold bg-white border border-border">
            <SelectValue placeholder={t("All Areas")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs font-medium">{t("All Areas")}</SelectItem>
            {AREAS.map((a) => <SelectItem key={a} value={a} className="text-xs font-medium">{a}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* All Cities */}
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-32 h-10 text-xs font-semibold bg-white border border-border">
            <SelectValue placeholder={t("All Cities")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs font-medium">{t("All Cities")}</SelectItem>
            {CITIES.map((c) => <SelectItem key={c} value={c} className="text-xs font-medium">{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* All States */}
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-32 h-10 text-xs font-semibold bg-white border border-border">
            <SelectValue placeholder={t("All States")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs font-medium">{t("All States")}</SelectItem>
            {STATES.map((s) => <SelectItem key={s} value={s} className="text-xs font-medium">{s}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Org Type */}
        <Select value={selectedOrgType} onValueChange={setSelectedOrgType}>
          <SelectTrigger className="w-36 h-10 text-xs font-semibold bg-white border border-border">
            <SelectValue placeholder={t("All Types")} />
          </SelectTrigger>
          <SelectContent>
            {ORG_TYPES.map((tItem) => (
              <SelectItem key={tItem.key} value={tItem.key} className="text-xs font-medium">{t(tItem.label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label={t("Total Members")} value={(platformData?.totalMembers ?? 0).toLocaleString()} delta={t("Active on platform")} icon={Users} tone="green" />
        <StatCard label={t("Registered Orgs")} value={(platformData?.totalOrgs ?? 0).toLocaleString()} delta={t("Temples & centers")} icon={Landmark} tone="blue" />
        <StatCard label={t("Total Donations")} value={formatCurrency(platformData?.totalDonations ?? 0)} delta={t("Platform-wide ledger")} icon={HeartHandshake} tone="green" />
        <StatCard label={t("Active Volunteers")} value={(platformData?.activeVolunteers ?? 0).toLocaleString()} delta={t("Assigned today")} icon={HandHeart} tone="orange" />
        <StatCard label={t("Ticket Sales")} value={(platformData?.pendingTickets ?? 0).toLocaleString()} delta={t("Event tickets sold")} icon={ClipboardList} tone="purple" />
      </div>

      {/* Charts & Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard number="1" title={t("Newest Organizations")}>
          <div className="space-y-3">
            {recentOrgs.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground font-medium">{t("No organizations found.")}</div>
            ) : (
              recentOrgs.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{o.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
                      {o.publicId && <span className="font-mono text-orange-500 mr-1">{o.publicId}</span>}
                      {o.type?.replace(/_/g, " ")} · {o.city || "India"}
                    </div>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard number="2" title={t("Newest Members")}>
          <div className="space-y-3">
            {(!platformData?.recentMembers || platformData.recentMembers.length === 0) ? (
              <div className="text-center py-12 text-xs text-muted-foreground font-medium">{t("No recent member signups.")}</div>
            ) : (
              platformData.recentMembers.map((m) => (
                <div key={m.publicId} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{m.fullName}</div>
                    <div className="text-[10px] font-mono text-orange-600 mt-0.5">{m.publicId}</div>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">{m.category}</Badge>
                </div>
              ))
            )}
          </div>
        </SectionCard>


      </div>
    </div>
  );
}
