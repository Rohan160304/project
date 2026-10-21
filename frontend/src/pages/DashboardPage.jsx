import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, extractErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, UtensilsCrossed, HandHeart, BedDouble, HeartHandshake,
  MapPin, Sparkles, Coffee, Sun, Moon, CalendarPlus, Bell,
  Megaphone, ChevronRight, Send, Route as RouteIcon, ClipboardList,
  Landmark, PlusCircle, BarChart3, TrendingUp, Search, BellRing, UserPlus
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";
import { formatCurrency, formatDate, initials, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { LiveBadge } from "@/components/common/LiveBadge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


// Rich mock data used to demonstrate the design at full fidelity.
// Real data will drop-in from the backend calls below.
const MOCK_MONKS = [
  { id: 1, name: "Pujya Gurudev Shree", currently: "Bhavnagar", eta: "2:30 PM", status: "Moving", tone: "blue" },
  { id: 2, name: "Pujya Muni Shree Pranam Sagar", currently: "Botad", eta: "1:10 PM", status: "Arrived", tone: "green" },
  { id: 3, name: "Pujya Muni Shree Suvir Sagar", currently: "Vadech", eta: "3:45 PM", status: "Moving", tone: "blue" },
  { id: 4, name: "Pujya Muni Shree Aditya Sagar", currently: "Rajkot", eta: "5:20 PM", status: "Resting", tone: "orange" },
  { id: 5, name: "Pujya Muni Shree Shubh Sagar", currently: "Amreli", eta: "6:15 PM", status: "Moving", tone: "blue" },
];

const MOCK_YATRA = [
  { name: "Shree Vardhaman Sangh", participants: 120, completed: "3 / 4", progress: 45 },
  { name: "Shree Mahavir Yuva Sangh", participants: 85, completed: "2 / 4", progress: 30 },
  { name: "Shree Jin Shasan Vrudh Sangh", participants: 60, completed: "4 / 4", progress: 60 },
  { name: "Shree Shwetambar Sangh", participants: 95, completed: "3 / 4", progress: 50 },
  { name: "Shree Digambar Yatra Sangh", participants: 20, completed: "1 / 4", progress: 15 },
];

const MOCK_EVENTS = [
  { day: 28, month: "May", title: "Paryushan Mahaparva", time: "05:30 AM - 08:30 PM", tone: "orange" },
  { day: 30, month: "May", title: "Pravachan by Muni Shree", time: "07:00 PM - 08:30 PM", tone: "purple" },
  { day: 2, month: "Jun", title: "Sangh Yatra", time: "06:00 AM - 05:00 PM", tone: "green" },
];

const MOCK_VOLUNTEERS = [
  { name: "Mahesh Shah", duty: "Dharamshala Desk", time: "06:00 AM - 02:00 PM" },
  { name: "Pratibha Jain", duty: "Bhojanshala", time: "10:00 AM - 02:00 PM" },
  { name: "Dhiren Mehta", duty: "Pujya Aagaman Seva", time: "08:00 AM - 12:00 PM" },
  { name: "Jigna Shah", duty: "Yatra Assistance", time: "02:00 PM - 08:00 PM" },
  { name: "Kirit Mehta", duty: "Parking & Crowd", time: "06:00 AM - 06:00 PM" },
];

const MOCK_DONATIONS_TREND = [
  { t: "12 AM", v: 40000 }, { t: "6 AM", v: 60000 }, { t: "12 PM", v: 120000 },
  { t: "6 PM", v: 180000 }, { t: "12 AM", v: 245000 },
];

const MOCK_RECENT_DONORS = [
  { name: "Mahesh Shah", amount: 21000, time: "10:15 AM" },
  { name: "Pratibha Jain", amount: 11000, time: "09:40 AM" },
  { name: "Shree Vardhaman Sangh", amount: 51000, time: "09:15 AM" },
  { name: "Dhiren Mehta", amount: 5100, time: "08:30 AM" },
  { name: "Anonymous", amount: 31000, time: "07:45 AM" },
];

const MOCK_ANNOUNCEMENTS = [
  { icon: Megaphone, tone: "blue", title: "Bhojanshala Timing Update", desc: "From tomorrow, lunch timing will be 11:15 AM to 01:15 PM.", when: "Today, 09:00 AM" },
  { icon: RouteIcon, tone: "green", title: "Yatra Route Update", desc: "Girnar yatra route is open. Please follow updated guidelines.", when: "Today, 08:30 AM" },
  { icon: ClipboardList, tone: "purple", title: "Temple Notice", desc: "All devotees are requested to maintain silence in the temple premises.", when: "Today, 08:00 AM" },
];

const MOCK_ROOM_FLOORS = [
  { name: "Ground Floor", occupied: 20, total: 24, cleaning: 4 },
  { name: "First Floor", occupied: 22, total: 24, cleaning: 1 },
  { name: "Second Floor", occupied: 22, total: 24, cleaning: 1 },
  { name: "Third Floor", occupied: 20, total: 24, cleaning: 0 },
  { name: "VIP Rooms", occupied: 8, total: 8, cleaning: 0 },
];

function SendReminderDialog({ open, onClose }) {
  const { t } = useLanguage();
  const [audience, setAudience] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!message.trim()) { toast.error(t("Please enter a message.")); return; }
    setLoading(true);
    try {
      await api.post("/notifications/broadcast", { audience, body: message, category: "SERVICE" });
      toast.success(t("Reminder sent successfully!"));
      setMessage("");
      onClose();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("Send Reminder")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">{t("Target Audience")}</Label>
            <select
              className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="ALL">{t("All Members")}</option>
              <option value="VOLUNTEERS">{t("Volunteers Only")}</option>
              <option value="REGISTERED">{t("Event Registrants")}</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">{t("Message *")}</Label>
            <Textarea
              className="mt-1"
              rows={4}
              placeholder={t("Type your reminder message here…")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Cancel")}</Button>
          <Button onClick={send} disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            {loading ? t("Sending…") : t("Send Reminder")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionCard({ number, title, viewAll, viewAllTo, children, testId, className = "" }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();
  // Section numbers only make sense when the full set renders. Once panels are
  // gated by tab access a delegated admin would see e.g. a lone "9.", so the
  // numbering is dropped for them.
  const showNumber = isSuperAdmin && number;
  return (
    <Card className={`p-5 rounded-xl border-border bg-white ${className}`} data-testid={testId}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-base md:text-lg font-semibold text-foreground">
          {showNumber && <span className="text-primary">{number}.</span>} {title}
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

const STATUS_TONE = {
  Moving: "bg-blue-100 text-blue-700",
  Arrived: "bg-emerald-100 text-emerald-700",
  Resting: "bg-orange-100 text-orange-700",
  Upcoming: "bg-orange-100 text-orange-700",
  Active: "bg-emerald-100 text-emerald-700",
};

const STATUS_BADGES = {
  Moving: "bg-blue-100 text-blue-700",
  Arrived: "bg-emerald-100 text-emerald-700",
  Resting: "bg-orange-100 text-orange-700",
  Active: "bg-emerald-100 text-emerald-700",
};

const ORG_TYPES = [
  { key: "TEMPLE", label: "Temples" },
  { key: "DHARAMSHALA", label: "Dharamshalas" },
  { key: "JAIN_CENTER", label: "Jain Centers" },
  { key: "STHANAK", label: "Sthanaks" },
  { key: "COMMUNITY_PAGE", label: "Community Pages" },
  { key: "BHOJANSHALA", label: "Bhojanshalas" },
  { key: "ADMIN", label: "Admins (System & Org)" },
];

export default function DashboardPage() {
  const {
    user, isSuperAdmin, canDo, allowedModules,
    organizationIds, activeOrganizationId, hasNoOrgScope, isGlobalScope,
  } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  /**
   * Personalised dashboard: a panel renders only when the account holds the tab
   * behind it. An admin granted Temple only sees temple-related panels — no
   * donations ledger, no yatra groups, no volunteer roster.
   */
  const shows = useCallback(
    (moduleKey) => canDo(moduleKey, "VIEW"),
    [canDo]
  );



  /** Shortcuts, narrowed to the tabs this account holds. Hidden when empty. */
  const quickActions = [
    { icon: Sun,            labelKey: "dashboard.addEvent",         label: "Add Event",        tone: "blue",   to: "/admin/events",        module: "EVENTS" },
    { icon: Megaphone,      labelKey: "dashboard.sendAnnouncement", label: "Add Announcement", tone: "purple", to: "/admin/announcements", module: "ANNOUNCEMENTS" },
    { icon: BellRing,       labelKey: "dashboard.addNotice",        label: "Notice",           tone: "orange", to: "/admin/notices",       module: "ANNOUNCEMENTS" },
    { icon: UserPlus,       labelKey: "dashboard.addMember",        label: "Add Member",       tone: "green",  to: "/admin/members",       module: "MEMBERS" },
    { icon: HandHeart,      labelKey: "dashboard.addMsProfile",     label: "Add MS Profile",   tone: "red",    to: "/admin/monks",         module: "MONKS" }
  ].filter((q) => shows(q.module));
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState(() => {
    const saved = localStorage.getItem("dashboardSelectedOrgId");
    if (saved) return saved;
    return isSuperAdmin ? "" : activeOrganizationId || "";
  });

  const orgIdRef = useRef(orgId);

  useEffect(() => {
    orgIdRef.current = orgId;
    if (orgId) {
      localStorage.setItem("dashboardSelectedOrgId", orgId);
    } else {
      localStorage.removeItem("dashboardSelectedOrgId");
    }
  }, [orgId]);

  useEffect(() => {
    if (!isSuperAdmin && activeOrganizationId) {
      setOrgId(activeOrganizationId);
    }
  }, [activeOrganizationId, isSuperAdmin]);
  const [selectedType, setSelectedType] = useState("TEMPLE");
  const isTemple = selectedType === "TEMPLE";
  const isBhojanshala = selectedType === "BHOJANSHALA";
  const isJainCenter = selectedType === "JAIN_CENTER";
  const isSthanak = selectedType === "STHANAK";
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [data, setData] = useState(null);
  const [orgName, setOrgName] = useState("Shree Palitana Jain Derasar");
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // A Dashboard filter bar (SA only)
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedArea, setSelectedArea] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedState, setSelectedState] = useState("ALL");

  // Dynamic Data Lists
  const [monksList, setMonksList] = useState([]);
  const [routesList, setRoutesList] = useState([]);
  const [toursList, setToursList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [volunteersList, setVolunteersList] = useState([]);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [donationsList, setDonationsList] = useState([]);

  // Effect 1: Super Admin - Fetch organizations list based on selectedType
  useEffect(() => {
    if (!isSuperAdmin) return;
    
    if (selectedType === "ADMIN") {
      api.get("/auth/admins")
        .then((res) => {
          const list = res.data?.data || [];
          const formatted = list.map(admin => {
            const roleLabel = admin.primaryRoleKey?.replace("_", " ");
            return {
              id: admin.id,
              name: `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || admin.mobile || "Unnamed Admin",
              role: roleLabel,
              organizationIds: admin.userOrganizations?.map(uo => uo.organizationId) || [],
              organizationName: admin.userOrganizations?.[0]?.organization?.name || "No Organization Scope",
            };
          });
          setOrgs(formatted);
          const currentId = orgIdRef.current;
          const existingOrg = currentId ? formatted.find(o => o.id === currentId) : null;
          
          if (existingOrg) {
            setOrgId(existingOrg.id);
            setOrgName(`${existingOrg.name} ${existingOrg.organizationName ? `· ${existingOrg.organizationName}` : ""}`);
          } else if (formatted[0]) {
            setSelectedAdminId(formatted[0].id);
            const targetOrgId = formatted[0].organizationIds[0];
            if (targetOrgId) {
              setOrgId(targetOrgId);
              setOrgName(`${formatted[0].name} · ${formatted[0].organizationName}`);
            } else {
              setOrgId("");
              setOrgName(`${formatted[0].name} (${formatted[0].role || "No Org Scope"})`);
            }
          } else {
            setSelectedAdminId("");
            setOrgId("");
            setOrgName("No admins found");
          }
        })
        .catch(() => {
          setOrgs([]);
          setSelectedAdminId("");
          setOrgId("");
          setOrgName("No admins found");
        });
    } else {
      let endpoint = "/temples";
      if (selectedType === "DHARAMSHALA") endpoint = "/dharamshalas";
      else if (selectedType === "JAIN_CENTER") endpoint = "/jain-centers";
      else if (selectedType === "STHANAK") endpoint = "/sthanaks";
      else if (selectedType === "COMMUNITY_PAGE") endpoint = "/community-pages";
      else if (selectedType === "BHOJANSHALA") endpoint = "/bhojanshalas";

      api.get(endpoint)
        .then((res) => {
          const list = res.data?.data?.items || res.data?.data || [];
          setOrgs(list);
          const currentId = orgIdRef.current;
          const existingOrg = currentId ? list.find(o => o.id === currentId) : null;

          if (existingOrg) {
            setOrgId(existingOrg.id);
            setOrgName(existingOrg.name);
          } else if (list[0]?.id) {
            setOrgId(list[0].id);
            setOrgName(list[0].name);
          } else {
            setOrgId("");
            setOrgName("No organization selected");
          }
        })
        .catch(() => {
          setOrgs([]);
          setOrgId("");
          setOrgName("No organization selected");
        });
    }
  }, [isSuperAdmin, selectedType]);

  // Effect 2: Scoped Admin - Fetch organization name
  useEffect(() => {
    if (isSuperAdmin || !orgId) return;

    // Scoped Admin: fetch their specific organization name
    api.get(`/temples/${orgId}`)
      .then((res) => {
        const org = res.data?.data;
        if (org) setOrgName(org.name);
      })
      .catch(() => {
        api.get(`/dharamshalas/${orgId}`)
          .then((res) => {
            const org = res.data?.data;
            if (org) setOrgName(org.name);
          })
          .catch(() => { });
      });
  }, [isSuperAdmin, orgId]);

  useEffect(() => {
    if (!orgId) return;
    api.get(`/dashboard/admin/${orgId}`)
      .then((res) => setData(res.data?.data || null))
      .catch(() => { });

    // Only fetch what this account's tabs actually cover. A temple-only admin
    // shouldn't be issuing donation or tour requests it has no right to read.
    if (shows("TRACKING") || shows("MONKS")) {
      api.get("/monks").then((res) => {
        setMonksList(res.data?.data || []);
      }).catch(() => { });
      api.get("/tracking/routes").then((res) => {
        setRoutesList(res.data?.data || []);
      }).catch(() => { });
    }

    if (shows("TOURS")) {
      api.get(`/tours?organizationId=${orgId}`).then((res) => {
        setToursList(res.data?.data || []);
      }).catch(() => { });
    }

    if (shows("EVENTS")) {
      api.get(`/events?organizationId=${orgId}`).then((res) => {
        setEventsList(res.data?.data || []);
      }).catch(() => { });
    }

    if (shows("VOLUNTEERS")) {
      api.get(`/volunteers?organizationId=${orgId}`).then((res) => {
        setVolunteersList(res.data?.data || []);
      }).catch(() => { });
    }

    if (shows("ANNOUNCEMENTS") || shows("NEWS")) {
      api.get(`/announcements?organizationId=${orgId}`).then((res) => {
        setAnnouncementsList(res.data?.data || []);
      }).catch(() => { });
    }

    if (shows("DONATIONS")) {
      api.get("/donations").then((res) => {
        setDonationsList(res.data?.data || []);
      }).catch(() => { });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, reloadKey, allowedModules]);

  // Real-time dashboard stat updates
  const { connected: liveConnected, socket } = useSocket("/dashboards", {
    "stats:update": (evt) => {
      if (!evt || (orgId && evt.organizationId && evt.organizationId !== orgId)) return;
      setData((prev) => ({ ...(prev || {}), statCards: { ...(prev?.statCards || {}), ...(evt.statCards || {}) } }));
    },
    "booking:new": (evt) => {
      toast.success(t(`New booking ${evt.publicId || ""} · ${formatCurrency(evt.amount || 0)}`));
      setReloadKey(k => k + 1);
    },
    "donation:new": (evt) => {
      toast.success(t(`Donation received: ${formatCurrency(evt.amount || 0)} by ${evt.donorName || "Donor"}`));
      setReloadKey(k => k + 1);
    },
  }, { enabled: Boolean(orgId), query: { organizationId: orgId } });

  useEffect(() => {
    if (liveConnected && socket) {
      if (isSuperAdmin) {
        socket.emit("subscribe:platform");
      }
      if (orgId) {
        socket.emit("subscribe:org", orgId);
      }
    }
  }, [liveConnected, socket, orgId, isSuperAdmin]);

  const stats = data?.statCards || {};

  // Mappers and fallbacks
  const activeMonks = routesList
    .filter(r => r.stops && r.stops.some(s => s.templeId === orgId))
    .slice(0, 5)
    .map(r => {
      const stop = r.stops.find(s => s.templeId === orgId);
      const dateTime = stop?.dateTime ? new Date(stop.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "TBD";
      
      let routeMonks = [];
      if (r.monkGroupId && r.participantMonkIds) {
        routeMonks = r.participantMonkIds.map(id => monksList.find(m => m.id === id)).filter(Boolean);
      } else if (r.monkId) {
        const monk = monksList.find(m => m.id === r.monkId);
        if (monk) routeMonks = [monk];
      }

      return {
        id: r.id,
        name: r.name,
        eta: dateTime,
        status: stop?.status || "PENDING",
        monks: routeMonks.map(m => ({ id: m.id, name: m.dikshaName || "Maharaj Saheb" }))
      };
    });

  const activeYatras = toursList.length > 0
    ? toursList.slice(0, 5).map(t => {
      const total = t.jatraTarget || 99;
      return {
        name: t.name,
        participants: t.participantsCount || 0,
        completed: `${t.completedCount || 0} / ${total}`,
        progress: Math.min(Math.round(((t.completedCount || 0) / total) * 100), 100)
      };
    })
    : [];

  const activeEvents = (Array.isArray(eventsList) ? eventsList : [])
    .filter(ev => ev.organizationId === orgId || ev.templeId === orgId || ev.orgId === orgId)
    .slice(0, 3)
    .map(ev => {
      const date = new Date(ev.startAt);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        day: date.getDate() || 1,
        month: months[date.getMonth()] || "May",
        title: ev.title,
        time: ev.timeDetails || "09:00 AM - 12:00 PM",
        tone: ev.isPaid ? "purple" : "green"
      };
    });

  const activeVolunteers = (Array.isArray(volunteersList) ? volunteersList : [])
    .filter(v => v.organizationId === orgId || v.templeId === orgId || v.orgId === orgId)
    .slice(0, 5)
    .map(v => ({
      name: v.member?.fullName || v.name || "Jain Volunteer",
      duty: v.assignedDuty || "Seva Duty",
      time: v.shiftHours || "08:00 AM - 04:00 PM"
    }));

  const recentDonorsList = donationsList.length > 0
    ? donationsList.slice(0, 4).map(d => ({
      name: d.donorName || "Anonymous",
              amount: d.totalAmount,
      time: d.createdAt ? new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just Now"
    }))
    : [];

  // Announcements: Filter by orgId if available
  const filteredAnnouncements = announcementsList.filter(a => 
    !a.organizationId && !a.templeId && !a.orgId // if it's a global announcement (optional fallback)
    || a.organizationId === orgId 
    || a.templeId === orgId 
    || a.orgId === orgId
  );

  const activeAnnouncements = filteredAnnouncements.length > 0
    ? filteredAnnouncements.slice(0, 3).map(a => ({
      title: a.title,
      desc: a.content || a.description,
      when: new Date(a.createdAt || a.date).toLocaleDateString(),
      tone: a.isImportant ? "red" : "purple",
      icon: a.isImportant ? AlertTriangle : Bell
    }))
    : [];

  const getDonationsTrend = () => {
    if (donationsList.length === 0) return [];
    return donationsList.slice(-5).map((d, i) => ({
      t: d.createdAt ? new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit' }) : `${i * 4} hrs`,
      v: d.totalAmount
    }));
  };

  const AREAS  = ["Palitana", "Girnar", "Shatrunjaya", "Pawapuri", "Rajgir"];
  const CITIES = ["Ahmedabad", "Mumbai", "Surat", "Rajkot", "Vadodara", "Pune", "Delhi"];
  const STATES = ["Gujarat", "Maharashtra", "Rajasthan", "Karnataka", "Tamil Nadu", "Uttar Pradesh"];

  const filteredOrgs = orgs.filter((o) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = o.name?.toLowerCase().includes(q);
      const matchesId = o.publicId?.toLowerCase().includes(q);
      if (!matchesName && !matchesId) return false;
    }
    if (selectedCity !== "ALL" && o.city !== selectedCity) return false;
    if (selectedState !== "ALL" && o.state !== selectedState) return false;
    return true;
  });

  const getSelectPlaceholder = () => {
    switch (selectedType) {
      case "DHARAMSHALA": return t("Select Dharamshala");
      case "JAIN_CENTER": return t("Select Jain Center");
      case "STHANAK": return t("Select Sthanak");
      case "COMMUNITY_PAGE": return t("Select Community Page");
      case "BHOJANSHALA": return t("Select Bhojanshala");
      default: return t("Select Temple");
    }
  };
  const dynamicPlaceholder = getSelectPlaceholder();

  return (
    <div data-testid="dashboard-page">
      {/* Single inline filter bar — SA only */}
      {isSuperAdmin && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Search with results dropdown */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              placeholder={t("Search temple…")}
              className="w-full pl-9 pr-3 h-10 text-xs rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-slate-400"
            />
            {showSearchResults && searchQuery.trim() && filteredOrgs.length > 0 && (
              <div className="absolute top-11 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto p-1 space-y-0.5">
                {filteredOrgs.map((o) => (
                  <button
                    key={o.id}
                    onMouseDown={() => {
                      setOrgId(o.id);
                      setOrgName(o.name);
                      setSearchQuery(o.name);
                      setShowSearchResults(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-md font-medium text-slate-700 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold">T</span>
                    <span className="flex-1 min-w-0">
                      <span className="font-bold block truncate">{o.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {o.publicId && <span className="font-mono text-orange-500 mr-1">{o.publicId}</span>}
                        {[o.area, o.city, o.state].filter(Boolean).join(", ")}
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
          <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setSelectedCity("ALL"); setSelectedState("ALL"); setSelectedArea("ALL"); }}>
            <SelectTrigger className="w-36 h-10 text-xs font-semibold bg-white border border-border">
              <SelectValue placeholder={t("Select Type")} />
            </SelectTrigger>
            <SelectContent>
              {ORG_TYPES.filter((x) => x.key !== "ADMIN").map((tItem) => (
                <SelectItem key={tItem.key} value={tItem.key} className="text-xs font-medium">{t(tItem.label)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Temple / Org Name */}
          <Select
            value={orgId || "__none__"}
            onValueChange={(val) => {
              if (val === "__none__") return;
              setOrgId(val);
              const found = filteredOrgs.find((o) => o.id === val);
              if (found) setOrgName(found.name);
            }}
            disabled={filteredOrgs.length === 0}
          >
            <SelectTrigger className="w-52 h-10 text-xs font-semibold bg-white border border-border">
              <SelectValue placeholder={orgName || dynamicPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs font-medium text-slate-400">{dynamicPlaceholder}</SelectItem>
              {filteredOrgs.map((o) => (
                <SelectItem key={o.id} value={o.id} className="text-xs font-medium">{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <>
          {/* Temple header banner */}
          <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md shrink-0">
                <Landmark className="h-6 w-6 md:h-7 md:w-7 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight truncate">
                  {orgName}
                </h1>
                <div className="text-xs text-primary mt-1 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> {t("Jai Jinendra")}
                  {liveConnected ? (
                    <LiveBadge connected={liveConnected} label={t("Live")} />
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full border">{t("Reconnecting")}</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* A scoped admin with no organisation mapped can't manage anything —
              say so instead of rendering an empty dashboard. */}
          {hasNoOrgScope && (
            <Card className="p-4 mb-4 md:mb-6 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3">
              <Landmark className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <div className="font-bold">{t("No organisation assigned to your account")}</div>
                <div className="mt-0.5">
                  {t("Ask your Super Admin to map you to a temple, Jain centre or dharamshala. Until then you can view your tabs but not manage any records.")}
                </div>
              </div>
            </Card>
          )}

          {/* Metric stats row — each tile follows its module */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 md:mb-6">
            {shows("VISITORS") && (
              <StatCard label={t("dashboard.todaysVisitors", "Today's Visitors")} value={(stats.todaysVisitors ?? 0).toLocaleString()} delta={t("Devotees checked-in")} icon={Users} tone="green" testId="stat-visitors" />
            )}
            {shows("DHARAMSHALAS") && !isTemple && !isJainCenter && !isSthanak && (
              <StatCard label={t("dashboard.bhojanshalaMeals", "Bhojanshala Meals")} value={(stats.bhojanshalaMeals ?? 0).toLocaleString()} delta={t("Meals served today")} icon={UtensilsCrossed} tone="orange" testId="stat-meals" />
            )}
            {shows("VISITORS") && isBhojanshala && (
              <StatCard label={t("dashboard.passesIssued", "Passes Issued")} value={(stats.passesIssued || stats.bhojanshalaMeals || 0).toLocaleString()} delta={t("Passes today")} icon={ClipboardList} tone="blue" testId="stat-passes" />
            )}
            {shows("VOLUNTEERS") && !isBhojanshala && (
              <StatCard label={t("dashboard.activeVolunteers", "Active Volunteers")} value={(stats.activeVolunteers ?? 0).toLocaleString()} delta={t("On-duty volunteers")} icon={HandHeart} tone="blue" testId="stat-volunteers" />
            )}
            {shows("BOOKINGS") && !isTemple && !isBhojanshala && !isJainCenter && !isSthanak && (
              <StatCard label={t("dashboard.roomOccupancy", "Room Occupancy")} value={`${stats.occupiedRooms ?? 0}`} delta={t("Occupied / 200 Rooms")} icon={BedDouble} tone="purple" testId="stat-rooms" />
            )}
          </div>

          {/* Dashboard Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-start">
            {(shows("TRACKING") || shows("MONKS")) && !isBhojanshala && !isJainCenter && (
            <SectionCard number="1" title={t("dashboard.monkArrivalTracking", "Monk Arrival & Tracking")} viewAll viewAllTo={orgId ? `/admin/tracking?orgId=${orgId}` : "/admin/tracking"} testId="section-monks">
              <div className="space-y-3">
                {activeMonks.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted-foreground font-medium">
                    {t("dashboard.noMonkData", "No active monk tracking data available.")}
                  </div>
                ) : (
                  activeMonks.map((route, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border border-border hover:bg-secondary/40 transition-colors">
                      <div className="flex items-center justify-between">
                         <div className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                           <RouteIcon className="h-4 w-4 text-orange-500 shrink-0" />
                           <span className="truncate">{route.name}</span>
                         </div>
                         <div className="text-[10px] text-muted-foreground text-right flex flex-col items-end shrink-0 ml-2">
                            <span>{route.eta}</span>
                            <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full mt-1 ${STATUS_BADGES[route.status] || "bg-slate-100"}`}>
                               {route.status}
                            </span>
                         </div>
                      </div>
                      {route.monks.length > 0 ? (
                        <div className="text-xs text-muted-foreground mt-1 bg-white p-2 rounded border border-slate-100">
                          <span className="font-semibold text-slate-700 mr-2">{t("Monks:")}</span>
                          {route.monks.map((m, i) => (
                            <span key={m.id}>
                              <a href={`/admin/monks/${m.id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                                {m.name}
                              </a>
                              {i < route.monks.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-1 bg-white p-2 rounded border border-slate-100">
                          {t("No monks linked to this route.")}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
            )}

            {(shows("BOOKINGS")) && !isTemple && !isBhojanshala && !isJainCenter && !isSthanak && (
            <SectionCard number="2" title={t("dashboard.roomStatusInventory", "Room Status & Inventory")} viewAll viewAllTo={orgId ? `/admin/bookings?orgId=${orgId}` : "/admin/bookings"} testId="section-rooms">
              {(() => {
                const roomStats = stats.roomStats || { available: 0, occupied: 0, cleaning: 0, total: 0, floors: [] };
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg border border-border p-3 text-center">
                        <BedDouble className="h-5 w-5 mx-auto text-primary mb-1" />
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("dashboard.available", "Available")}</div>
                        <div className="font-heading font-bold text-xl text-foreground mt-0.5">{roomStats.available}</div>
                        <div className="text-[10px] text-muted-foreground">{roomStats.total > 0 ? Math.round((roomStats.available / roomStats.total) * 100) : 0}%</div>
                      </div>
                      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-center">
                        <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                        <div className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold">{t("dashboard.occupied", "Occupied")}</div>
                        <div className="font-heading font-bold text-xl text-blue-800 mt-1">{roomStats.occupied}</div>
                        <div className="text-[10px] text-blue-600">{roomStats.total > 0 ? Math.round((roomStats.occupied / roomStats.total) * 100) : 0}%</div>
                      </div>
                      <div className="rounded-lg border border-orange-100 bg-orange-50 p-3 text-center">
                        <Sparkles className="h-5 w-5 mx-auto text-orange-600 mb-1" />
                        <div className="text-[10px] uppercase tracking-wider text-orange-700 font-semibold">{t("dashboard.cleaning", "Cleaning")}</div>
                        <div className="font-heading font-bold text-xl text-orange-800 mt-1">{roomStats.cleaning}</div>
                        <div className="text-[10px] text-orange-600">{roomStats.total > 0 ? Math.round((roomStats.cleaning / roomStats.total) * 100) : 0}%</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {roomStats.floors.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          {t("dashboard.noRooms", "No rooms registered for this organization.")}
                        </div>
                      ) : (
                        roomStats.floors.map((f) => (
                          <div key={f.name} className="grid grid-cols-6 items-center text-xs gap-2">
                            <div className="col-span-2 text-foreground">{f.name}</div>
                            <div className="col-span-2">
                              <Progress value={f.total > 0 ? (f.occupied / f.total) * 100 : 0} className="h-1.5" />
                            </div>
                            <div className="col-span-1 text-right font-mono-num text-muted-foreground">{f.occupied} / {f.total}</div>
                            <div className="col-span-1 text-right text-orange-600 font-medium">{f.cleaning}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </SectionCard>
            )}

            {(shows("TOURS")) && !isTemple && !isBhojanshala && !isJainCenter && !isSthanak && (
            <SectionCard number="3" title={t("dashboard.yatraGroupManagement", "99 Yatra Group Management")} viewAll viewAllTo={orgId ? `/admin/tours?orgId=${orgId}` : "/admin/tours"} testId="section-yatra">
              {activeYatras.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground font-medium">
                  {t("dashboard.noYatra", "No active Yatra groups registered.")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[380px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="text-left font-semibold py-2">{t("col.name", "Sangh / Group")}</th>
                        <th className="text-center font-semibold">{t("nav.members", "People")}</th>
                        <th className="text-center font-semibold">{t("status.completed", "Done")}</th>
                        <th className="text-right font-semibold">{t("Progress")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeYatras.map((y, i) => (
                        <tr key={i} className="border-b border-border/60 last:border-0">
                          <td className="py-2.5 pr-2 truncate max-w-[140px] font-semibold text-slate-800">{y.name}</td>
                          <td className="text-center font-mono-num text-xs">{y.participants}</td>
                          <td className="text-center text-xs">{y.completed}</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-mono-num text-xs font-semibold text-slate-700">{y.progress}%</span>
                              <div className="w-12 hidden sm:block">
                                <Progress value={y.progress} className="h-1.5" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
            )}

            {(shows("DHARAMSHALAS")) && !isTemple && !isJainCenter && !isSthanak && (
            <SectionCard number="4" title={t("dashboard.bhojanshalaManagement", "Bhojanshala Management")} testId="section-bhojanshala">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { labelKey: "dashboard.breakfastCount", label: t("Navkarsi Count"), value: stats.navkarsiCount || 0, time: "07:00 AM - 08:30 AM", icon: Coffee, tone: "green" },
                  { labelKey: "dashboard.lunchCount", label: t("Lunch Count"), value: stats.lunchCount || 0, time: "11:30 AM - 01:30 PM", icon: UtensilsCrossed, tone: "orange" },
                  { labelKey: "dashboard.dinnerCount", label: t("Choviyar Count"), value: stats.choviyarCount || 0, time: "07:00 PM - 08:30 PM", icon: Moon, tone: "purple" },
                  { labelKey: "dashboard.passesIssued", label: t("Passes Issued"), value: stats.passesIssued || 0, time: t("Today"), icon: ClipboardList, tone: "blue" },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border border-border p-3">
                    <div className={`icon-chip ${c.tone} h-9 w-9 mb-2`}>
                      <c.icon className="h-4 w-4" />
                    </div>
                    <div className="text-[11px] text-muted-foreground font-semibold">{t(c.labelKey, c.label)}</div>
                    <div className="font-heading font-bold text-2xl mt-0.5 font-mono-num">{c.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{c.time}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
            )}

            {(shows("EVENTS")) && !isBhojanshala && (
            <SectionCard number="5" title={t("dashboard.eventManagement", "Event Management")} viewAll viewAllTo={orgId ? `/admin/events?orgId=${orgId}` : "/admin/events"} testId="section-events">
              <div className="space-y-3">
                {activeEvents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    {t("dashboard.noEvents", "No upcoming events scheduled.")}
                  </div>
                ) : (
                  activeEvents.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                      <div className={`icon-chip ${e.tone} h-12 w-12 flex-col text-center`}>
                        <div className="text-lg font-bold font-heading leading-none">{e.day}</div>
                        <div className="text-[9px] uppercase font-semibold mt-0.5">{e.month}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{e.title}</div>
                        <div className="text-[11px] text-muted-foreground">{e.time}</div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700 shrink-0">
                        {t("Upcoming")}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => navigate(orgId ? `/admin/events?orgId=${orgId}` : "/admin/events")} data-testid="events-create-btn">
                  <PlusCircle className="h-4 w-4 mr-1.5" /> {t("action.add", "Create Event")}
                </Button>
                <Button size="sm" variant="outline" className="flex-1 font-bold" onClick={() => setShowReminderDialog(true)} data-testid="send-reminder-btn">
                  <Send className="h-4 w-4 mr-1.5" /> {t("dashboard.sendReminder", "Send Reminder")}
                </Button>
              </div>
            </SectionCard>
            )}

            {(shows("VOLUNTEERS")) && !isBhojanshala && (
            <SectionCard number="6" title={t("dashboard.volunteerAssignment", "Volunteer Assignment")} viewAll viewAllTo={orgId ? `/admin/volunteers?orgId=${orgId}` : "/admin/volunteers"} testId="section-volunteers">
              {activeVolunteers.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground font-sans">
                  {t("dashboard.noVolunteers", "No volunteers assigned today.")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[320px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="text-left font-semibold py-2">{t("volunteers.volunteerRole", "Volunteer")}</th>
                        <th className="text-left font-semibold">{t("field.role", "Duty")}</th>
                        <th className="text-right font-semibold">{t("field.status", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVolunteers.map((v, i) => (
                        <tr key={i} className="border-b border-border/60 last:border-0">
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                  {initials(v.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium truncate">{v.name}</span>
                            </div>
                          </td>
                          <td className="text-xs text-muted-foreground truncate max-w-[100px]">{v.duty}</td>
                          <td className="text-right font-mono-num text-[10px] text-muted-foreground">{v.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
            )}



            {(shows("ANNOUNCEMENTS") || shows("NEWS")) && (
            <SectionCard number="8" title={t("dashboard.announcements", "Announcements")} viewAll viewAllTo={orgId ? `/admin/announcements?orgId=${orgId}` : "/admin/announcements"} testId="section-announcements">
              <div className="space-y-3">
                {activeAnnouncements.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    {t("dashboard.noAnnouncements", "No active announcements found.")}
                  </div>
                ) : (
                  activeAnnouncements.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`icon-chip ${a.tone} h-10 w-10 shrink-0`}>
                        <a.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">{a.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.desc}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{a.when}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
            )}

            {quickActions.length > 0 && (
            <SectionCard number="9" title={t("dashboard.quickActions", "Quick Actions")} testId="section-quick-actions">
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => navigate(orgId ? `${q.to}?orgId=${orgId}` : q.to)}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/40 transition-all text-center"
                    data-testid={`quick-${q.label.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div className={`icon-chip ${q.tone} h-10 w-10`}>
                      <q.icon className="h-4 w-4" />
                    </div>
                    <div className="text-[11px] font-medium text-foreground leading-tight">{t(q.labelKey, q.label)}</div>
                  </button>
                ))}
              </div>
            </SectionCard>
            )}
          </div>
      </>

      {/* Send Reminder Dialog */}
      <SendReminderDialog open={showReminderDialog} onClose={() => setShowReminderDialog(false)} />
    </div>
  );
}
