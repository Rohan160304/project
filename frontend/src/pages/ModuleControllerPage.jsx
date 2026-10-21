import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, extractErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { PLATFORM_MODULES } from "@/lib/access";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Save, Building2, UserPlus } from "lucide-react";
import { DelegateModuleModal } from "@/components/modals/DelegateModuleModal";

export default function ModuleControllerPage() {
  const { user, isSuperAdmin, canEdit, canDo, organizations: authOrgs } = useAuth();
  const { t } = useLanguage();
  
  const hasEditAccess = isSuperAdmin || ["TEMPLES", "DHARAMSHALAS", "JAIN_CENTERS", "STHANAKS", "BHOJANSHALAS", "COMMUNITY_PAGES"].some(m => canEdit(m));
  
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [activeModules, setActiveModules] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState("all");
  
  const [delegateModalOpen, setDelegateModalOpen] = useState(false);
  const [delegateModuleKey, setDelegateModuleKey] = useState(null);

  useEffect(() => {
    fetchOrganizations();
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      const res = await api.get("/auth/admins");
      setAdmins(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load admins", err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      let allOrgs = [];

      if (isSuperAdmin) {
        // Super admin sees all organizations globally
        const [templesRes, dharamshalasRes, jainCentersRes] = await Promise.all([
          api.get("/temples").catch(() => ({ data: { data: [] } })),
          api.get("/dharamshalas").catch(() => ({ data: { data: [] } })),
          api.get("/jain-centers").catch(() => ({ data: { data: [] } }))
        ]);
        
        const t = templesRes.data?.data?.items || templesRes.data?.data || [];
        const d = dharamshalasRes.data?.data?.items || dharamshalasRes.data?.data || [];
        const j = jainCentersRes.data?.data?.items || jainCentersRes.data?.data || [];
        
        allOrgs = [...t, ...d, ...j];
      } else {
        // Scoped admins use their pre-fetched organizations from AuthContext
        allOrgs = authOrgs || [];
      }
      
      setOrgs(allOrgs);
      if (allOrgs.length > 0) {
        setSelectedOrgId(allOrgs[0].id || allOrgs[0]._id);
        let initialModules = allOrgs[0].activeModules;
        if (!initialModules || initialModules.length === 0) {
          initialModules = [];
        } else if (initialModules.length === 1 && initialModules[0] === "NONE") {
          initialModules = [];
        }
        setActiveModules(new Set(initialModules || []));
      }
    } catch (err) {
      toast.error(t("Failed to load organizations"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (orgId) => {
    setSelectedOrgId(orgId);
    const org = orgs.find(o => (o.id === orgId || o._id === orgId));
    if (org) {
      const initialModules = org.activeModules;
      if (!initialModules || initialModules.length === 0) {
        setActiveModules(new Set());
      } else if (initialModules.length === 1 && initialModules[0] === "NONE") {
        setActiveModules(new Set());
      } else {
        setActiveModules(new Set(initialModules));
      }
    }
  };

  const handleAdminChange = (adminId) => {
    setSelectedAdminId(adminId);
    const admin = admins.find(a => a.id === adminId);
    const newFiltered = adminId === "all" ? orgs : orgs.filter(org => {
      return admin?.userOrganizations?.some(uo => uo.organizationId === (org.id || org._id));
    });
    
    if (newFiltered.length > 0) {
      handleOrgChange(newFiltered[0].id || newFiltered[0]._id);
    } else {
      setSelectedOrgId("");
      setActiveModules(new Set());
    }
  };

  const filteredOrgs = selectedAdminId === "all" ? orgs : orgs.filter(org => {
    const admin = admins.find(a => a.id === selectedAdminId);
    if (!admin) return true;
    return admin.userOrganizations?.some(uo => uo.organizationId === (org.id || org._id));
  });

  const fetchOrgStaff = async (orgId) => {
    try {
      const res = await api.get(`/auth/admins/org/${orgId}`);
      setStaffList(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch staff list", err);
    }
  };

  useEffect(() => {
    if (selectedOrgId) {
      fetchOrgStaff(selectedOrgId);
    }
  }, [selectedOrgId]);

  const toggleModule = (moduleKey) => {
    setActiveModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedOrgId) return;
    try {
      setSaving(true);
      const org = orgs.find(o => (o.id === selectedOrgId || o._id === selectedOrgId));
      
      let endpointPrefix = "temples";
      if (org?.type === "DHARAMSHALA") endpointPrefix = "dharamshalas";
      else if (org?.type === "JAIN_CENTER") endpointPrefix = "jain-centers";
      else if (org?.type === "BHOJANSHALA") endpointPrefix = "bhojanshalas";
      
      const endpoint = `/${endpointPrefix}/${selectedOrgId}/modules`;
      
      await api.patch(endpoint, {
        activeModules: activeModules.size === 0 ? ["NONE"] : Array.from(activeModules)
      });
      
      toast.success(t("Modules updated successfully"));
      
      // Update local state
      setOrgs(prev => prev.map(o => {
        if (o.id === selectedOrgId || o._id === selectedOrgId) {
          return { ...o, activeModules: Array.from(activeModules) };
        }
        return o;
      }));
      
      // Notify Sidebar to refresh optimistically
      window.dispatchEvent(new CustomEvent("jinanam_modules_optimistic_update", {
        detail: {
          updatedOrgId: selectedOrgId,
          activeModules: Array.from(activeModules)
        }
      }));
    } catch (err) {
      toast.error(extractErrorMessage(err) || t("Failed to update modules"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><span className="text-sm text-slate-500">Loading...</span></div>;
  }

  const selectedOrg = orgs.find(o => (o.id === selectedOrgId || o._id === selectedOrgId));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 relative">
      <div className="sticky top-16 md:top-20 z-20 bg-slate-50/90 backdrop-blur-md pb-4 pt-6 -mt-6 -mx-6 px-6 border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t("Module Controller")}</h1>
            <p className="text-sm text-slate-500">{t("Enable or disable specific modules for your organization.")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {isSuperAdmin && admins.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedAdminId} onValueChange={handleAdminChange}>
                <SelectTrigger className="w-full sm:w-[200px] bg-white">
                  <SelectValue placeholder={t("All Admins")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Admins")}</SelectItem>
                  {admins.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredOrgs.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Building2 className="w-4 h-4 text-slate-400 hidden sm:block" />
              <Select value={selectedOrgId} onValueChange={handleOrgChange}>
                <SelectTrigger className="w-full sm:w-[250px] bg-white">
                  <SelectValue placeholder={t("Select...")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredOrgs.map(org => (
                    <SelectItem key={org.id || org._id} value={org.id || org._id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving || filteredOrgs.length === 0} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
            <Save className="w-4 h-4 mr-2" />
            {saving ? t("Saving...") : t("Save Configuration")}
          </Button>
        </div>
      </div>

      <Card className="p-6 border-slate-200 shadow-sm space-y-6">
        {filteredOrgs.length > 0 ? (
          <>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{t("Active Modules")}</h3>
                  <p className="text-sm text-slate-500">
                    {t("Selected modules will be visible in the sidebar for this organization's staff.")}
                  </p>
                </div>
              </div>
              
              {/* Note: Physical facilities validation is handled in Sidebar.jsx. Here we just let them toggle what they want. */}
              <div className="grid grid-cols-1 gap-4">
                {PLATFORM_MODULES.filter(mod => {
                  // Filter by selected admin if one is selected
                  if (selectedAdminId !== "all") {
                    const admin = admins.find(a => a.id === selectedAdminId);
                    if (admin) {
                      const isSa = admin.primaryRoleKey === "SUPER_ADMIN" || admin.grantedModules?.includes("*");
                      if (!isSa && !admin.grantedModules?.includes(mod.key)) {
                        return false;
                      }
                    }
                  }
                  
                  // Filter by current user permissions
                  if (!isSuperAdmin && !canDo(mod.key, "VIEW")) return false;

                  return true;
                }).map((mod) => {
                  const moduleStaff = staffList.filter(s => s.modules && s.modules[mod.key]);
                  
                  return (
                    <div key={mod.key} className="flex flex-col p-4 rounded-md border border-slate-200 bg-white shadow-sm hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={`mod-${mod.key}`}
                            checked={activeModules.has(mod.key)}
                            onCheckedChange={() => toggleModule(mod.key)}
                            className="mt-1"
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              htmlFor={`mod-${mod.key}`}
                              className="text-base font-semibold text-slate-800 cursor-pointer"
                            >
                              {t(mod.label)}
                            </Label>
                            <p className="text-sm text-slate-500">
                              {t(mod.category)}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            setDelegateModuleKey(mod.key);
                            setDelegateModalOpen(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {t("Create Staff")}
                        </Button>
                      </div>

                      {/* Staff List for this Module */}
                      {moduleStaff.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 pl-8 space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("Assigned Staff")}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {moduleStaff.map(staff => (
                              <div key={staff.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-md">
                                <div>
                                  <p className="text-sm font-medium text-slate-700">
                                    {staff.firstName} {staff.lastName || ""}
                                  </p>
                                  <p className="text-xs text-slate-500">{staff.mobile}</p>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  staff.modules[mod.key] === "READ_WRITE" 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-amber-100 text-amber-700"
                                }`}>
                                  {staff.modules[mod.key] === "READ_WRITE" ? "Read & Write" : "Read Only"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500">
            {t("No organizations found. You must be assigned to an organization to manage its modules.")}
          </div>
        )}
      </Card>
      
      {delegateModalOpen && (
        <DelegateModuleModal 
          open={delegateModalOpen}
          onClose={() => setDelegateModalOpen(false)}
          moduleKey={delegateModuleKey}
          orgId={selectedOrgId}
          onSuccess={() => fetchOrgStaff(selectedOrgId)}
        />
      )}
    </div>
  );
}
