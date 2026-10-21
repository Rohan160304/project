import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, extractErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, User, Building, Activity, ShieldAlert,
  Clock, MapPin, Mail, Phone, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileViewSwitcher } from "@/components/common/ProfileViewSwitcher";

export default function AdminProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Activities (Audit Logs)
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchAdminDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === "activity" && logs.length === 0) {
      fetchAdminActivity();
    }
  }, [activeTab]);

  const fetchAdminDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auth/admins/${id}`);
      setAdmin(res.data?.data);
    } catch (e) {
      toast.error(t("Failed to load admin profile."));
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminActivity = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get(`/audit-logs?userId=${id}&pageSize=50`);
      setLogs(res.data?.data || []);
    } catch (e) {
      toast.error(t("Failed to load admin activity."));
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Card className="p-6 h-64"><Skeleton className="h-full w-full" /></Card>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-700">{t("Admin not found")}</h2>
        <Button onClick={() => navigate("/admin/admins")} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("Back to Directory")}
        </Button>
      </div>
    );
  }

  const member = admin.member;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title={t("Admin Profile")}
          subtitle={t("View detailed information, managed organizations, and activity logs.")}
        />
        <div className="flex items-center gap-4">
          <ProfileViewSwitcher 
            currentView="admin" 
            publicId={admin.publicId} 
            userId={admin.id}
            hasAdminAccess={true}
          />
          <Button variant="outline" onClick={() => navigate("/admin/admins")} className="text-slate-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("Back")}
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card className="p-6 rounded-2xl border-border bg-white shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
          {member?.photoUrl ? (
            <img src={member.photoUrl} alt="Admin Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-slate-400" />
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold text-slate-800">
            {admin.firstName} {admin.lastName || ""}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              {admin.primaryRoleKey?.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className={admin.status === "ACTIVE" ? "text-emerald-600 border-emerald-200" : "text-rose-600 border-rose-200"}>
              {admin.status}
            </Badge>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 font-medium">
          <div>{t("Admin ID")}: <span className="font-mono text-slate-700">{admin.publicId}</span></div>
          <div className="mt-1">{t("Registered")}: {formatDateTime(admin.createdAt)}</div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" /> {t("Member Details")}
          </TabsTrigger>
          <TabsTrigger value="organizations">
            <Building className="h-4 w-4 mr-2" /> {t("Managed Organizations")}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" /> {t("Activity Logs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6 bg-white shadow-sm border-border">
            <h3 className="font-heading text-lg font-semibold text-slate-800 mb-4 border-b pb-2">{t("Personal Information")}</h3>
            
            {member ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded text-slate-400"><Phone className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t("Mobile Number")}</p>
                      <p className="text-sm font-medium text-slate-800">{admin.mobile || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded text-slate-400"><Mail className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t("Email Address")}</p>
                      <p className="text-sm font-medium text-slate-800">{admin.email || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded text-slate-400"><Calendar className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t("Date of Birth")}</p>
                      <p className="text-sm font-medium text-slate-800">{member.dateOfBirth ? formatDateTime(member.dateOfBirth).split(',')[0] : "-"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded text-slate-400"><MapPin className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t("City / Location")}</p>
                      <p className="text-sm font-medium text-slate-800">{member.city || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded text-slate-400"><MapPin className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t("Full Address")}</p>
                      <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{member.fullAddress || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-3">
                <ShieldAlert className="h-10 w-10 text-orange-200" />
                <p>{t("No detailed member profile linked to this admin account.")}</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="organizations">
          <Card className="p-6 bg-white shadow-sm border-border">
            <h3 className="font-heading text-lg font-semibold text-slate-800 mb-4 border-b pb-2">{t("Scoped Organizations")}</h3>
            
            {admin.primaryRoleKey === "MONK_ADMIN" || admin.primaryRoleKey === "SUPER_ADMIN" ? (
              <div className="py-10 text-center text-slate-500">
                {t("This admin role has Global Access. They are not restricted to specific organizations.")}
              </div>
            ) : (admin.userOrganizations || []).length === 0 ? (
              <div className="py-10 text-center text-rose-500 font-medium">
                {t("This admin currently has NO active organization scopes.")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {admin.userOrganizations.map((uo) => (
                  <div key={uo.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:border-orange-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] bg-white text-slate-600 border-slate-200">
                          {uo.organization?.type}
                        </Badge>
                        <h4 className="font-bold text-slate-800 leading-tight pt-1">
                          {uo.organization?.name || uo.organizationId}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {uo.organization?.city || "Unknown City"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-6 bg-white shadow-sm border-border">
            <h3 className="font-heading text-lg font-semibold text-slate-800 mb-4 border-b pb-2">{t("Recent Activity & Audit Logs")}</h3>
            
            {loadingLogs ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                {t("No activity logs found for this administrator.")}
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="mt-1">
                      <div className={`p-2 rounded-full ${log.isCritical ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-700">
                            {log.module}
                          </Badge>
                          <span className="text-sm font-bold text-slate-700">{log.action}</span>
                          <span className="text-sm text-slate-500">{log.entityType}</span>
                        </div>
                        <div className="flex items-center text-[10px] text-slate-400 gap-1 font-medium">
                          <Clock className="h-3 w-3" /> {formatDateTime(log.createdAt)}
                        </div>
                      </div>
                      
                      {/* Optional Context details */}
                      <div className="mt-2 text-xs text-slate-600 font-mono bg-white p-2 rounded border border-slate-100 overflow-x-auto">
                        <span className="font-semibold text-slate-400">ID:</span> {log.entityId}
                        {log.ip && <span className="ml-4"><span className="font-semibold text-slate-400">IP:</span> {log.ip}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
