import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Heart,
  Users,
  Star,
  ChevronLeft,
  Calendar,
  Shield,
  Activity,
  Briefcase,
  HeartHandshake,
  CheckCircle,
  FileText,
  Gift,
  Bookmark,
  Ticket,
} from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProfileViewSwitcher } from "@/components/common/ProfileViewSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function SectionRow({
  icon: Icon,
  label,
  value,
  iconBg = "bg-orange-100 text-orange-600",
}) {
  return (
    <div className="flex items-center gap-3.5 py-3 border-b border-slate-100 last:border-0">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
          iconBg,
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-400">{label}</div>
        <div className="text-sm font-bold text-slate-800 truncate">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

export default function AdminMemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMemberDetails();
  }, [id]);

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/members/admin-details/${id}`);
      setMember(res.data.data);
    } catch (err) {
      console.error("Failed to fetch member details", err);
      setError("Failed to load member profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {t("Loading Profile...")}
        </h1>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800">
          {error || "Member not found"}
        </h2>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("Go Back")}
        </Button>
      </div>
    );
  }

  const displayName =
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.fullName ||
    t("Unknown Member");
  const isNonJain = member.category === "NON_JAIN";

  const hasAdminAccess =
    member?.user &&
    (!["MEMBER", "NON_JAIN_MEMBER"].includes(
      String(member.user.primaryRoleKey || "").toUpperCase(),
    ) ||
      (member.user.userOrganizations &&
        member.user.userOrganizations.length > 0));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-slate-500 hover:text-slate-900 px-2 -ml-2 shrink-0 self-start sm:self-auto"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("Back to Members")}
        </Button>

        <ProfileViewSwitcher
          currentView="member"
          publicId={member.publicId}
          userId={member.userId}
          hasAdminAccess={hasAdminAccess}
        />
      </div>

      {/* ── Top Hero Banner ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-6 sm:p-8 text-white shadow-xl shadow-orange-500/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center text-4xl shadow-lg">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt=""
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <span>🙏</span>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {displayName}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {member.publicId && (
                  <span className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold font-mono">
                    ID: {member.publicId}
                  </span>
                )}
                <span className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold">
                  {isNonJain ? t("🌐 Community Member") : t("🙏 Jain Member")}
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold border",
                    member.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/30"
                      : "bg-red-500/20 text-red-100 border-red-400/30",
                  )}
                >
                  {member.status || "UNKNOWN"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm shadow-md backdrop-blur border border-white/20 flex flex-col items-center justify-center">
              <span className="text-xs text-white/70 font-semibold uppercase">
                {t("Platform Join Date")}
              </span>
              <span>
                {member.createdAt
                  ? new Date(member.createdAt).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs for details ────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 mb-6 w-full max-w-2xl grid grid-cols-4">
          <TabsTrigger
            value="overview"
            className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
          >
            Other Details
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
          >
            Activity & Data
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600"
          >
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 outline-none"
        >
          {/* Left Column (Personal Info & Community) */}
          <div className="space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {t("Personal Information")}
              </h2>
              <SectionRow
                icon={User}
                label={t("Full Name")}
                value={displayName}
              />
              <SectionRow
                icon={Phone}
                label={t("Mobile Number")}
                value={member.mobile}
                iconBg="bg-green-100 text-green-600"
              />
              <SectionRow
                icon={Mail}
                label={t("Email Address")}
                value={member.email}
                iconBg="bg-sky-100 text-sky-600"
              />
              <SectionRow
                icon={Calendar}
                label={t("Date of Birth")}
                value={
                  member.dob ? new Date(member.dob).toLocaleDateString() : "—"
                }
                iconBg="bg-pink-100 text-pink-600"
              />
              <SectionRow
                icon={Heart}
                label={t("Blood Group")}
                value={member.bloodGroup || "—"}
                iconBg="bg-red-100 text-red-600"
              />
            </div>

            {/* Address Details */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {t("Current Address")}
              </h2>
              <SectionRow
                icon={MapPin}
                label={t("City")}
                value={member.currentAddress?.city || member.city}
                iconBg="bg-amber-100 text-amber-600"
              />
              <SectionRow
                icon={MapPin}
                label={t("State")}
                value={member.currentAddress?.state || member.state}
                iconBg="bg-emerald-100 text-emerald-600"
              />
              <SectionRow
                icon={MapPin}
                label={t("Country")}
                value={member.currentAddress?.country || "India"}
                iconBg="bg-indigo-100 text-indigo-600"
              />
              <SectionRow
                icon={MapPin}
                label={t("Full Address")}
                value={member.currentAddress?.addressLine1 || "—"}
                iconBg="bg-slate-100 text-slate-600"
              />
            </div>
          </div>

          {/* Right Column (Community Details) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {t("Community & Sect")}
              </h2>
              {!isNonJain && (
                <>
                  <SectionRow
                    icon={Shield}
                    label={t("Sect")}
                    value={
                      member.sect?.name ||
                      (typeof member.sect === "string" ? member.sect : "—")
                    }
                    iconBg="bg-orange-100 text-orange-600"
                  />
                  <SectionRow
                    icon={Users}
                    label={t("Sub-Sect")}
                    value={
                      member.subCommunity?.name ||
                      (typeof member.subCommunity === "string"
                        ? member.subCommunity
                        : "—")
                    }
                    iconBg="bg-amber-100 text-amber-600"
                  />
                  <SectionRow
                    icon={Users}
                    label={t("Gaccha")}
                    value={
                      member.gaccha?.name ||
                      (typeof member.gaccha === "string" ? member.gaccha : "—")
                    }
                    iconBg="bg-yellow-100 text-yellow-600"
                  />
                </>
              )}
              {isNonJain && (
                <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                  {t(
                    "Non-Jain community member. Sect details are not applicable.",
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {t("Family Details")}
              </h2>
              {member.familyMembers && member.familyMembers.length > 0 ? (
                <div className="space-y-3">
                  {member.familyMembers.map((fm, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {fm.firstName} {fm.lastName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {fm.relation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                  {t("No family members added.")}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="details"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 outline-none"
        >
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {t("Professional & Personal")}
              </h2>
              <SectionRow
                icon={Briefcase}
                label={t("Profession")}
                value={member.profession || "—"}
                iconBg="bg-indigo-100 text-indigo-600"
              />
              <SectionRow
                icon={User}
                label={t("Nationality")}
                value={member.nationality || "—"}
                iconBg="bg-sky-100 text-sky-600"
              />
              <SectionRow
                icon={HeartHandshake}
                label={t("Marital Status")}
                value={member.maritalStatus || "—"}
                iconBg="bg-pink-100 text-pink-600"
              />
              <SectionRow
                icon={MapPin}
                label={t("Native Village")}
                value={member.nativeVillage || "—"}
                iconBg="bg-amber-100 text-amber-600"
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {t("Interests & Volunteering")}
              </h2>
              <SectionRow
                icon={HeartHandshake}
                label={t("Is Volunteer?")}
                value={member.isVolunteer ? "Yes" : "No"}
                iconBg="bg-emerald-100 text-emerald-600"
              />
              <div className="py-3 border-b border-slate-100 last:border-0">
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  {t("Interests")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.interests && member.interests.length > 0 ? (
                    member.interests.map((i, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full"
                      >
                        {i.interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-bold text-slate-800">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {t("Emergency Contact")}
              </h2>
              <SectionRow
                icon={User}
                label={t("Name")}
                value={member.emergencyContact?.name || "—"}
              />
              <SectionRow
                icon={Phone}
                label={t("Mobile")}
                value={member.emergencyContact?.mobile || "—"}
                iconBg="bg-green-100 text-green-600"
              />
              <SectionRow
                icon={Users}
                label={t("Relation")}
                value={member.emergencyContact?.relation || "—"}
                iconBg="bg-purple-100 text-purple-600"
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                {t("Consents & Privacy")}
              </h2>
              <div className="space-y-3">
                {member.consents && member.consents.length > 0 ? (
                  member.consents.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-slate-700">
                        {c.consentType}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm font-medium text-slate-500">
                    No consents recorded
                  </span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="activity"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 outline-none"
        >
          {/* Followed Entities */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-base font-bold">{t("Followed Entities")}</h2>
            </div>
            <div className="space-y-3">
              {member.monkFollows?.map((follow, idx) => (
                <div
                  key={`monk-${idx}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        {follow.monk?.name || "Unknown Monk"}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        Monk Follow
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {member.organizationFollows?.map((follow, idx) => (
                <div
                  key={`org-${idx}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        {follow.organization?.name || "Unknown Organization"}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        Organization Follow
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!member.monkFollows?.length &&
                !member.organizationFollows?.length && (
                  <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                    {t("No follows found.")}
                  </div>
                )}
            </div>
          </div>

          {/* Reactions / Activity */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <Activity className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-bold">
                {t("Recent Activity & Engagements")}
              </h2>
            </div>
            <div className="space-y-3">
              {member.eventRsvps?.map((rsvp, idx) => (
                <div
                  key={`rsvp-${idx}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-200 text-sky-700">
                        RSVP: {rsvp.status}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {rsvp.event?.title || "Event"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {new Date(rsvp.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}

              {member.donations?.map((don, idx) => (
                <div
                  key={`don-${idx}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-200 text-emerald-800">
                        Donation
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        ₹{don.amount}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {new Date(don.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}

              {!member.eventRsvps?.length &&
                !member.donations?.length &&
                !member.feedLikes?.length && (
                  <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                    {t("No recent activities found.")}
                  </div>
                )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="documents"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 outline-none"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold">
                {t("Government Documents")}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 mb-1">
                  Aadhaar Card
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {member.aadhaar || "Not Provided"}
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 mb-1">
                  PAN Card
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {member.pan || "Not Provided"}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
