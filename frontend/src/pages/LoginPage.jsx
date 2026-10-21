import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Phone, Lock, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { extractErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { PhoneField } from "@/components/common/PhoneInput";

export default function LoginPage() {
  const { t } = useLanguage();
  const {
    loginWithPassword,
    requestOtp,
    verifyOtp,
    requestEmailOtp,
    verifyEmailOtp,
    loginWithEmailPassword,
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin/dashboard";

  const [mode, setMode] = useState("password"); // Default to Password
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mobile.includes("@")) {
        await loginWithEmailPassword({ email: mobile, password });
      } else {
        await loginWithPassword({ mobile, password });
      }
      toast.success(t("Welcome back!"));
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onRequestOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await requestOtp(mobile);
      setOtpSent(true);
      if (res?.devOtp) {
        toast.info(`DEV OTP Code: ${res.devOtp}`, { duration: 10000 });
      } else {
        toast.success(t("MSG91 OTP sent to your Indian mobile number (+91)."));
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp({ mobile, otp });
      toast.success(t("Signed in successfully."));
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onRequestEmailOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await requestEmailOtp(email);
      setEmailOtpSent(true);
      if (res?.devOtp) {
        toast.info(`DEV Email OTP Code: ${res.devOtp}`, { duration: 10000 });
      } else {
        toast.success(t("Verification OTP sent to your Email address."));
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyEmailOtp({ email, otp });
      toast.success(t("Email verified. Signed in successfully."));
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden p-1">
              <img src="/logo.png" alt={t("JiNANAM Logo")} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-brand text-2xl leading-none">{t("JiNANAM")}</div>
              <div className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mt-1">
                {t("Admin & Member Portal")}
              </div>
            </div>
          </div>

          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {t("Welcome back.")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t("Choose your preferred authentication method to continue.")}
          </p>

          <Card className="mt-8 p-6 rounded-md border-border space-y-6">
            <Tabs value={mode} onValueChange={(m) => { setMode(m); setError(""); }}>
              <TabsList className="hidden mb-6">
                <TabsTrigger value="otp" data-testid="login-tab-otp" className="text-xs">
                  📱 {t("Mobile OTP")}
                </TabsTrigger>
                <TabsTrigger value="email" data-testid="login-tab-email" className="text-xs">
                  📧 {t("Email OTP")}
                </TabsTrigger>
                <TabsTrigger value="password" data-testid="login-tab-password" className="text-xs">
                  🔒 {t("Password")}
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: MSG91 Mobile OTP (+91 India) */}
              <TabsContent value="otp">
                <form onSubmit={otpSent ? onVerifyOtp : (e) => { e.preventDefault(); onRequestOtp(); }} className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                    🇮🇳 <strong>MSG91 SMS OTP</strong> is configured for Indian (+91) mobile numbers to optimize messaging costs.
                  </div>
                  <div>
                    <Label htmlFor="mobile-otp" className="text-xs font-medium">
                      {t("Indian Mobile Number (+91)")}
                    </Label>
                    <div className="mt-1">
                      <PhoneField
                        id="mobile-otp"
                        value={mobile}
                        onChange={setMobile}
                        placeholder={t("90000 00001")}
                        disabled={otpSent}
                        required
                        data-testid="login-otp-mobile-input"
                      />
                    </div>
                  </div>
                  {otpSent && (
                    <div>
                      <Label htmlFor="otp" className="text-xs font-medium">
                        {t("One-Time Password (OTP)")}
                      </Label>
                      <div className="relative mt-1">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="otp"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder={t("6-digit code")}
                          className="pl-9 tracking-widest font-mono"
                          maxLength={6}
                          required
                          data-testid="login-otp-code-input"
                        />
                      </div>
                    </div>
                  )}
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                    disabled={loading}
                    data-testid={otpSent ? "login-otp-verify-button" : "login-otp-request-button"}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {otpSent ? t("Verify & Sign In") : t("Send MSG91 Mobile OTP")}
                  </Button>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      {t("Change mobile number")}
                    </button>
                  )}
                </form>
              </TabsContent>

              {/* Tab 2: Email OTP / International Authentication */}
              <TabsContent value="email">
                <form onSubmit={emailOtpSent ? onVerifyEmailOtp : (e) => { e.preventDefault(); onRequestEmailOtp(); }} className="space-y-4">
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 text-xs">
                    🌐 <strong>International & Email Login:</strong> Recommended for users outside India or non-+91 numbers to avoid international SMS charges.
                  </div>
                  <div>
                    <Label htmlFor="email-input" className="text-xs font-medium">
                      {t("Email Address")}
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@domain.com"
                        className="bg-white"
                        disabled={emailOtpSent}
                        required
                      />
                    </div>
                  </div>
                  {emailOtpSent && (
                    <div>
                      <Label htmlFor="email-otp-input" className="text-xs font-medium">
                        {t("Email Verification Code")}
                      </Label>
                      <div className="relative mt-1">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email-otp-input"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder={t("6-digit email code")}
                          className="pl-9 tracking-widest font-mono"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>
                  )}
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-10 bg-sky-600 hover:bg-sky-700 text-white font-bold"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {emailOtpSent ? t("Verify Email Code") : t("Send Email Verification OTP")}
                  </Button>
                  {emailOtpSent && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailOtpSent(false);
                        setOtp("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      {t("Change email address")}
                    </button>
                  )}
                </form>
              </TabsContent>

              {/* Tab 3: Password Authentication (Admin & Staff) */}
              <TabsContent value="password">
                <form onSubmit={onPasswordSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="mobile-pw" className="text-xs font-medium">
                      {t("Mobile Number or Email")}
                    </Label>
                    <div className="mt-1">
                      <PhoneField
                        id="mobile-pw"
                        value={mobile}
                        onChange={setMobile}
                        placeholder={t("90000 00001")}
                        required
                        data-testid="login-mobile-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-xs font-medium">
                      {t("Password")}
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("Your password")}
                        className="pl-9"
                        required
                        data-testid="login-password-input"
                      />
                    </div>
                  </div>
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-10"
                    disabled={loading}
                    data-testid="login-submit-button"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("Sign In with Password")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

          </Card>

          <p className="text-[11px] text-muted-foreground text-center mt-6">
            {t("By signing in you agree to our terms of use and privacy policy.")}
          </p>
        </div>
      </div>

      {/* Right: Hero */}
      <div className="hidden lg:block relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524443169398-9aa1ceab67d5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwxfHxqYWluJTIwdGVtcGxlJTIwYXJjaGl0ZWN0dXJlJTIwcGVhY2VmdWx8ZW58MHx8fHwxNzgzMzM1OTQ4fDA&ixlib=rb-4.1.0&q=85"
          alt={t("Jain temple")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 login-hero-overlay" />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <div className="text-[11px] tracking-[0.28em] uppercase text-white/80 mb-3">
            {t("Serving the Jain community")}
          </div>
          <h2 className="font-brand text-4xl xl:text-5xl leading-tight mb-4">
            {t("One platform. Every temple, monk & seva — beautifully organised.")}
          </h2>
          <p className="text-white/85 text-sm max-w-md leading-relaxed">
            {t("Bookings, donations, events, tracking and reports for temples, dharamshalas & Jain centers — all in one refined admin experience.")}
          </p>
          <div className="mt-8 flex items-center gap-6 text-xs text-white/80">
            <div>
              <div className="font-mono-num text-2xl text-white">83</div>
              <div className="uppercase tracking-widest text-[10px]">{t("Gacchas")}</div>
            </div>
            <div>
              <div className="font-mono-num text-2xl text-white">23</div>
              <div className="uppercase tracking-widest text-[10px]">{t("Tirthankaras")}</div>
            </div>
            <div>
              <div className="font-mono-num text-2xl text-white">11</div>
              <div className="uppercase tracking-widest text-[10px]">{t("Roles")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
