import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMemberAuth } from "@/contexts/MemberAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { memberProfileApi } from "@/lib/memberApi";
import { memberClient as api } from "@/lib/memberClient";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import CountryDropdown from "@/components/common/CountryDropdown";
import { PhoneField } from "@/components/common/PhoneInput";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { formatPan, formatAadhaar } from "@/lib/idFormats";
import { lookupPincode } from "@/lib/pincode";

import {
  GENDER_OPTIONS, NATIONALITY_OPTIONS, LANGUAGE_OPTIONS, MARITAL_STATUS_OPTIONS,
  MOTHER_TONGUE_OPTIONS, TITHI_CALENDAR_OPTIONS, JAIN_SECT_OPTIONS,
  SHWETAMBAR_SUB_SECTS, DIGAMBAR_SUB_SECTS,
  COMMUNICATION_METHOD_OPTIONS, BLOOD_GROUP_OPTIONS, VOLUNTEER_AVAILABILITY_OPTIONS,
  toOptions, toApiOptions,
} from "@/constants/dropdownOptions";

function calculateAge(dob) {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export default function MemberEditProfilePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, refreshUser } = useMemberAuth();
  
  const [busy, setBusy] = useState(false);
  const [subTab, setSubTab] = useState("personal");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [pinLookup, setPinLookup] = useState({
    currentAddress: { status: "idle", areas: [] },
    permanentAddress: { status: "idle", areas: [] }
  });

  // Master Data State
  const [communityList, setCommunityList] = useState([]);
  const [subCommunityList, setSubCommunityList] = useState([]);
  const [gacchaList, setGacchaList] = useState([]);
  const [calendarTypes, setCalendarTypes] = useState([]);

  // Initialize form state with full user schema data
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    surname: user?.surname || "",
    dob: user?.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
    gender: user?.gender || "",
    nationality: user?.nationality || "India",
    preferredLanguage: user?.preferredLanguage || "English",
    pan: user?.pan || "",
    aadhaar: user?.aadhaar || "",
    maritalStatus: user?.maritalStatus || "",
    
    sect: user?.sect || "",
    subCommunity: user?.subCommunityId || user?.subCommunity?.id || "",
    otherSubCommunity: user?.otherSubCommunity || "",
    gaccha: user?.gacchaId || user?.gaccha?.id || "",
    tithiCalendar: user?.tithiCalendarTypeId || user?.tithiCalendarType?.id || "",
    motherTongue: user?.motherTongue || "",

    mobile: user?.mobile || "",
    whatsapp: user?.whatsapp || "",
    email: user?.email || "",
    preferredCommunicationMethod: user?.preferredCommunicationMethod || "",
    alternateContact: user?.alternateContact || "",

    currentAddress: {
      line1: user?.currentAddress?.line1 || "",
      area: user?.currentAddress?.area || "",
      city: user?.currentAddress?.city || "",
      district: user?.currentAddress?.district || "",
      state: user?.currentAddress?.state || "",
      country: user?.currentAddress?.country || "India",
      pincode: user?.currentAddress?.pincode || ""
    },
    permanentAddress: {
      line1: user?.permanentAddress?.line1 || "",
      area: user?.permanentAddress?.area || "",
      city: user?.permanentAddress?.city || "",
      district: user?.permanentAddress?.district || "",
      state: user?.permanentAddress?.state || "",
      country: user?.permanentAddress?.country || "India",
      pincode: user?.permanentAddress?.pincode || ""
    },
    sameAsPermanent: user?.sameAsPermanent || false,

    bloodGroup: user?.bloodGroup || "",
    disability: user?.disability || "",
    medicalNotes: user?.medicalNotes || "",
    emergencyContact: {
      name: user?.emergencyContact?.name || "",
      mobile: user?.emergencyContact?.mobile || "",
      relation: user?.emergencyContact?.relation || ""
    },

    profession: user?.profession || "",
    isVolunteer: user?.isVolunteer || false,
    volunteerAreas: user?.volunteerAreas || [],
    volunteerAvailability: user?.volunteerAvailability || "",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const profile = await memberProfileApi.getMyProfile();
        if (profile && isMounted) {
          setForm({
            firstName: profile.firstName || "",
            middleName: profile.middleName || "",
            surname: profile.surname || "",
            dob: profile.dob ? new Date(profile.dob).toISOString().split("T")[0] : "",
            gender: profile.gender || "",
            nationality: profile.nationality || "India",
            preferredLanguage: profile.preferredLanguage || "English",
            pan: profile.pan || "",
            aadhaar: profile.aadhaar || "",
            maritalStatus: profile.maritalStatus || "",
            
            sect: profile.sect || "",
            subCommunity: profile.subCommunityId || profile.subCommunity?.id || "",
            otherSubCommunity: profile.otherSubCommunity || "",
            gaccha: profile.gacchaId || profile.gaccha?.id || "",
            tithiCalendar: profile.tithiCalendarTypeId || profile.tithiCalendarType?.id || "",
            motherTongue: profile.motherTongue || "",

            mobile: profile.mobile || "",
            whatsapp: profile.whatsapp || "",
            email: profile.email || "",
            preferredCommunicationMethod: profile.preferredCommunicationMethod || "",
            alternateContact: profile.alternateContact || "",

            currentAddress: {
              line1: profile.currentAddress?.line1 || "",
              area: profile.currentAddress?.area || "",
              city: profile.currentAddress?.city || "",
              district: profile.currentAddress?.district || "",
              state: profile.currentAddress?.state || "",
              country: profile.currentAddress?.country || "India",
              pincode: profile.currentAddress?.pincode || ""
            },
            permanentAddress: {
              line1: profile.permanentAddress?.line1 || "",
              area: profile.permanentAddress?.area || "",
              city: profile.permanentAddress?.city || "",
              district: profile.permanentAddress?.district || "",
              state: profile.permanentAddress?.state || "",
              country: profile.permanentAddress?.country || "India",
              pincode: profile.permanentAddress?.pincode || ""
            },
            sameAsPermanent: profile.sameAsPermanent || false,

            bloodGroup: profile.bloodGroup || "",
            disability: profile.disability || "",
            medicalNotes: profile.medicalNotes || "",
            emergencyContact: {
              name: profile.emergencyContact?.name || "",
              mobile: profile.emergencyContact?.mobile || "",
              relation: profile.emergencyContact?.relation || ""
            },

            profession: profile.profession || "",
            isVolunteer: profile.isVolunteer || false,
            volunteerAreas: profile.volunteerAreas || [],
            volunteerAvailability: profile.volunteerAvailability || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [calRes, commRes, subCommRes, gacchaRes] = await Promise.allSettled([
          api.get("/master-data/tithi-calendar-types"),
          api.get("/master-data/communities"),
          api.get("/master-data/sub-communities"),
          api.get("/master-data/gacchas")
        ]);

        if (calRes.status === "fulfilled") {
          const list = calRes.value.data?.data?.items || calRes.value.data?.data || [];
          if (list.length) setCalendarTypes(list);
        }
        if (commRes.status === "fulfilled") {
          const list = commRes.value.data?.data?.items || commRes.value.data?.data || [];
          if (list.length) setCommunityList(list);
        }
        if (subCommRes.status === "fulfilled") {
          const list = subCommRes.value.data?.data?.items || subCommRes.value.data?.data || [];
          if (list.length) setSubCommunityList(list);
        }
        if (gacchaRes.status === "fulfilled") {
          const list = gacchaRes.value.data?.data?.items || gacchaRes.value.data?.data || [];
          if (list.length) setGacchaList(list);
        }
      } catch (err) {
        console.error("Master data fetch failed", err);
      }
    };
    fetchData();
  }, []);

  const applyPincodeLookup = async (type, code) => {
    if (code.length !== 6) {
      setPinLookup(p => ({ ...p, [type]: { status: "idle", areas: [] } }));
      return;
    }
    setPinLookup(p => ({ ...p, [type]: { status: "loading", areas: [] } }));
    try {
      const info = await lookupPincode(code);
      if (info && info.status === "Success" && info.PostOffice && info.PostOffice.length > 0) {
        const po = info.PostOffice[0];
        setForm(f => ({
          ...f,
          [type]: {
            ...f[type],
            city: po.District || po.Region || f[type].city,
            state: po.State || f[type].state,
            district: po.District || f[type].district,
            country: "India"
          }
        }));
        
        const uniqueAreas = [...new Set(info.PostOffice.map(p => p.Name))];
        if (uniqueAreas.length === 1) {
          setForm(f => ({ ...f, [type]: { ...f[type], area: uniqueAreas[0] } }));
        }
        setPinLookup(p => ({ ...p, [type]: { status: "done", areas: uniqueAreas } }));
      } else {
        setPinLookup(p => ({ ...p, [type]: { status: "notfound", areas: [] } }));
      }
    } catch (error) {
      setPinLookup(p => ({ ...p, [type]: { status: "notfound", areas: [] } }));
    }
  };

  const editTabs = [
    { id: "personal", label: t("👤 Personal Details") },
    { id: "community", label: t("🛕 Community Details") },
    { id: "contact", label: t("📱 Contacts") },
    { id: "address", label: t("📍 Addresses") },
    { id: "health", label: t("🏥 Health & Emergency") },
    { id: "volunteer", label: t("🙏 Volunteering") },
    { id: "security", label: t("🔒 Security") }
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Build exactly what the backend schema expects.
      const payload = {
        firstName: form.firstName,
        middleName: form.middleName,
        surname: form.surname,
        dob: form.dob ? new Date(form.dob).toISOString() : null,
        gender: form.gender,
        nationality: form.nationality,
        preferredLanguage: form.preferredLanguage,
        pan: form.pan,
        aadhaar: form.aadhaar,
        maritalStatus: form.maritalStatus,

        motherTongue: form.motherTongue,
        tithiCalendarTypeId: form.tithiCalendar,
        subCommunityId: form.subCommunity === "Other" ? form.otherSubCommunity : form.subCommunity,
        gacchaId: form.gaccha,
        
        whatsapp: form.whatsapp,
        email: form.email,
        preferredCommunicationMethod: form.preferredCommunicationMethod,
        alternateContact: form.alternateContact,

        currentAddress: form.currentAddress,
        permanentAddress: form.sameAsPermanent ? form.currentAddress : form.permanentAddress,
        sameAsPermanent: form.sameAsPermanent,

        bloodGroup: form.bloodGroup,
        disability: form.disability,
        medicalNotes: form.medicalNotes,
        emergencyContact: form.emergencyContact,

        profession: form.profession,
        isVolunteer: form.isVolunteer,
        volunteerAreas: form.volunteerAreas,
        volunteerAvailability: form.volunteerAvailability
      };
      
      // Clean up empty fields to prevent Prisma Foreign Key or Type constraint violations
      const fieldsToRemoveIfEmpty = [
        "dob", "pan", "aadhaar", "subCommunityId", "gacchaId", "tithiCalendarTypeId",
        "bloodGroup", "disability", "medicalNotes", "profession", "volunteerAvailability",
        "motherTongue", "maritalStatus", "email", "whatsapp", "preferredCommunicationMethod", "alternateContact"
      ];
      
      for (const field of fieldsToRemoveIfEmpty) {
        if (payload[field] === "" || payload[field] === null || payload[field] === undefined) {
          delete payload[field];
        }
      }
      
      // Ensure emergencyContact is not sent as empty strings
      if (!payload.emergencyContact.name && !payload.emergencyContact.mobile) {
        delete payload.emergencyContact;
      }
      
      await memberProfileApi.updateMyProfile(payload);
      toast.success(t("Profile updated successfully"));
      if (refreshUser) {
        await refreshUser();
      }
      navigate(-1);
    } catch (error) {
      let msg = error.response?.data?.error?.message || error.response?.data?.message || error.message || t("Failed to update profile");
      if (error.response?.data?.error?.fieldErrors) {
        const fields = Object.values(error.response.data.error.fieldErrors).flat();
        if (fields.length > 0) msg += ": " + fields[0];
      }
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full p-0 sm:p-2 md:p-4 lg:p-6 w-full max-w-7xl mx-auto">
      <div className="flex-1 flex flex-col bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-full min-h-0">
        <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full mr-3 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">{t("Edit Profile")}</h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">{t("Update your personal and community details")}</p>
            </div>
          </div>
          <button 
            onClick={onSubmit}
            disabled={busy}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-5 rounded-xl transition-all shadow-sm disabled:opacity-70 text-xs sm:text-sm shrink-0"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">{t("Save Profile")}</span>
            <span className="sm:hidden">{t("Save")}</span>
          </button>
        </header>

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-900 relative">
          {/* Left panel tabs list */}
          <div className="w-full md:w-64 bg-slate-900 text-slate-300 p-2 md:p-4 flex md:flex-col gap-1 shrink-0 overflow-x-auto md:overflow-y-auto border-b md:border-b-0 border-r-0 md:border-r border-slate-800 scrollbar-hide">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0 md:mb-3 px-2 hidden md:block">{t("Profile Sections")}</div>
            <div className="flex md:flex-col gap-1 w-max md:w-auto pb-1 md:pb-0">
              {editTabs.map((tItem) => (
                <button
                  key={tItem.id}
                  onClick={() => setSubTab(tItem.id)}
                  className={`shrink-0 text-left py-2 px-3 sm:py-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    subTab === tItem.id
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side form */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50 h-full pb-24 md:pb-8">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Personal Tab */}
            {subTab === "personal" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{t("👤 Personal Information")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">{t("First Name *")}</Label>
                    <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Middle Name *")}</Label>
                    <Input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Surname *")}</Label>
                    <Input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} className="mt-1 bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">{t("Date of Birth")}</Label>
                    <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Gender *")}</Label>
                    <SearchableSelect
                      value={form.gender}
                      onValueChange={(v) => setForm({ ...form, gender: v })}
                      options={GENDER_OPTIONS}
                      placeholder={t("Select gender")}
                      className="mt-1"
                    />
                  </div>
                </div>

                {form.dob && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                    <span className="text-sm text-orange-700 font-semibold">{t("Calculated Age:")} {calculateAge(form.dob)} {t("Years")}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">{t("Nationality *")}</Label>
                    <SearchableSelect
                      value={form.nationality}
                      onValueChange={(v) => setForm({ ...form, nationality: v })}
                      options={NATIONALITY_OPTIONS}
                      placeholder={t("Select nationality")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Preferred Language")}</Label>
                    <SearchableSelect
                      value={form.preferredLanguage}
                      onValueChange={(v) => setForm({ ...form, preferredLanguage: v })}
                      options={LANGUAGE_OPTIONS}
                      placeholder={t("Select language")}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">{t("PAN Number")}</Label>
                    <Input value={form.pan} onChange={(e) => setForm({ ...form, pan: formatPan(e.target.value) })} placeholder={t("ABCDE1234F")} className="mt-1 font-mono uppercase bg-white" maxLength={10} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Aadhaar Number (12 digits)")}</Label>
                    <Input value={form.aadhaar} onChange={(e) => setForm({ ...form, aadhaar: formatAadhaar(e.target.value) })} placeholder="1234 5678 9012" className="mt-1 font-mono bg-white" maxLength={14} inputMode="numeric" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">{t("Marital Status *")}</Label>
                  <SearchableSelect
                    value={form.maritalStatus}
                    onValueChange={(v) => setForm({ ...form, maritalStatus: v })}
                    options={MARITAL_STATUS_OPTIONS}
                    placeholder={t("Select status")}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Community Tab */}
            {subTab === "community" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{t("🛕 Community Details")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">{t("Mother Tongue")}</Label>
                    <SearchableSelect
                      value={form.motherTongue}
                      onValueChange={(v) => setForm({ ...form, motherTongue: v })}
                      options={MOTHER_TONGUE_OPTIONS}
                      placeholder={t("Select mother tongue")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Tithi Calendar Type")}</Label>
                    <SearchableSelect
                      value={form.tithiCalendar}
                      onValueChange={(v) => setForm({ ...form, tithiCalendar: v })}
                      options={toApiOptions(calendarTypes, "id", "name")}
                      placeholder={t("Select calendar")}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">{t("members.jainSect", "Jain Sect")}</Label>
                    <SearchableSelect
                      value={form.sect}
                      onValueChange={(v) => {
                        const newCommunityId = communityList.find(c => c.name === v)?.id || "";
                        setForm({ ...form, sect: v, communityId: newCommunityId });
                      }}
                      options={JAIN_SECT_OPTIONS}
                      placeholder={t("Select sect")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("members.subSect", "Sub Sect / Community")}</Label>
                    <SearchableSelect
                      value={form.subCommunity}
                      onValueChange={(v) => setForm({ ...form, subCommunity: v })}
                      options={toApiOptions(subCommunityList.filter(s => !form.sect || s.community?.name === form.sect), "id", "name")}
                      placeholder={t("Select sub-sect")}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Gaccha field hidden */}

                {form.subCommunity === "Other" && (
                  <div>
                    <Label className="text-xs">{t("members.otherSubSect", "Specify Custom Sub-Sect")}</Label>
                    <Input
                      value={form.otherSubCommunity || ""}
                      onChange={(e) => setForm({ ...form, otherSubCommunity: e.target.value })}
                      placeholder={t("Enter sub-sect name...")}
                      className="mt-1 bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Contacts Tab */}
            {subTab === "contact" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{t("📱 Contacts")}</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                    <Label className="text-xs text-slate-500">{t("Mobile Number")} <span className="font-normal">(Primary / Login ID)</span></Label>
                    <div className="font-bold mt-1 text-slate-700">{form.mobile || "-"}</div>
                    <p className="text-[10px] text-slate-500 mt-1">{t("Primary mobile number cannot be changed directly here. Contact support to change.")}</p>
                  </div>

                  <div>
                    <Label className="text-xs">{t("WhatsApp Number")}</Label>
                    <PhoneField value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder={t("WhatsApp Number")} className="mt-1" />
                  </div>

                  <div>
                    <Label className="text-xs">{t("Email ID")}</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@domain.com" className="mt-1 bg-white" />
                  </div>

                  <div>
                    <Label className="text-xs">{t("Preferred Contact Method")}</Label>
                    <SearchableSelect
                      value={form.preferredCommunicationMethod}
                      onValueChange={(v) => setForm({ ...form, preferredCommunicationMethod: v })}
                      options={COMMUNICATION_METHOD_OPTIONS}
                      placeholder={t("Select method")}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">{t("Alternate Phone Contact")}</Label>
                    <PhoneField value={form.alternateContact} onChange={(v) => setForm({ ...form, alternateContact: v })} placeholder={t("Alternate Phone Contact")} className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Address Tab */}
            {subTab === "address" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 border-b pb-2">{t("Current Address")}</h3>
                  <div>
                    <Label className="text-xs">{t("Address Line 1 *")}</Label>
                    <Input value={form.currentAddress.line1} onChange={(e) => setForm({ ...form, currentAddress: { ...form.currentAddress, line1: e.target.value } })} placeholder={t("Full address, House/Flat No, Street")} className="mt-1 bg-white" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">{t("Country *")}</Label>
                      <CountryDropdown value={form.currentAddress.country || "India"} onValueChange={(v) => setForm({ ...form, currentAddress: { ...form.currentAddress, country: v } })} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">{t("Pincode *")}</Label>
                      <Input
                        value={form.currentAddress.pincode}
                        onChange={(e) => {
                          const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setForm({ ...form, currentAddress: { ...form.currentAddress, pincode } });
                          applyPincodeLookup("currentAddress", pincode);
                        }}
                        placeholder={t("6-digit Pincode")}
                        className="mt-1 bg-white"
                        maxLength={6}
                        inputMode="numeric"
                      />
                      {pinLookup.currentAddress?.status === "loading" && (
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> {t("Detecting address...")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">{t("Area *")}</Label>
                      <Input value={form.currentAddress.area || ""} onChange={(e) => setForm({ ...form, currentAddress: { ...form.currentAddress, area: e.target.value } })} className="mt-1 bg-white" />
                      {pinLookup.currentAddress?.areas?.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {pinLookup.currentAddress.areas.slice(0, 8).map((areaName) => (
                            <button
                              key={areaName}
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, currentAddress: { ...prev.currentAddress, area: areaName } }))}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                form.currentAddress.area === areaName
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-orange-400"
                              }`}
                            >
                              {areaName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">{t("City *")}</Label>
                      <Input value={form.currentAddress.city} onChange={(e) => setForm({ ...form, currentAddress: { ...form.currentAddress, city: e.target.value } })} className="mt-1 bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">{t("District")}</Label>
                      <Input value={form.currentAddress.district || ""} onChange={(e) => setForm({ ...form, currentAddress: { ...form.currentAddress, district: e.target.value } })} className="mt-1 bg-white" />
                    </div>
                    <div>
                      <Label className="text-xs">{t("State *")}</Label>
                      <Input value={form.currentAddress.state} onChange={(e) => setForm({ ...form, currentAddress: { ...form.currentAddress, state: e.target.value } })} className="mt-1 bg-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-sm font-bold text-slate-800">{t("Permanent Address")}</h3>
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.sameAsPermanent} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm({
                            ...form,
                            sameAsPermanent: checked,
                            permanentAddress: checked ? { ...form.currentAddress } : { line1: "", city: "", state: "", district: "", area: "", country: "India", pincode: "" }
                          });
                        }} 
                        className="h-4 w-4 text-orange-500 rounded border-slate-300" 
                      />
                      {t("Same as Current")}
                    </label>
                  </div>
                  
                  {!form.sameAsPermanent && (
                    <>
                      <div>
                        <Label className="text-xs">{t("Address Line 1")}</Label>
                        <Input value={form.permanentAddress.line1} onChange={(e) => setForm({ ...form, permanentAddress: { ...form.permanentAddress, line1: e.target.value } })} className="mt-1 bg-white" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">{t("Country")}</Label>
                          <CountryDropdown value={form.permanentAddress.country || "India"} onValueChange={(v) => setForm({ ...form, permanentAddress: { ...form.permanentAddress, country: v } })} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">{t("Pincode")}</Label>
                          <Input
                            value={form.permanentAddress.pincode || ""}
                            onChange={(e) => {
                              const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setForm({ ...form, permanentAddress: { ...form.permanentAddress, pincode } });
                              applyPincodeLookup("permanentAddress", pincode);
                            }}
                            className="mt-1 bg-white"
                            maxLength={6}
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">{t("Area")}</Label>
                          <Input value={form.permanentAddress.area || ""} onChange={(e) => setForm({ ...form, permanentAddress: { ...form.permanentAddress, area: e.target.value } })} className="mt-1 bg-white" />
                        </div>
                        <div>
                          <Label className="text-xs">{t("City")}</Label>
                          <Input value={form.permanentAddress.city} onChange={(e) => setForm({ ...form, permanentAddress: { ...form.permanentAddress, city: e.target.value } })} className="mt-1 bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">{t("District")}</Label>
                          <Input value={form.permanentAddress.district || ""} onChange={(e) => setForm({ ...form, permanentAddress: { ...form.permanentAddress, district: e.target.value } })} className="mt-1 bg-white" />
                        </div>
                        <div>
                          <Label className="text-xs">{t("State")}</Label>
                          <Input value={form.permanentAddress.state} onChange={(e) => setForm({ ...form, permanentAddress: { ...form.permanentAddress, state: e.target.value } })} className="mt-1 bg-white" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Health & Emergency Tab */}
            {subTab === "health" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{t("🏥 Health & Emergency")}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">{t("Blood Group")}</Label>
                    <SearchableSelect
                      value={form.bloodGroup}
                      onValueChange={(v) => setForm({ ...form, bloodGroup: v })}
                      options={BLOOD_GROUP_OPTIONS}
                      placeholder={t("Select blood group")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Disability")}</Label>
                    <SearchableSelect
                      value={form.disability}
                      onValueChange={(v) => setForm({ ...form, disability: v })}
                      options={[{ value: "No", label: t("No") }, { value: "Yes", label: t("Yes") }]}
                      placeholder={t("Select")}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">{t("Medical Notes / Allergies")}</Label>
                  <Input value={form.medicalNotes || ""} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} placeholder={t("Any important medical information")} className="mt-1 bg-white" />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-md font-bold text-slate-800">{t("Emergency Contact")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">{t("Contact Name")}</Label>
                      <Input value={form.emergencyContact?.name || ""} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} className="mt-1 bg-white" />
                    </div>
                    <div>
                      <Label className="text-xs">{t("Relationship")}</Label>
                      <SearchableSelect
                        value={form.emergencyContact?.relation || ""}
                        onValueChange={(v) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relation: v } })}
                        options={toOptions(["Father", "Mother", "Husband", "Wife", "Son", "Daughter", "Brother", "Sister", "Other"])}
                        placeholder={t("Select relationship")}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{t("Emergency Phone")}</Label>
                    <PhoneField value={form.emergencyContact?.mobile || ""} onChange={(v) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, mobile: v } })} className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Volunteering Tab */}
            {subTab === "volunteer" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{t("🙏 Volunteering & Profession")}</h3>
                
                <div>
                  <Label className="text-xs">{t("Occupation / Profession")}</Label>
                  <Input value={form.profession || ""} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder={t("e.g. Doctor, Engineer")} className="mt-1 bg-white" />
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-xl mt-6">
                  <div>
                    <h4 className="font-bold text-orange-900">{t("Open for Volunteering")}</h4>
                    <p className="text-xs text-orange-700/80">{t("Join teams for event management, medical help, or crowd coordination.")}</p>
                  </div>
                  <input type="checkbox" checked={form.isVolunteer} onChange={(e) => setForm({ ...form, isVolunteer: e.target.checked })} className="h-5 w-5 text-orange-600 rounded border-orange-300" />
                </div>

                {form.isVolunteer && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label className="text-xs">{t("Volunteer Areas")}</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {["Event Management", "Medical Help", "Crowd Management", "Hospitality", "Food Distribution", "Administration", "Other"].map(v => {
                          const checked = form.volunteerAreas?.includes(v);
                          return (
                            <label key={v} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                              <input type="checkbox" checked={checked} onChange={() => {
                                const next = checked ? form.volunteerAreas.filter(a => a !== v) : [...(form.volunteerAreas || []), v];
                                setForm({ ...form, volunteerAreas: next });
                              }} className="h-4 w-4 text-orange-500 rounded border-slate-300" />
                              <span className="text-xs font-medium text-slate-700">{v}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">{t("Availability")}</Label>
                      <SearchableSelect
                        value={form.volunteerAvailability || ""}
                        onValueChange={(v) => setForm({ ...form, volunteerAvailability: v })}
                        options={VOLUNTEER_AVAILABILITY_OPTIONS}
                        placeholder={t("Select availability")}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {subTab === "security" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{t("🔒 Security")}</h3>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800">{t("Account Password")}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("Set or change your password for logging into your account.")}
                    </p>
                  </div>
                  <Button type="button" onClick={() => setPasswordModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">
                    {t("Change Password")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
      {passwordModalOpen && (
        <ChangePasswordModal
          open={passwordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
          apiClient={api}
        />
      )}
    </div>
  );
}
