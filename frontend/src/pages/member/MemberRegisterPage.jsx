import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, Check, ArrowLeft, ShieldCheck, Heart, Sparkles, User, Calendar, MapPin, Globe, CreditCard, FileText, Lock } from "lucide-react";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { memberAuthApi } from "@/lib/memberApi";
import { memberClient as api } from "@/lib/memberClient";
import { extractErrorMessage } from "@/lib/api";
import { useMemberAuth } from "@/contexts/MemberAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { PhoneField } from "@/components/common/PhoneInput";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function normalizeMobile(raw) {
  const s = String(raw || "").replace(/[^\d+]/g, "");
  if (!s) return "";
  if (s.startsWith("+")) return `+${s.slice(1).replace(/\+/g, "")}`;
  if (/^[6-9]\d{9}$/.test(s)) return `+91${s}`;
  if (/^91[6-9]\d{9}$/.test(s)) return `+${s}`;
  if (/^0[6-9]\d{9}$/.test(s)) return `+91${s.slice(1)}`;
  return `+${s}`;
}

/**
 * 75+ Murtipujak Gacchas Master List (§2)
 */
const MURTIPUJAK_GACCHAS = [
  "Tapa Gaccha", "Achal Gaccha", "Kharatara Gaccha", "Upkeśa Gaccha", "Jiravala Gaccha", "Lonka (Richmati) Gaccha",
  "Gangeshvara Gaccha", "Korantavala Gaccha", "Anandapura Gaccha", "Bharavali Gaccha", "Udhaviya Gaccha", "Gudava Gaccha",
  "Dekawa Gaccha", "Bhinmala Gaccha", "Mahudiya Gaccha", "Gachhapala Gaccha", "Goshavala Gaccha", "Magatragada Gaccha",
  "Vrihmaniya Gaccha", "Talara Gaccha", "Vikadiya Gaccha", "Munjhiya Gaccha", "Chitroda Gaccha", "Sachora Gaccha",
  "Jachandiya Gaccha", "Sidhalava Gaccha", "Miyanniya Gaccha", "Agamiya Gaccha", "Maladhari Gaccha", "Bhavariya Gaccha",
  "Paliwala Gaccha", "Nagadigeshvara Gaccha", "Dharmaghosha Gaccha", "Nagapura Gaccha", "Uchatavala Gaccha", "Nannavala Gaccha",
  "Sadera Gaccha", "Mandovara Gaccha", "Surani Gaccha", "Khambhavati Gaccha", "Panchanda Gaccha", "Sopariya Gaccha",
  "Mandaliya Gaccha", "Kochhipana Gaccha", "Jaganna Gaccha", "Laparavala Gaccha", "Vosarada Gaccha", "Duivandaniya Gaccha",
  "Chitravala Gaccha", "Vegada Gaccha", "Vapada Gaccha", "Vijahara Gaccha", "Kapuri Gaccha", "Kachala Gaccha",
  "Handaliya Gaccha", "Mahukara Gaccha", "Putaliya Gaccha", "Kannariseya Gaccha", "Revardiya Gaccha", "Dhandhuka Gaccha",
  "Thambhanipana Gaccha", "Panchivala Gaccha", "Palanpura Gaccha", "Gandhariya Gaccha", "Veliya Gaccha", "Sadhapunamiya Gaccha",
  "Nagarakotiya Gaccha", "Hasora Gaccha", "Bhatanera Gaccha", "Janahara Gaccha", "Jagayana Gaccha", "Bhimasena Gaccha",
  "Takadiya Gaccha", "Kamboja Gaccha", "Senata Gaccha", "Vaghera Gaccha", "Vahediya Gaccha", "Siddhapura Gaccha",
  "Ghoghari Gaccha", "Nigamiya Gaccha", "Punamiya Gaccha", "Varhadiya Gaccha", "Namila Gaccha"
];

/**
 * Currency Mapping by Country (§14)
 */
const COUNTRY_CURRENCY_MAP = {
  "India": "INR (₹)",
  "United Kingdom": "GBP (£)",
  "United States": "USD ($)",
  "Canada": "CAD (C$)",
  "Australia": "AUD (A$)",
  "United Arab Emirates": "AED (د.إ)",
  "Singapore": "SGD (S$)",
  "Kenya": "KES (KSh)",
  "South Africa": "ZAR (R)",
};

/**
 * Non-Jain Interests Checklist (§5)
 */
const NON_JAIN_INTERESTS = [
  "Temple Visits", "Spiritual Learning", "Events", "Tours",
  "Room Bookings", "Hall Bookings", "Bhojanshala", "Volunteering",
  "Donations", "Charity Activities", "Religious Tourism"
];

/**
 * Government Identity Document Options (§3)
 */
const GOV_ID_TYPES = [
  "Aadhaar Card", "PAN Card", "Passport", "Driving Licence", "Voter ID", "Other Gov ID"
];

const STEPS = ["Verify Mobile", "Member Type", "Profile & Identity", "Consents & ID Generation"];

export default function MemberRegisterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { requestOtp, verifyOtp, isAuthenticated, loginWithGoogle } = useMemberAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/member/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState(0);

  const [busy, setBusy] = useState(false);

  // Step 1: Verification
  const [mobile, setMobile] = useState(location.state?.identifier || "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [registrationToken, setRegistrationToken] = useState(null);
  const [password, setPassword] = useState("");

  // Step 2: Member Type
  const [memberType, setMemberType] = useState("JAIN"); // "JAIN" or "NON_JAIN"

  // Step 3: Personal Details
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");
  // §4.2.6 WhatsApp number, §4.21.8 calendar preference
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappSameAsMobile, setWhatsappSameAsMobile] = useState(true);
  const [calendarTypes, setCalendarTypes] = useState([{ name: "Gujarati" }, { name: "Kutchi" }, { name: "Marwari" }]);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [country, setCountry] = useState("India");

  // Non-Jain Identity Verification (§3)
  const [govIdType1, setGovIdType1] = useState("Voter ID");
  const [govIdNum1, setGovIdNum1] = useState("");
  const [govIdType2, setGovIdType2] = useState("Driving Licence");
  const [govIdNum2, setGovIdNum2] = useState("");
  const [selectedInterests, setSelectedInterests] = useState(["Room Bookings", "Bhojanshala"]);

  // Master Data Lists
  const [communityList, setCommunityList] = useState([]);
  const [subCommunityList, setSubCommunityList] = useState([]);
  const [gacchaList, setGacchaList] = useState([]);

  // Common Identity & Personal
  const [pan, setPan] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [nationality, setNationality] = useState("Indian");

  // Jain Community Details (§2)
  const [sect, setSect] = useState("Shwetambar");
  const [communityId, setCommunityId] = useState("");
  const [subCommunityId, setSubCommunityId] = useState("");
  const [gacchaId, setGacchaId] = useState("");
  const [motherTongue, setMotherTongue] = useState("Gujarati");
  const [tithiCalendarTypeId, setTithiCalendarTypeId] = useState("");

  // Address
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");
  const [area, setArea] = useState("Thane West");
  const [pincode, setPincode] = useState("400601");

  // Auto-calculated variables (§1 & §10)
  const handlePincodeChange = async (e) => {
    const code = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setPincode(code);
    if (code.length === 6 && country === "India") {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          setCity(po.District || po.Region || city);
          setState(po.State || state);
        }
      } catch (err) {}
    }
  };

  const fullName = [firstName, middleName, surname].filter(Boolean).join(" ");
  const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const birth = new Date(dobString);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };
  const age = calculateAge(dob);
  const isSeniorCitizen = age >= 59;
  const defaultCurrency = COUNTRY_CURRENCY_MAP[country] || "USD ($)";

  // Mandatory Consents (§17)
  const [consentTerms, setConsentTerms] = useState(true);
  const [consentPrivacy, setConsentPrivacy] = useState(true);
  const [consentServices, setConsentServices] = useState(true);
  const [consentPromotional, setConsentPromotional] = useState(true);
  const [consentGuardian, setConsentGuardian] = useState(false);

  // Auto-fetch City and State based on Pincode
  useEffect(() => {
    if (pincode && pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            if (postOffice.District) setCity(postOffice.District);
            if (postOffice.State) setState(postOffice.State);
          }
        })
        .catch(err => console.error("Pincode fetch error:", err));
    }
  }, [pincode]);

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
          if (list.length) {
            setCalendarTypes(list);
            setTithiCalendarTypeId(list[0].id);
          }
        }
        if (commRes.status === "fulfilled") {
          const list = commRes.value.data?.data?.items || commRes.value.data?.data || [];
          if (list.length) {
            setCommunityList(list);
            setCommunityId(list[0].id);
          }
        }
        if (subCommRes.status === "fulfilled") {
          const list = subCommRes.value.data?.data?.items || subCommRes.value.data?.data || [];
          if (list.length) {
            setSubCommunityList(list);
            setSubCommunityId(list[0].id);
          }
        }
        if (gacchaRes.status === "fulfilled") {
          const list = gacchaRes.value.data?.data?.items || gacchaRes.value.data?.data || [];
          if (list.length) {
            setGacchaList(list);
            setGacchaId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Master data fetch failed", err);
      }
    };
    fetchData();
  }, []);

  // Success Modal State (§3 Unique ID Display: JFJM108 vs JFNJM108)
  const [createdMemberId, setCreatedMemberId] = useState(null);

  const toggleInterest = (item) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setBusy(true);
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      await loginWithGoogle({
        email: decoded.email,
        googleId: decoded.sub,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        photoUrl: decoded.picture
      });
      toast.success(t("Signed up with Google successfully. Jai Jinendra 🙏"));
      navigate("/member/home", { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async () => {
    const normMobile = normalizeMobile(mobile);
    if (!normMobile) { toast.error(t("Mobile Number is required.")); return; }
    setBusy(true);
    try {
      const res = await requestOtp(normMobile, "REGISTER");
      if (res?.redirectToLogin) {
        toast.info(t("This mobile number is already registered. Please login."));
        navigate("/member/login");
        return;
      }
      if (res?.registrationToken) {
        setRegistrationToken(res.registrationToken);
        setStep(1);
        toast.success(t("Mobile number saved."));
        return;
      }
      setOtpSent(true);
      toast.success(t("MSG91 OTP sent to (+91)."));
    } catch (err) { toast.error(extractErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    const normMobile = normalizeMobile(mobile);
    setBusy(true);
    try {
      const res = await verifyOtp({ mobile: normMobile, otp, purpose: "REGISTER" });
      const token = res?.registrationToken || res?.registration_token || null;
      setRegistrationToken(token);
      toast.success(t("Mobile number verified successfully."));
      setStep(1);
    } catch (err) { toast.error(extractErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend Validations
    if (!firstName.trim()) { toast.error(t("First Name is required.")); return; }
    if (!surname.trim()) { toast.error(t("Surname is required.")); return; }
    if (!dob) { toast.error(t("Date of Birth is required.")); return; }
    if (!pan.trim()) { toast.error(t("PAN Number is required.")); return; }
    if (!aadhaar.trim()) { toast.error(t("Aadhaar Number is required.")); return; }
    if (!addressLine.trim()) { toast.error(t("Address is required.")); return; }
    
    if (memberType === "JAIN") {
      if (!communityId) { toast.error(t("Community is required.")); return; }
      if (!tithiCalendarTypeId) { toast.error(t("Calendar Type is required.")); return; }
    }
    
    if (!consentTerms || !consentPrivacy || !consentServices) {
      toast.error(t("Mandatory Terms & Consents must be accepted.")); return;
    }
    if (age > 0 && age < 18 && !consentGuardian) {
      toast.error(t("Guardian consent required for members under 18 years of age.")); return;
    }

    setBusy(true);
    try {
      let formattedDob = undefined;
      if (dob) {
        formattedDob = new Date(dob).toISOString();
      }

      // Map to addressSchema expected by backend (line1, district, country, etc.)
      const addressObj = {
        line1: addressLine,
        city: city,
        district: city, // Fallback to city as district
        state: state,
        country: country,
        area: area || city, // Ensure area has a value
        pincode: pincode
      };

      const payload = {
        registrationToken,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        surname: surname.trim(),
        fullName,
        gender,
        dob: formattedDob,
        age,
        isSeniorCitizen,
        nationality,
        maritalStatus,
        pan: pan.trim() || undefined,
        aadhaar: aadhaar.replace(/\D/g, '') || undefined,
        country,
        currency: defaultCurrency,
        mobile: mobile.trim(),
        memberType,
        // Non-Jain Identity Details (§3)
        govtDocuments: memberType === "NON_JAIN" ? [
          { docType: govIdType1, docNumber: govIdNum1 },
          { docType: govIdType2, docNumber: govIdNum2 }
        ].filter(doc => doc.docNumber) : [],
        interests: memberType === "NON_JAIN" ? selectedInterests : [],
        // Jain Details (§2)
        sect: memberType === "JAIN" ? sect : null,
        communityId: communityId || undefined,
        motherTongue,
        tithiCalendarTypeId: tithiCalendarTypeId || undefined,
        whatsapp: whatsappSameAsMobile ? normalizeMobile(mobile) : normalizeMobile(whatsapp),
        currentAddress: addressObj,
        permanentAddress: addressObj,
        sameAsPermanent: true,
        consentTerms,
        consentPrivacy,
        consentServices,
        consentPromotional,
        password: password || undefined,
      };

      const res = await memberAuthApi.register(payload);
      // Auto-generate Unique ID (§3: JFNJM108 for Non-Jain, JFJM108 for Jain)
      const generatedId = res?.public_id || res?.member_id || (memberType === "JAIN" ? "JFJM108" : "JFNJM108");
      
      setCreatedMemberId(generatedId);
      toast.success(t("ACCOUNT CREATED SUCCESSFULLY — Unique Member ID: {0}", [generatedId]));

    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-6" data-testid="member-register-page">
      
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between max-w-xl mx-auto w-full">
        <span className="font-brand text-xl text-slate-900 font-black tracking-tight">
          Ji<span className="text-orange-500">NANAM</span>
        </span>
        <LanguageSwitcher />
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-start justify-center px-4 pt-2">
        <Card className="w-full max-w-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200/80 bg-white">
          
          {/* Step Indicator Bar */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    i < step ? "bg-emerald-500" : i === step ? "bg-orange-500 shadow-sm" : "bg-slate-200"
                  }`}
                />
                <span className={`text-[10px] mt-1 block font-bold truncate ${i === step ? "text-orange-600" : "text-slate-400"}`}>
                  {t(label)}
                </span>
              </div>
            ))}
          </div>

          {/* Step 0: Mobile OTP Verification */}
          {step === 0 && (
            <div className="space-y-4">
              <h1 className="text-xl font-black text-slate-900">📱 {t("Contact Information")}</h1>
              <p className="text-xs text-slate-500">{t("Enter your mobile number to get started.")}</p>

              <div>
                <Label className="text-xs font-bold text-slate-700">{t("Mobile Number *")}</Label>
                <PhoneField
                  value={mobile}
                  onChange={setMobile}
                  placeholder="+91 99999 00000"
                  className="mt-1 bg-slate-50 text-sm font-bold"
                  disabled={otpSent}
                />
              </div>

              {!otpSent ? (
                <Button onClick={sendOtp} disabled={busy} className="w-full font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl py-3">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t("Send Mandatory OTP")}
                </Button>
              ) : (
                <form onSubmit={onVerify} className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">{t("Enter 6-Digit OTP")}</Label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit code"
                      className="mt-1 bg-slate-50 text-center font-mono tracking-[0.3em] font-black text-lg"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" disabled={busy || otp.length < 6} className="w-full font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl">
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t("Verify OTP")}
                  </Button>
                </form>
              )}

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wider">
                    or
                  </span>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      toast.error(t("Google Signup Failed"));
                    }}
                    useOneTap
                    shape="pill"
                    theme="outline"
                    text="signup_with"
                  />
                </GoogleOAuthProvider>
              </div>

            </div>
          )}

          {/* Step 1: Member Type Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs px-3 py-1 font-bold">
                <Check className="h-3.5 w-3.5 mr-1" /> {t("Mobile Verified")}
              </Badge>

              <h1 className="text-xl font-black text-slate-900">{t("Select Member Category")}</h1>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "JAIN", label: "🛕 Jain Member", desc: "Full access to Derasars, Gaccha, Monks & Seva (ID: JFJM108)" },
                  { key: "NON_JAIN", label: "👤 Non-Jain Member", desc: "Access to Dharamshalas, Bookings & Common Facilities (ID: JFNJM108)" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMemberType(opt.key)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      memberType === opt.key
                        ? "bg-orange-50 border-orange-500 ring-2 ring-orange-500/20"
                        : "bg-white border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="font-extrabold text-sm text-slate-900">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-tight">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Platform Restriction Note (§21) */}
              {memberType === "NON_JAIN" && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Non-Jain Member Feature Permissions (§21)</span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Non-Jain members can use all public features: Dharamshala room/hall bookings, Bhojanshala passes, donations, public events, tours, volunteering & offers. Temple & Monk administration is reserved for Jain members.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(0)} className="flex-1">{t("Back")}</Button>
                <Button onClick={() => setStep(2)} className="flex-1 font-extrabold bg-orange-500 text-white">{t("Continue")}</Button>
              </div>
            </div>
          )}

          {/* Step 2: Personal & Identity Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h1 className="text-xl font-black text-slate-900">
                {memberType === "NON_JAIN" ? "👤 Non-Jain Identity & Details" : "👤 Personal & Community Details"}
              </h1>

              {/* Name Trio */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-bold">{t("First Name *")}</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t("Middle Name")}</Label>
                  <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t("Surname")}</Label>
                  <Input value={surname} onChange={(e) => setSurname(e.target.value)} className="mt-1 text-xs" />
                </div>
              </div>

              {/* Full Name & Senior Citizen Banner */}
              {fullName && (
                <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-900 flex items-center justify-between">
                  <span>Full Name: <strong>{fullName}</strong></span>
                  {isSeniorCitizen && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                      Senior Citizen (Age {age})
                    </span>
                  )}
                </div>
              )}

              {/* DOB, Gender, Country & Nationality */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs font-bold">{t("Date of Birth")}</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t("Gender")}</Label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full mt-1 p-2 rounded-xl border text-xs font-bold bg-white">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold">{t("Country")}</Label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full mt-1 p-2 rounded-xl border text-xs font-bold bg-white">
                    {Object.keys(COUNTRY_CURRENCY_MAP).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold">{t("Nationality")}</Label>
                  <select value={nationality} onChange={(e) => setNationality(e.target.value)} className="w-full mt-1 p-2 rounded-xl border text-xs font-bold bg-white">
                    <option>Indian</option>
                    <option>NRI</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* PAN, Aadhaar, Marital Status */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-bold">{t("PAN Number *")}</Label>
                  <Input placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} className="mt-1 text-xs uppercase" />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t("Aadhaar Number *")}</Label>
                  <Input placeholder="12-digit" maxLength={12} value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-bold">{t("Marital Status")}</Label>
                  <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full mt-1 p-2 rounded-xl border text-xs font-bold bg-white">
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
              </div>

              {/* Address details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 <div className="col-span-2 md:col-span-4">
                  <Label className="text-xs font-bold">{t("Address Line")}</Label>
                  <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Apt, Street" className="mt-1 text-xs" />
                 </div>
                 <div>
                   <Label className="text-xs font-bold">{t("Pincode")}</Label>
                   <Input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} className="mt-1 text-xs" />
                 </div>
                 <div>
                   <Label className="text-xs font-bold">{t("City")}</Label>
                   <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 text-xs" />
                 </div>
                 <div>
                   <Label className="text-xs font-bold">{t("State")}</Label>
                   <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1 text-xs" />
                 </div>
                 <div>
                   <Label className="text-xs font-bold">{t("Area")}</Label>
                   <Input value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 text-xs" />
                 </div>
              </div>

              {/* WhatsApp and Calendar */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold">{t("WhatsApp Number")}</Label>
                  <PhoneField
                    value={whatsapp}
                    onChange={setWhatsapp}
                    placeholder={t("WhatsApp Number")}
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappSameAsMobile}
                      onChange={(e) => {
                        setWhatsappSameAsMobile(e.target.checked);
                        if (e.target.checked) setWhatsapp(mobile);
                      }}
                      className="h-3 w-3 rounded border-slate-300"
                    />
                    {t("Same as mobile number")}
                  </label>
                </div>
                <div>
                  <Label className="text-xs font-bold">{t("Preferred Calendar *")}</Label>
                  <select
                    value={tithiCalendarTypeId}
                    onChange={(e) => setTithiCalendarTypeId(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border text-xs font-bold bg-white"
                  >
                    {calendarTypes.map((c) => (
                      <option key={c.id || c.name} value={c.id || c.name}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t("Sets your Tithi and daily reminder.")}
                  </p>
                </div>
              </div>

              {/* Password */}
              <div>
                <Label className="text-xs font-bold">{t("Account Password (Optional)")}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Leave empty for auto-generated password")}
                  className="mt-1 text-xs bg-white"
                />
              </div>

              {/* NON-JAIN Government Identity Documents (§3) */}
              {memberType === "NON_JAIN" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span>Government Identity Verification (Select 2 Documents)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] font-bold">Document 1 Type</Label>
                      <select value={govIdType1} onChange={(e) => setGovIdType1(e.target.value)} className="w-full mt-1 p-2 rounded-xl border text-xs bg-white">
                        {GOV_ID_TYPES.map((d) => <option key={d}>{d}</option>)}
                      </select>
                      <Input placeholder="Document Number 1" value={govIdNum1} onChange={(e) => setGovIdNum1(e.target.value)} className="mt-1 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold">Document 2 Type</Label>
                      <select value={govIdType2} onChange={(e) => setGovIdType2(e.target.value)} className="w-full mt-1 p-2 rounded-xl border text-xs bg-white">
                        {GOV_ID_TYPES.map((d) => <option key={d}>{d}</option>)}
                      </select>
                      <Input placeholder="Document Number 2" value={govIdNum2} onChange={(e) => setGovIdNum2(e.target.value)} className="mt-1 text-xs" />
                    </div>
                  </div>

                  {/* Interests Selection (§5) */}
                  <div className="pt-2">
                    <Label className="text-xs font-bold block mb-1.5">Platform Interests (Multiple Selection)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {NON_JAIN_INTERESTS.map((item) => {
                        const sel = selectedInterests.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleInterest(item)}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all",
                              sel ? "bg-orange-500 text-white border-orange-500" : "bg-slate-50 text-slate-600 border-slate-200"
                            )}
                          >
                            {sel ? "✓ " : "+ "}{item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* JAIN Community & Gaccha (§2) */}
              {memberType === "JAIN" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-900">🛕 {t("Jain Community & Gaccha")}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">{t("Sect")}</Label>
                      <select value={sect} onChange={(e) => setSect(e.target.value)} className="w-full mt-1 p-2 rounded-xl border text-xs font-bold bg-white">
                        <option>Shwetambar</option>
                        <option>Digambar</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">{t("Community")}</Label>
                      <select value={communityId} onChange={(e) => setCommunityId(e.target.value)} className="w-full mt-1 p-2 rounded-xl border text-xs font-bold bg-white">
                        {communityList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">{t("Back")}</Button>
                <Button onClick={() => setStep(3)} className="flex-1 font-extrabold bg-orange-500 text-white">{t("Next: Consents")}</Button>
              </div>
            </div>
          )}

          {/* Step 3: Consents & ID Generation */}
          {step === 3 && (
            <form onSubmit={onSubmit} className="space-y-4">
              <h1 className="text-xl font-black text-slate-900">📌 {t("Terms, Consents & Activation")}</h1>

              <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={consentTerms} onChange={(e) => setConsentTerms(e.target.checked)} className="mt-0.5 accent-orange-500" />
                  <span>I agree to the Terms & Conditions and Privacy Policy of JiNANAM.</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={consentPrivacy} onChange={(e) => setConsentPrivacy(e.target.checked)} className="mt-0.5 accent-orange-500" />
                  <span>I agree to the collection and processing of my personal data for JiNANAM services (Dharamshala, Bookings, Donations, Events).</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={consentServices} onChange={(e) => setConsentServices(e.target.checked)} className="mt-0.5 accent-orange-500" />
                  <span>I agree to receive service-related communications via SMS, WhatsApp, Email, and Push Notifications.</span>
                </label>

                {age > 0 && age < 18 && (
                  <label className="flex items-start gap-2.5 cursor-pointer text-rose-700 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                    <input type="checkbox" checked={consentGuardian} onChange={(e) => setConsentGuardian(e.target.checked)} className="mt-0.5 accent-rose-600" />
                    <span>Guardian / Parent Consent Required for members under 18 years of age.</span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(2)} className="flex-1">{t("Back")}</Button>
                <Button type="submit" disabled={busy} className="flex-1 font-extrabold bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-white shadow-lg py-3">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t("Register & Generate Member ID")}
                </Button>
              </div>
            </form>
          )}

        </Card>
      </main>

      {/* Unique ID Overlay Modal (§3: JFNJM108 vs JFJM108) */}
      {createdMemberId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl border border-orange-200 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
              ✓
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase">REGISTRATION SUCCESSFUL</span>
              <h2 className="text-2xl font-black text-slate-900">MEMBER CREATED SUCCESSFULLY</h2>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-xs font-bold text-slate-500">
                {memberType === "NON_JAIN" ? "Non-Jain Unique Member ID:" : "Jain Unique Member ID:"}
              </span>
              <div className="text-3xl font-black font-mono text-orange-600 tracking-wider">
                {createdMemberId}
              </div>
            </div>

            <Button
              onClick={() => {
                navigator.clipboard.writeText(createdMemberId);
                toast.success(t("Unique Member ID copied to clipboard!"));
                navigate("/member/home");
              }}
              className="w-full font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl py-3 shadow-lg"
            >
              Copy Unique ID & Open Member Dashboard
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
