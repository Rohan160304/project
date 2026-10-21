import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star, MapPin, Navigation, Calendar, Users, Clock, ArrowLeft,
  Share2, Bookmark, Heart, ShieldCheck, CheckCircle, MessageSquare, Phone,
  Sparkles, AlertCircle, FileText, Check, AlertTriangle, Compass, CheckCircle2,
  Globe, Info, Video, ArrowRight, ShieldAlert, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import ListState from "@/components/member/ListState";
import { useMemberItem, compactNumber } from "@/hooks/useMemberList";
import { useVisibilityEngine } from "@/contexts/VisibilityEngineContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { API_BASE } from "@/lib/api";
import { memberClient as api } from "@/lib/memberClient";
function ini(name) {
  return (name || "").trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "MS";
}

export default function MemberMSDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isEntityFollowed, toggleFollow } = useVisibilityEngine();
  const [optimisticCount, setOptimisticCount] = useState(null);
  
  const [reportOpen, setReportOpen] = useState(false);
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSaving, setTicketSaving] = useState(false);

  const [chaturmasData, setChaturmasData] = useState([]);

  const { item: msRaw, loading, error } = useMemberItem(id ? `/monks/${id}` : null, {
    map: (m) => ({
      ...m,
      name: m.dikshaName || m.shortName || m.nameBeforeDiksha || m.fullName || m.name,
      image: m.photoUrl || null,
      status: m.tracking?.status || m.status || "ACTIVE",
      location: m.tracking?.currentLocation || m.currentTemple?.city || "",
      currentPlace: m.currentTemple?.name || m.tracking?.currentLocation || "",
      // sect comes from community.name, subSect from subCommunity.name, gacchaName from gaccha.name
      sect: [m.community?.name || m.sect, m.subCommunity?.name || m.subSect].filter(Boolean).join(" · "),
      gacchaName: m.gaccha?.name || m.gacchaName || "",
      guru: m.dikshaGuru?.dikshaName || m.dikshaGuru?.shortName || "",
      followers: compactNumber(m._count?.follows ?? m.followerCount ?? 0),
      vihaarGroupId: m.group?.publicId || m.currentSangh?.publicId || "",
      groupLeader: m.group?.leader?.dikshaName || m.currentSangh?.name || "",
      groupMembersCount: m.group?._count?.members ?? m.group?.members?.length ?? 0,
      upcomingVihaar: m.tracking?.nextStop || (m.timeline && m.timeline[0]?.title) || "",
      pravachan: m.routine?.pravachan || "",
      contactRepresentative: {
        jainPerson: m.sanghContacts?.jainContacts?.[0]?.name || m.sanghContacts?.[0]?.name || "",
        phone: m.sanghContacts?.jainContacts?.[0]?.mobile || m.sanghContacts?.[0]?.mobile || "",
      },
      chaturmasHistory: m.chaturmasHistory || [],
    }),
  });


  useEffect(() => {
    if (msRaw?.id) {
      api.get(`/chaturmas/monk/${msRaw.id}`)
        .then((res) => {
          setChaturmasData(res.data?.data || []);
        })
        .catch(() => {});
    }
  }, [msRaw?.id]);

  const monk = msRaw ? { 
    ...msRaw, 
    chaturmasHistory: chaturmasData.length > 0 ? chaturmasData : (msRaw.chaturmasHistory || [])
  } : {};
  const following = isEntityFollowed(monk?.publicId);
  const displayCount = optimisticCount ?? (monk?._count?.follows ?? monk?.followerCount ?? 0);

  const handleFollow = async () => {
    if (!monk.publicId) return;
    const wasFollowed = following;
    setOptimisticCount(Math.max(0, displayCount + (wasFollowed ? -1 : 1)));
    await toggleFollow(monk.publicId, { type: "monk", apiId: monk.id, name: monk.name, image: monk.image, category: "monk" });
  };

  const onShare = () => {
    if (navigator.share) {
      navigator.share({ title: monk?.name, text: `MS ID: ${monk?.publicId} - Location: ${monk?.location}`, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${monk?.name} (${monk?.publicId})`);
      toast.success(t("MS link copied to clipboard"));
    }
  };

  const handleCreateSupportTicket = async () => {
    if (!ticketDescription.trim()) {
      toast.error(t("Please enter the details of the incorrect information."));
      return;
    }
    setTicketSaving(true);
    try {
      await api.post("/support-tickets", {
        type: "INCORRECT_INFO",
        subject: `Incorrect Information Report for Monk ${monk?.dikshaName || monk?.name} (${monk?.publicId})`,
        description: ticketDescription,
        relatedEntityType: "MONK",
        relatedEntityId: monk?.id,
      });
      toast.success(t("Support Ticket created. Thank you for keeping the directory accurate!"));
      setReportOpen(false);
      setTicketDescription("");
    } catch (e) {
      toast.error(t("Failed to submit support ticket."));
    } finally {
      setTicketSaving(false);
    }
  };

  if (loading || error || !msRaw) {
    return (
      <div className="space-y-8">
        <ListState
          loading={loading}
          error={error}
          count={msRaw ? 1 : 0}
          emptyTitle="Maharaj Saheb not found"
          emptyHint="This profile may have been removed, or the link is out of date."
        >
          {null}
        </ListState>
      </div>
    );
  }

  return (
<div className="pb-16 max-w-7xl mx-auto space-y-6">
      
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
        <Button variant="ghost" onClick={() => navigate("/monks")} className="text-slate-600">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("Back to Maharaj Saheb List")}
        </Button>
        <div className="flex items-center gap-2">
          
          
        </div>
      </div>

      {/* Header Profile Banner Card */}
      <Card className="overflow-hidden border-purple-100 bg-white relative shadow-md rounded-2xl">
        <div className="h-40 w-full bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-300 via-purple-900 to-indigo-950" />
        </div>
        
        <div className="px-6 pb-6 relative flex flex-col md:flex-row gap-6 items-start md:-mt-12">
          <div className="relative shrink-0">
            <Avatar className="h-32 w-32 rounded-full border-4 border-white shadow-xl bg-purple-950 overflow-hidden">
              {monk.photoUrl ? (
                <img src={`${API_BASE}${monk.photoUrl}`} alt={monk.dikshaName} className="object-cover w-full h-full" />
              ) : (
                <AvatarFallback className="text-3xl font-black text-white bg-purple-900">
                  {ini(monk.dikshaName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute bottom-1 right-1 bg-yellow-400 text-slate-900 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-xs shadow">🪷</div>
          </div>

          <div className="flex-1 space-y-2 mt-2 md:mt-14">
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-2xl font-bold font-heading text-slate-800">{monk.dikshaName}</h1>
              {monk.verified && <Badge className="bg-emerald-500 text-white border-0"><Check className="h-3 w-3 mr-1" /> {t("Verified Profile")}</Badge>}
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">{monk.gender === "SADHVI" ? t("🌸 Sadhvi") : t("🧘 Sadhu")}</Badge>
              <Badge className="bg-slate-100 text-slate-600 border-slate-200">{monk.status}</Badge>
            </div>

            <div className="text-sm font-semibold text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              {monk.shortName && <span>{t("🌟 Popular:")} {monk.shortName}</span>}
              <span>{t("🔢 ID:")} <strong>{monk.publicId}</strong></span>
              <span>{t("🪷 Sect:")} {monk.sect || "Shwetambar"}</span>
              {/* Gaccha hidden */}
            </div>

            <div className="flex items-center gap-4 flex-wrap pt-2">
              <Button onClick={handleFollow} variant={following ? "outline" : "default"}
                className={following ? "border-purple-300 text-purple-700" : "bg-purple-700 hover:bg-purple-800 text-white font-bold"}>
                <Heart className={`h-4 w-4 mr-2 ${following ? "fill-purple-600 text-purple-600" : ""}`} />
                {following ? t("Following") : t("Follow MS")}
              </Button>
              <Button variant="ghost" onClick={() => setReportOpen(true)} className="text-amber-600 hover:text-amber-800">
                <AlertTriangle className="h-4 w-4 mr-2" /> {t("Report Incorrect Information")}
              </Button>
            </div>
          </div>

          <div className="md:mt-14 shrink-0 flex gap-4 text-center text-xs bg-purple-50/60 p-4 border border-purple-100 rounded-2xl">
            <div>
              <div className="text-lg font-bold text-purple-950">{monk._count?.follows || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{t("Followers")}</div>
            </div>
            <div className="border-l border-purple-200 pl-4">
              <div className="text-lg font-bold text-purple-950">{monk.chaturmasHistory?.length || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{t("Chaturmas")}</div>
            </div>
            <div className="border-l border-purple-200 pl-4">
              <div className="text-lg font-bold text-purple-950">{monk.tapasya?.length || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{t("Tapasyas")}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column info cards */}
        <div className="space-y-6">
          
          <Card className="p-6 rounded-2xl border-purple-100 shadow-sm bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">{t("🪷 Biography & Summary")}</h3>
            <p className="text-xs text-slate-600 italic leading-relaxed">
              "{monk.bio || "No summary biography defined yet."}"
            </p>
            {monk.recognitions?.titlesHonors?.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t">
                <span className="text-[10px] uppercase font-black text-slate-400">{t("Honors & Titles")}</span>
                <div className="flex flex-wrap gap-1">
                  {monk.recognitions.titlesHonors.map((t) => (
                    <Badge key={t} className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {monk.recognitions?.tags?.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] uppercase font-black text-slate-400">{t("Spiritual Tags")}</span>
                <div className="flex flex-wrap gap-1">
                  {monk.recognitions.tags.map((tag) => (
                    <Badge key={tag} className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-semibold">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 rounded-2xl border-purple-100 shadow-sm bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">{t("📍 Live Tracking")}</h3>
            <div className="space-y-3">

              {/* ── CHATURMAS MODE ── */}
              {monk.activeChaturmas ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{t("Active Status")}</span>
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                      🏕️ {t("Chaturmas")}
                    </Badge>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
                    <span className="text-[10px] uppercase font-black text-amber-600">{t("Chaturmas Location")}</span>
                    <p className="text-sm font-bold text-amber-900">
                      {monk.activeChaturmas.orgName || "—"}
                    </p>
                    {(monk.activeChaturmas.city || monk.activeChaturmas.state) && (
                      <p className="text-xs text-amber-700 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[monk.activeChaturmas.city, monk.activeChaturmas.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <p className="text-[10px] text-amber-600 mt-1">
                      {monk.activeChaturmas.startDate ? new Date(monk.activeChaturmas.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      {monk.activeChaturmas.endDate ? ` – ${new Date(monk.activeChaturmas.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </p>
                  </div>
                </>
              ) : monk.activeJourney ? (
                /* ── MOVING / ACTIVE ROUTE MODE ── */
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{t("Active Status")}</span>
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-200 font-bold animate-pulse">
                      🚶 {t("Moving")}
                    </Badge>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] uppercase font-black text-blue-600">{t("Current Vihar Route")}</span>
                    <p className="text-sm font-bold text-blue-900">{monk.activeJourney.routeName}</p>
                    {/* Show stops: highlight current */}
                    {Array.isArray(monk.activeJourney.stops) && monk.activeJourney.stops.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {monk.activeJourney.stops.map((stop, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              i === monk.activeJourney.currentStopIndex
                                ? "bg-blue-700 text-white border-blue-700"
                                : i < monk.activeJourney.currentStopIndex
                                  ? "bg-blue-100 text-blue-500 border-blue-200 line-through"
                                  : "bg-white text-slate-500 border-slate-200"
                            }`}>
                              {stop.templeName}
                            </span>
                            {i < monk.activeJourney.stops.length - 1 && (
                              <ArrowRight className="h-2.5 w-2.5 text-blue-300" />
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {monk.activeJourney.journeyDate && (
                      <p className="text-[10px] text-blue-500">
                        {t("Started:")} {new Date(monk.activeJourney.journeyDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  {/* Also show current temple if available */}
                  {monk.currentTemple && (
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400">{t("Last Known Temple")}</span>
                      <span className="text-xs font-bold text-purple-700 block mt-0.5">{monk.currentTemple.name} ({monk.currentTemple.city})</span>
                    </div>
                  )}
                </>
              ) : (
                /* ── STAYING MODE ── */
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{t("Active Status")}</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                      🏠 {t("Staying")}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400">{t("Current Location")}</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {monk.tracking?.currentLocation || (monk.currentTemple ? `${monk.currentTemple.name}, ${monk.currentTemple.city}` : "Not Configured")}
                    </span>
                  </div>

                  {monk.currentTemple && (
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400">{t("Staying Organization / Temple")}</span>
                      <span className="text-xs font-bold text-purple-700 block mt-0.5">{monk.currentTemple.name} ({monk.currentTemple.city})</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>


        </div>

        {/* Right column detailed tabs card */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-purple-100 bg-white shadow-sm overflow-hidden min-h-[500px]">
            <Tabs defaultValue="journey" className="w-full">
              <TabsList className="bg-slate-50 p-2 w-full justify-start overflow-x-auto h-auto rounded-none border-b flex gap-1">
                <TabsTrigger value="journey" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-purple-700 data-[state=active]:text-white">{t("🧘 Spiritual Journey")}</TabsTrigger>
                <TabsTrigger value="vihaar" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-purple-700 data-[state=active]:text-white">{t("🚶 Movement & Group")}</TabsTrigger>
                <TabsTrigger value="tapasya" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-purple-700 data-[state=active]:text-white">{t("🪷 Tapasya")}</TabsTrigger>
                <TabsTrigger value="family" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-purple-700 data-[state=active]:text-white">{t("🏠 Pre-Diksha Family")}</TabsTrigger>
                <TabsTrigger value="routine" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-purple-700 data-[state=active]:text-white">{t("🕒 Daily Routine")}</TabsTrigger>
                <TabsTrigger value="contacts" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-purple-700 data-[state=active]:text-white">{t("📞 Contacts & Links")}</TabsTrigger>
              </TabsList>

              {/* TABS CONTENT */}

              {/* 1. Journey Tab */}
              <TabsContent value="journey" className="p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("🧘 Diksha Details")}</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500">{t("Diksha Date:")}</span><strong className="text-slate-800">{monk.dikshaDate ? new Date(monk.dikshaDate).toLocaleDateString() : "—"}</strong></div>
                      <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500">{t("Diksha Place:")}</span><strong className="text-slate-800">{monk.dikshaPlace || "—"}</strong></div>
                      <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500">{t("Diksha Guru:")}</span><strong className="text-purple-700">{monk.dikshaGuru?.dikshaName || "—"}</strong></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("🪷 Sect Details")}</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500">{t("Community:")}</span><strong className="text-slate-800">{monk.sect || "Shwetambar"}</strong></div>
                      <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500">{t("Sub-Sect / Tradition:")}</span><strong className="text-slate-800">{monk.subSect || "—"}</strong></div>
                      {/* Gaccha row hidden */}
                    </div>
                  </div>
                </div>

                {/* Guru Parampara visual tree */}
                <div className="border border-purple-100 bg-purple-50/30 p-5 rounded-2xl space-y-4 mt-4">
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-purple-600" /> {t("Guru Parampara (Lineage Tree)")}
                  </h4>
                  
                  <div className="flex flex-col items-center gap-2 text-center text-xs">
                    {/* Ancestor Guru */}
                    {monk.dikshaGuru && (
                      <div className="bg-purple-100 text-purple-900 font-semibold p-3.5 border border-purple-200 rounded-xl w-60 shadow-sm">
                        <span className="text-[9px] text-purple-600 uppercase font-black tracking-widest block">{t("Acharya Guru")}</span>
                        <span className="text-xs mt-0.5 block">{monk.dikshaGuru.dikshaName}</span>
                        <span className="text-[9px] font-mono block opacity-60 mt-0.5">{monk.dikshaGuru.publicId}</span>
                      </div>
                    )}
                    
                    {monk.dikshaGuru && <div className="w-0.5 h-6 bg-purple-200" />}

                    {/* Current Monk */}
                    <div className="bg-purple-700 text-white font-bold p-4 rounded-xl w-64 shadow-md">
                      <span className="text-[9px] text-purple-200 uppercase font-black tracking-widest block">{t("Current MS Profile")}</span>
                      <span className="text-sm mt-0.5 block">{monk.dikshaName}</span>
                      <span className="text-[9px] font-mono block opacity-70 mt-0.5">{monk.publicId}</span>
                    </div>

                    {monk.discipleOf?.length > 0 && <div className="w-0.5 h-6 bg-purple-200" />}

                    {/* Disciples */}
                    {monk.discipleOf?.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                        {monk.discipleOf.map((disciple) => (
                          <div key={disciple.id} className="bg-white text-slate-800 font-semibold p-3 border rounded-xl shadow-sm text-center">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">{t("Dikshit Disciple")}</span>
                            <span className="text-xs mt-0.5 block truncate">{disciple.dikshaName}</span>
                            <span className="text-[9px] font-mono block text-slate-500 opacity-60">{disciple.publicId}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Biography Detailed Text */}
                {monk.media?.lifeStory && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("📖 Detailed Spiritual Biography")}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 border rounded-xl">
                      {monk.media.lifeStory}
                    </p>
                  </div>
                )}

              </TabsContent>

              {/* 2. Movement & Group Tab */}
              <TabsContent value="vihaar" className="p-6 space-y-6">
                
                {/* Vihaar Group */}
                {monk.group && (
                  <div className="border border-purple-100 bg-purple-50/20 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800">{t("👥 Group:")} {monk.group.name}</span>
                        <span className="text-[9px] font-mono text-purple-600 block">{t("🔢 Number:")} {monk.group.groupNumber || "JFMSV108"}</span>
                      </div>
                      <Badge className="bg-purple-700 text-white font-bold">{monk.group.members?.length || 0} {t("Members")}</Badge>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] uppercase font-black text-slate-400">{t("Linked MS Profiles in Group")}</span>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {(monk.group.members || []).map((m) => (
                          <div key={m.id} className="flex items-center gap-2 p-2 border rounded-xl bg-white cursor-pointer hover:bg-slate-50"
                            onClick={() => navigate(`/monks/${m.id}`)}>
                            <Avatar className="h-7 w-7 bg-purple-900 text-white text-[10px] font-bold flex items-center justify-center">
                              {ini(m.dikshaName)}
                            </Avatar>
                            <span className="font-semibold text-slate-700 truncate">{m.dikshaName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {monk.group.jainMembers?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <span className="text-[10px] uppercase font-black text-slate-400">{t("Jain lay-devotees in Group")}</span>
                        <div className="flex flex-wrap gap-1">
                          {monk.group.jainMembers.map((jm, i) => (
                            <Badge key={i} className="bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200">
                              {jm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {monk.group.nonJainMembers?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <span className="text-[10px] uppercase font-black text-slate-400">{t("Non-Jain Helpers")}</span>
                        <div className="flex flex-wrap gap-1">
                          {monk.group.nonJainMembers.map((njm, i) => (
                            <Badge key={i} className="bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200">
                              {njm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Vihar Movement History */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("🚗 Vihar Journey Logs (Past Travels)")}</h4>
                  
                  {monk.tracking?.vihaarHistory?.length > 0 ? (
                    <div className="space-y-3">
                      {monk.tracking.vihaarHistory.map((v, i) => (
                        <div key={i} className="flex gap-4 items-center bg-slate-55 border p-3.5 rounded-xl text-xs bg-slate-50/50">
                          <div className="flex flex-col text-center bg-purple-100 border border-purple-200 rounded-lg p-2 w-28 text-[10px] font-bold text-purple-900">
                            <span>{v.startDate ? new Date(v.startDate).toLocaleDateString() : "—"}</span>
                            <span className="text-[8px] font-semibold block text-purple-500 mt-0.5">{t("Start Date")}</span>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-between pr-4 font-bold text-slate-800">
                            <span>{v.from}</span>
                            <ArrowRight className="h-4 w-4 text-purple-400" />
                            <span>{v.to}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 border border-dashed rounded-xl">
                      {t("No vihaar history logs recorded.")}
                    </div>
                  )}
                </div>

              </TabsContent>

              {/* 3. Tapasya Tab */}
              <TabsContent value="tapasya" className="p-6 space-y-6">
                
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("🪷 Completed Tapasya Milestones")}</h4>
                
                {monk.tapasya?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {monk.tapasya.map((tItem, idx) => (
                      <div key={idx} className="border p-4 rounded-xl bg-slate-50/50 shadow-sm space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-1.5 w-16 bg-purple-500" />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-purple-950">{tItem.name}</span>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-black">{tItem.count} {t("Completed")}</Badge>
                        </div>
                        <div className="text-xs space-y-1 mt-1 text-slate-600">
                          <div>{t("📍 Place:")} <strong>{tItem.place || "—"}</strong></div>
                          <div>{t("📅 Date:")} <strong>{tItem.date ? new Date(tItem.date).toLocaleDateString() : "—"}</strong></div>
                          {tItem.description && <div className="italic text-slate-500 mt-1">"{tItem.description}"</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-xl">
                    {t("No tapasya records linked.")}
                  </div>
                )}

              </TabsContent>

              {/* 4. Pre-diksha Family Tab */}
              <TabsContent value="family" className="p-6 space-y-6">
                
                <div className="bg-amber-50 p-4 border border-amber-100 text-xs text-amber-800 rounded-xl flex gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    {t("🔒 Privacy Guard: Pre-diksha family credentials are viewable only by verified community members. Sensitive fields remain protected.")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("👨 Parents")}</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500">{t("Father:")}</span><strong className="text-slate-800">{monk.preDikshaFather?.name || "—"}</strong></div>
                      <div className="flex justify-between border-b pb-1.5"><span className="text-slate-500">{t("Mother:")}</span><strong className="text-slate-800">{monk.preDikshaMother?.name || "—"}</strong></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("📍 Family Location Address")}</h4>
                    <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {monk.preDikshaLocation?.address || "Address not defined."}
                      {(monk.preDikshaLocation?.city || monk.preDikshaLocation?.state) && (
                        <div className="font-semibold text-slate-800 mt-1">
                          {monk.preDikshaLocation.city}, {monk.preDikshaLocation.state} {monk.preDikshaLocation.pincode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("👦 Siblings")}</h4>
                  {monk.siblings?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {monk.siblings.map((s, idx) => (
                        <div key={idx} className="p-3 border bg-slate-50/30 rounded-xl flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{s.name}</span>
                          <Badge className="bg-slate-100 text-slate-600 font-semibold">{s.relationship}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400">{t("No sibling credentials recorded.")}</div>
                  )}
                </div>

              </TabsContent>

              {/* 5. Daily Routine Tab */}
              <TabsContent value="routine" className="p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("🗣 Pravachan Timings")}</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1"><span className="text-slate-500">{t("Morning Pravachan:")}</span><strong className="text-slate-800">{monk.routine?.pravachanTimings?.morning || "—"}</strong></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-slate-500">{t("Afternoon Pravachan:")}</span><strong className="text-slate-800">{monk.routine?.pravachanTimings?.afternoon || "—"}</strong></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-slate-500">{t("Evening Pravachan:")}</span><strong className="text-slate-800">{monk.routine?.pravachanTimings?.evening || "—"}</strong></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("🧘 Darshan / Interaction")}</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1"><span className="text-slate-500">{t("Morning Slot:")}</span><strong className="text-slate-800">{monk.routine?.darshanTimings?.morning || "—"}</strong></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-slate-500">{t("Afternoon Slot:")}</span><strong className="text-slate-800">{monk.routine?.darshanTimings?.afternoon || "—"}</strong></div>
                      <div className="flex justify-between border-b pb-1"><span className="text-slate-500">{t("Evening Slot:")}</span><strong className="text-slate-800">{monk.routine?.darshanTimings?.evening || "—"}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-4 border-t pt-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("🕒 Languages Spoken")}</h4>
                  <div className="flex flex-wrap gap-1">
                    {(monk.languages || ["Hindi", "Gujarati"]).map((l) => (
                      <Badge key={l} className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-3 py-1 rounded-full">{l}</Badge>
                    ))}
                  </div>
                </div>

                {monk.routine?.maryada && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("📜 Maryada & Guidelines")}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 border rounded-xl">
                      {monk.routine.maryada}
                    </p>
                  </div>
                )}

              </TabsContent>

              {/* 6. Contacts & Links Tab */}
              <TabsContent value="contacts" className="p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Sangh Contact List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("👳 Jain Sangh Representatives")}</h4>
                    {monk.sanghContacts?.jainContacts?.length > 0 ? (
                      <div className="space-y-2">
                        {monk.sanghContacts.jainContacts.map((jc, i) => (
                          <div key={i} className="bg-slate-50 p-2.5 rounded-xl border text-xs flex justify-between items-center">
                            <span className="font-bold text-slate-700">{jc.memberId}</span>
                            <Badge className="bg-purple-100 text-purple-800 font-semibold">{jc.designation}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">{t("No Sangh representatives linked.")}</div>
                    )}
                  </div>

                  {/* Non-Jain Contacts */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">{t("👥 Coordinators / Helpers")}</h4>
                    {monk.sanghContacts?.nonJainContacts?.length > 0 ? (
                      <div className="space-y-2">
                        {monk.sanghContacts.nonJainContacts.map((njc, i) => (
                          <div key={i} className="bg-slate-50 p-2.5 rounded-xl border text-xs flex justify-between items-center">
                            <span className="font-bold text-slate-700">{njc.memberId}</span>
                            <Badge className="bg-purple-100 text-purple-800 font-semibold">{njc.designation}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">{t("No helpers linked.")}</div>
                    )}
                  </div>
                </div>

                {/* Direct Communications */}
                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">{t("📞 Direct Calling Number")}</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1">{monk.sanghContacts?.directCallingNumber || "Not Available"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">{t("💬 WhatsApp Direct link")}</span>
                    {monk.sanghContacts?.directWhatsAppNumber ? (
                      <span className="text-xs font-bold text-purple-700 block mt-1 underline cursor-pointer">
                        {monk.sanghContacts.directWhatsAppNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 block mt-1">{t("Not Available")}</span>
                    )}
                  </div>
                </div>

                {/* Official presence */}
                <div className="border-t pt-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t("🔗 Official Digital Presence")}</h4>
                  <div className="flex gap-4">
                    {monk.socialLinks?.website && <a href={monk.socialLinks.website} target="_blank" className="text-xs text-purple-700 hover:underline flex items-center gap-1"><Globe className="h-4 w-4" /> {t("Website")}</a>}
                    {monk.socialLinks?.facebook && <a href={monk.socialLinks.facebook} target="_blank" className="text-xs text-purple-700 hover:underline flex items-center gap-1"><Info className="h-4 w-4" /> {t("Facebook")}</a>}
                    {monk.socialLinks?.instagram && <a href={monk.socialLinks.instagram} target="_blank" className="text-xs text-purple-700 hover:underline flex items-center gap-1"><Info className="h-4 w-4" /> {t("Instagram")}</a>}
                    {monk.socialLinks?.youtube && <a href={monk.socialLinks.youtube} target="_blank" className="text-xs text-purple-700 hover:underline flex items-center gap-1"><Video className="h-4 w-4" /> {t("YouTube")}</a>}
                  </div>
                </div>

              </TabsContent>

            </Tabs>
          </Card>
        </div>
      </div>

      

      {/* ─── Report Incorrect Info Dialog ─────────────────────────────────── */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 animate-bounce" /> {t("Report Incorrect Information")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <p className="text-slate-500">
              {t("Please specify the incorrect information. Submitting this form will automatically register a Support Ticket for verification.")}
            </p>
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-400">{t("Corrections details")}</Label>
              <textarea rows={4} className="w-full mt-1.5 rounded-lg border bg-white px-3 py-2 text-xs focus:outline-none"
                value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)}
                placeholder={t("e.g. Sibling names are wrong, Diksha date should be 2018 instead of 2019...")} />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setReportOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={handleCreateSupportTicket} disabled={ticketSaving} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              {ticketSaving ? t("Submitting...") : t("Submit Corrections Report")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  );
}
