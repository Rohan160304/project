import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, extractErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  UsersRound, Save, Trash2, KeyRound, Building,
  PlusCircle, UserCheck, ShieldAlert, X, Edit, Search,
  Mail, MessageSquare, Copy, Sliders, Shield
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { TabPermissionSelector, PLATFORM_MODULE_LIST } from "@/components/common/TabPermissionSelector";
import { grantMapToKeys, toPermissionsPayload, buildGrantMeta } from "@/lib/access";
import MyAccessPanel from "@/components/common/MyAccessPanel";
import { useLanguage } from "@/contexts/LanguageContext";
import { PhoneField } from "@/components/common/PhoneInput";
import MemberLinkSelect from "@/components/common/MemberLinkSelect";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const ADMIN_ROLES = [
  { key: "ORG_ADMIN", label: "Organization Admin" },
  { key: "MONK_ADMIN", label: "Monk Admin" },
];

export default function AdminsPage() {
  const { t } = useLanguage();
  const { isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("directory");
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registration Form state
  const [orgTypeFilter, setOrgTypeFilter] = useState("");
  const [form, setForm] = useState({
    userId: "",
    memberId: "",
    password: "",
    role: "ORG_ADMIN",
    organizationIds: [],
    // Seed with every top-level module at Read+Write. Super Admin can then
    // pare down or reduce specific modules to Read-only in the picker.
    grantedModules: PLATFORM_MODULE_LIST.reduce((acc, m) => {
      acc[m.key] = ["VIEW", "CREATE", "EDIT"];
      return acc;
    }, {}),
  });
  
  // Organization Options list (fetched depending on selected role)
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

  // Scopes editing modal state
  const [editingAdmin, setEditingAdmin] = useState(null); // { id (userId), firstName, role, organizationIds }
  const [editingOrgs, setEditingOrgs] = useState([]);
  const [savingScope, setSavingScope] = useState(false);

  // Profile editing modal state
  const [editingProfileAdmin, setEditingProfileAdmin] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Tab permissions editing modal state.
  // `selectedAdminTabs` now holds the grant-map shape (module → actions[]),
  // e.g. { MEMBERS: ["VIEW","EDIT"], "MEMBERS.JAIN": ["VIEW"] }. Legacy admin
  // records loaded from the API still return string[] which normalizeGrants
  // converts on the fly.
  const [tabAccessAdmin, setTabAccessAdmin] = useState(null);
  const [selectedAdminTabs, setSelectedAdminTabs] = useState({});
  const [loadingTabAccess, setLoadingTabAccess] = useState(false);
  const [savingTabs, setSavingTabs] = useState(false);

  // Newly created admin password popup state
  const [credentialPopup, setCredentialPopup] = useState(null); // { username, password, role }

  // Load admins list
  const fetchAdmins = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const res = await api.get("/auth/admins");
      setAdmins(res.data?.data || []);
    } catch (e) {
      toast.error(t("Failed to fetch administrative accounts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchOrganizations = async (roleKey) => {
    if (roleKey === "MONK_ADMIN") {
      setOrganizations([]);
      return;
    }
    setLoadingOrgs(true);
    
    try {
      const [tRes, dRes, jRes, bRes, pRes, sRes] = await Promise.allSettled([
        api.get("/temples"),
        api.get("/dharamshalas"),
        api.get("/jain-centers"),
        api.get("/bhojanshalas"),
        api.get("/pathshalas"),
        api.get("/sthanaks")
      ]);
      const allOrgs = [];
      if (tRes.status === "fulfilled") allOrgs.push(...(tRes.value.data?.data || []).map(o => ({ ...o, orgType: "TEMPLE" })));
      if (dRes.status === "fulfilled") allOrgs.push(...(dRes.value.data?.data || []).map(o => ({ ...o, orgType: "DHARAMSHALA" })));
      if (jRes.status === "fulfilled") allOrgs.push(...(jRes.value.data?.data || []).map(o => ({ ...o, orgType: "JAIN_CENTER" })));
      if (bRes.status === "fulfilled") allOrgs.push(...(bRes.value.data?.data || []).map(o => ({ ...o, orgType: "BHOJANSHALA" })));
      if (pRes.status === "fulfilled") allOrgs.push(...(pRes.value.data?.data || []).map(o => ({ ...o, orgType: "PATHSHALA" })));
      if (sRes?.status === "fulfilled") allOrgs.push(...(sRes.value.data?.data || []).map(o => ({ ...o, orgType: "STHANAK" })));
      
      // Deduplicate by ID
      const uniqueOrgsMap = new Map();
      allOrgs.forEach(org => {
        if (org?.id) uniqueOrgsMap.set(org.id, org);
      });
      setOrganizations(Array.from(uniqueOrgsMap.values()));
    } catch (e) {
      toast.error(t(`Failed to load organizations`));
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Re-fetch organizations whenever the creation role changes
  useEffect(() => {
    fetchOrganizations(form.role);
    setForm(f => ({ ...f, organizationIds: [] }));
  }, [form.role]);

  // Handle register submit
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.userId) {
      toast.error(t("Please select a member."));
      return;
    }
    if (!form.password) {
      toast.error(t("Password is required."));
      return;
    }
    if (form.role !== "MONK_ADMIN" && form.organizationIds.length === 0) {
      toast.error(t("Please scope this administrator to at least one organization."));
      return;
    }

    try {
      const grantedTabs = form.grantedModules || form.modules || {};
      // Backend + sidebar expect `modules` as a flat array of module keys.
      // We now include sub-module dotted keys so the backend can save them too.
      // `grantedModules` keeps the full grant map for granular checks.
      // `permissions` carries the per-action payload for RolePermission writes.
      const flatModuleKeys = grantMapToKeys(grantedTabs);
      const payload = {
        ...form,
        modules: flatModuleKeys,
        grantedModules: grantedTabs,
        permissions: toPermissionsPayload(grantedTabs),
        ...buildGrantMeta(user),
      };
      const res = await api.post("/auth/admins/link", payload);
      const data = res.data?.data;
      
      // Open credentials popup
      setCredentialPopup({
        username: data.mobile,
        password: form.password ? "Custom password set" : (data.tempPassword || "Sent via WhatsApp/SMS"),
        role: form.role,
      });

      toast.success(t("Administrator account registered successfully."));
      
      // Reset form
      setForm({
        userId: "",
        memberId: "",
        password: "",
        role: "ORG_ADMIN",
        organizationIds: [],
        // Seed with every top-level module at Read+Write. Super Admin can then
    // pare down or reduce specific modules to Read-only in the picker.
    grantedModules: PLATFORM_MODULE_LIST.reduce((acc, m) => {
      acc[m.key] = ["VIEW", "CREATE", "EDIT"];
      return acc;
    }, {}),
      });
      
      fetchAdmins();
      setActiveTab("directory");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  // Handle admin deletion
  const handleDeleteAdmin = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to revoke privileges and delete admin account for "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/auth/admins/${userId}`);
      toast.success(t("Admin account deleted."));
      fetchAdmins();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  // Toggle active / inactive status for any admin
  const handleToggleAdminStatus = async (admin) => {
    const nextStatus = (admin.status === "ACTIVE" || !admin.status) ? "INACTIVE" : "ACTIVE";
    try {
      await api.patch(`/auth/admins/${admin.id}/status`, { active: nextStatus === "ACTIVE" });
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, status: nextStatus } : a)));
      toast.success(t(`Admin status updated to ${nextStatus}.`));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  // Handle scope update modal open
  const openScopeEditor = async (admin) => {
    setEditingAdmin(admin);
    const mappedOrgIds = admin.userOrganizations?.map(uo => uo.organizationId) || [];
    setEditingOrgs(mappedOrgIds);
    
    // Fetch options for modal
    fetchOrganizations(admin.primaryRoleKey);
  };

  // Save updated scopes
  const saveScopeEdits = async () => {
    if (!editingAdmin) return;
    setSavingScope(true);
    try {
      await api.patch(`/auth/admins/${editingAdmin.id}/organizations`, {
        organizationIds: editingOrgs,
      });
      toast.success(t("Admin scopes updated."));
      setEditingAdmin(null);
      fetchAdmins();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSavingScope(false);
    }
  };

  // Save updated Profile Details
  const saveProfileEdits = async () => {
    if (!editingProfileAdmin) return;
    
    if (!editingProfileAdmin.firstName || !editingProfileAdmin.mobile) {
      toast.error(t("First Name and Mobile Number are required."));
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        firstName: editingProfileAdmin.firstName,
        lastName: editingProfileAdmin.lastName,
        mobile: editingProfileAdmin.mobile,
      };
      if (editingProfileAdmin.password) {
        payload.password = editingProfileAdmin.password;
      }
      
      const res = await api.patch(`/auth/admins/${editingProfileAdmin.id}`, payload);
      
      toast.success(t("Admin details updated successfully."));
      
      if (editingProfileAdmin.password) {
        setCredentialPopup({
          username: payload.mobile,
          password: payload.password,
          role: editingProfileAdmin.primaryRoleKey,
        });
      }
      
      setEditingProfileAdmin(null);
      fetchAdmins();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSavingProfile(false);
    }
  };

  // Open Tab Access Manager for an Admin. Loads permission overrides into
  // the grant-map shape. If the backend returns overrides with per-action rows
  // ({module, action, allowed}), we bucket them by module. Falls back to
  // the admin's explicitly fetched grantedModules array (legacy) or "everything Read+Write".
  const openTabAccessModal = async (admin) => {
    setTabAccessAdmin(admin);
    setLoadingTabAccess(true);
    const targetId = admin.userId || admin.id;
    const fallbackAll = PLATFORM_MODULE_LIST.reduce((acc, m) => {
      acc[m.key] = ["VIEW", "CREATE", "EDIT"];
      return acc;
    }, {});
    try {
      const [overridesRes, adminRes] = await Promise.all([
        api.get(`/settings/users/${targetId}/permission-overrides`).catch(() => null),
        api.get(`/auth/admins/${targetId}`).catch(() => null)
      ]);
      const rows = overridesRes?.data?.data;
      const fetchedAdmin = adminRes?.data?.data || admin;
      if (Array.isArray(rows) && rows.length > 0) {
        // Bucket rows by module. Rows without an explicit action fall back to VIEW.
        const grantMap = {};
        for (const r of rows) {
          if (!r.allowed) continue;
          const mod = String(r.module).toUpperCase();
          const act = String(r.action || "VIEW").toUpperCase();
          grantMap[mod] = grantMap[mod] || [];
          if (!grantMap[mod].includes(act)) grantMap[mod].push(act);
        }
        setSelectedAdminTabs(Object.keys(grantMap).length > 0 ? grantMap : (normalizeGrants(fetchedAdmin.grantedModules || fetchedAdmin.modules) || fallbackAll));
      } else if (fetchedAdmin.grantedModules || fetchedAdmin.modules) {
        setSelectedAdminTabs(normalizeGrants(fetchedAdmin.grantedModules || fetchedAdmin.modules));
      } else {
        setSelectedAdminTabs(fallbackAll);
      }
    } catch {
      setSelectedAdminTabs(fallbackAll);
    } finally {
      setLoadingTabAccess(false);
    }
  };

  // Save updated Tab Access for an Admin
  const handleSaveTabAccess = async () => {
    if (!tabAccessAdmin) return;
    setSavingTabs(true);
    const targetId = tabAccessAdmin.userId || tabAccessAdmin.id;
    // Provenance: records that this grant came from the acting Super Admin, so
    // the Admin's own "My Access" panel can name who granted each tab.
    const grantMeta = buildGrantMeta(user);
    try {
      // 1. Store in local permission cache for immediate synchronous sync
      try {
        if (targetId) localStorage.setItem(`jinanam_admin_modules_${targetId}`, JSON.stringify(selectedAdminTabs));
        if (tabAccessAdmin.id) localStorage.setItem(`jinanam_admin_modules_${tabAccessAdmin.id}`, JSON.stringify(selectedAdminTabs));
        if (tabAccessAdmin.mobile) localStorage.setItem(`jinanam_admin_modules_${tabAccessAdmin.mobile}`, JSON.stringify(selectedAdminTabs));
        localStorage.setItem(`jinanam_grant_meta_${targetId}`, JSON.stringify(grantMeta));
      } catch {}

      // 2. Update /auth/admins/:id/modules
      // `permissions` carries the actions per module (the granular Read /
      // Read+Write choice from the picker). `modules` is an array of
      // granted module and sub-module keys.
      const flatModuleKeys = grantMapToKeys(selectedAdminTabs);
      await api.put(`/auth/admins/${targetId}/modules`, {
        modules: flatModuleKeys,
        grantedModules: selectedAdminTabs,
        permissions: toPermissionsPayload(selectedAdminTabs),
        ...grantMeta,
      });

      // 3. (Removed incorrect /auth/admins/:id call which caused 404 Route Not Found)

      // 4. (Removed redundant /settings/users/:userId/permission-overrides call, which is already handled entirely on the backend by updateAdminModules)

      toast.success(t(`Tab access permissions updated for ${tabAccessAdmin.firstName || "Administrator"}.`));
      setTabAccessAdmin(null);
      fetchAdmins();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSavingTabs(false);
    }
  };

  // Filter organizations by search input and type
  const filteredOrgs = organizations.filter(o => {
    const matchesSearch = o.name?.toLowerCase().includes(orgSearchQuery.toLowerCase()) || o.city?.toLowerCase().includes(orgSearchQuery.toLowerCase());
    const matchesType = orgTypeFilter ? o.orgType === orgTypeFilter : true;
    return matchesSearch && matchesType;
  });

  /**
   * Only Super Admin provisions *admin* accounts. An Admin still needs a way to
   * onboard and manage the people below them, so instead of a dead end they get
   * routed to Staff Management — the screen where they delegate their own tabs
   * to sub-admins and staff.
   */
  if (!isSuperAdmin) {
    // If the user is STAFF, they shouldn't even see the "My Access" overview page.
    // Redirect them silently if they try to access the route manually.
    if (user?.role === "STAFF" || user?.primaryRoleKey === "STAFF") {
      return <Navigate to="/admin/a-dashboard" replace />;
    }

    return (
      <div className="space-y-6" data-testid="admins-access-restricted">
        <PageHeader
          title={t("Team & Access Management")}
          subtitle={t("Onboard your team and delegate the tabs you hold.")}
        />

        <MyAccessPanel />

        <Card className="p-6 max-w-3xl rounded-2xl border border-orange-100 bg-orange-50/40 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t("Admin accounts are provisioned by Super Admin")}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t("Creating other Administrators is reserved for Super Admin. You can onboard sub-admins and staff, and grant them any of the tabs listed above — never more than you hold yourself.")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={() => navigate("/admin/staff")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
            >
              <UsersRound className="h-3.5 w-3.5 mr-1.5" /> {t("Manage Staff & Sub-Admins")}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/a-dashboard")}
              className="text-xs font-semibold"
            >
              {t("Return to Dashboard")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admins-management-page">
      <PageHeader
        title={t("Admin Accounts Manager")}
        subtitle={t("Provision community administrator profiles, assign scope authorities, and track credentials.")}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="directory" data-testid="admins-tab-directory">
            <UsersRound className="h-3.5 w-3.5 mr-1.5" /> {t("Administrators List")}
          </TabsTrigger>
          <TabsTrigger value="register" data-testid="admins-tab-register">
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> {t("Register Admin")}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Administrators Directory */}
        <TabsContent value="directory">
          <Card className="p-5 rounded-md border-border bg-white shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-slate-800 mb-4">{t("Administrators Directory")}</h3>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-10 text-slate-500">{t("No administrative profiles found.")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="text-[10px] uppercase tracking-widest text-slate-400 py-3 pr-4 w-48">{t("Admin Name")}</th>
                      <th className="text-[10px] uppercase tracking-widest text-slate-400 py-3 px-4 w-36">{t("Mobile / Username")}</th>
                      <th className="text-[10px] uppercase tracking-widest text-slate-400 py-3 px-4 w-40">{t("System Role")}</th>
                      <th className="text-[10px] uppercase tracking-widest text-slate-400 py-3 px-4">{t("Scoped Organizations")}</th>
                      <th className="text-[10px] uppercase tracking-widest text-slate-400 py-3 px-4 w-28">{t("Status")}</th>
                      <th className="text-[10px] uppercase tracking-widest text-slate-400 py-3 pl-4 w-28 text-right">{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-border/60 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pr-4 text-sm font-semibold text-slate-800">
                          {admin.firstName} {admin.lastName || ""}
                          <div className="text-[10px] text-slate-400 font-normal">{t("Registered")} {formatDateTime(admin.createdAt)}</div>
                        </td>
                        <td className="py-3.5 px-4 text-sm font-mono text-slate-600">{admin.mobile}</td>
                        <td className="py-3.5 px-4 text-sm">
                          <Badge variant="outline" className="border-orange-200 bg-orange-50/30 text-orange-600 text-xs px-2 py-0.5">
                            {admin.primaryRoleKey.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-sm">
                          {admin.primaryRoleKey === "MONK_ADMIN" || admin.primaryRoleKey === "SUPER_ADMIN" ? (
                            <span className="text-slate-400 italic text-xs">{t("Global/All Scope")}</span>
                          ) : (admin.userOrganizations || []).length === 0 ? (
                            <span className="text-red-500 text-xs font-semibold">{t("No active organization scope")}</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {admin.userOrganizations.map((uo) => (
                                <Badge key={uo.id} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700">
                                  {uo.organization?.name || uo.organizationId} ({uo.organization?.city || "Unknown"})
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-sm">
                          <button
                            onClick={() => handleToggleAdminStatus(admin)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              admin.status === "ACTIVE" || !admin.status
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200"
                            }`}
                            title={t("Click to toggle Active / Inactive status")}
                          >
                            {admin.status === "ACTIVE" || !admin.status ? "ACTIVE" : "INACTIVE"}
                          </button>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
                              onClick={() => navigate(`/admin/admins/${admin.id}`)}
                              title={t("View Detailed Profile")}
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1" /> {t("View")}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 border-orange-200 text-orange-700 hover:bg-orange-50 font-semibold"
                              onClick={() => openTabAccessModal(admin)}
                              title={t("Manage Tab & Module Access Permissions")}
                            >
                              <Sliders className="h-3.5 w-3.5 mr-1" /> {t("Tab Access")}
                            </Button>
                            {admin.primaryRoleKey !== "MONK_ADMIN" && admin.primaryRoleKey !== "SUPER_ADMIN" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 px-2"
                                onClick={() => openScopeEditor(admin)}
                                title={t("Edit organization scope")}
                              >
                                <Building className="h-3.5 w-3.5 text-slate-600" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2"
                              onClick={() => setEditingProfileAdmin({ ...admin, password: "" })}
                              title={t("Edit admin details")}
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteAdmin(admin.id, `${admin.firstName} ${admin.lastName || ""}`)}
                              title={t("Delete admin account")}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: Register New Admin */}
        <TabsContent value="register">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 rounded-md border-border bg-white shadow-sm md:col-span-2">
              <h3 className="font-heading text-lg font-semibold text-slate-800 mb-4">{t("Register System Administrator")}</h3>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">{t("Select Member *")}</Label>
                  <MemberLinkSelect
                    id="memberId"
                    value={form.memberId}
                    onChange={(val, member) => setForm({ ...form, memberId: val, userId: member?.userId })}
                    placeholder={t("Search by name or ID to link...")}
                    returnValueType="id"
                    showPhone
                    className="mt-1"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {t("Only existing members can be linked as administrators.")}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">{t("Password *")}</Label>
                  <Input
                    type="text"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="border-slate-200 bg-white"
                    required
                  />
                  <p className="text-[10px] text-slate-500">{t("A strong password is required for the admin account.")}</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">{t("Administrative Role")}</Label>
                  <select 
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {ADMIN_ROLES.map(r => (
                      <option key={r.key} value={r.key}>{t(r.label)}</option>
                    ))}
                  </select>
                </div>

                {/* Organization Selection (only if not Monk Admin) */}
                {form.role !== "MONK_ADMIN" && (
                  <div className="border border-slate-100 rounded-md p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-800 flex items-center">
                        <Building className="h-4 w-4 text-orange-500 mr-1.5" /> {t("Scope Organizations")}
                      </Label>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {form.organizationIds.length} {t("Selected")}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-col sm:flex-row">
                      <select
                        value={orgTypeFilter}
                        onChange={(e) => setOrgTypeFilter(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
                      >
                        <option value="">{t("All Types")}</option>
                        <option value="TEMPLE">{t("Temple")}</option>
                        <option value="STHANAK">{t("Sthanak")}</option>
                        <option value="DHARAMSHALA">{t("Dharamshala")}</option>
                        <option value="JAIN_CENTER">{t("Jain Center")}</option>
                        <option value="BHOJANSHALA">{t("Bhojanshala")}</option>
                        <option value="PATHSHALA">{t("Pathshala")}</option>
                      </select>
                      <Input 
                        value={orgSearchQuery}
                        onChange={(e) => setOrgSearchQuery(e.target.value)}
                        placeholder={t("Search scopes by name or city...")}
                        className="bg-white text-xs h-9 flex-1"
                      />
                    </div>

                    {form.organizationIds.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {form.organizationIds.map(id => {
                          const org = organizations.find(o => o.id === id);
                          if (!org) return null;
                          return (
                            <div key={id} className="flex justify-between items-center bg-white border border-slate-200 px-3 py-2 rounded text-xs shadow-sm">
                              <div className="font-semibold text-slate-700">{org.name} <span className="text-slate-400 ml-1 font-normal font-mono">({org.city})</span></div>
                              <button type="button" onClick={() => setForm(f => ({ ...f, organizationIds: f.organizationIds.filter(i => i !== id)}))} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title={t("Remove")}><X className="w-4 h-4"/></button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {loadingOrgs ? (
                      <Skeleton className="h-28 w-full mt-2" />
                    ) : filteredOrgs.filter(org => !form.organizationIds.includes(org.id)).length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-4 text-center mt-2">{t("No more organizations to add.")}</div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto divide-y bg-white border rounded-md px-2.5 mt-2">
                        {filteredOrgs.filter(org => !form.organizationIds.includes(org.id)).map(org => (
                          <div
                            key={org.id} 
                            className="flex items-center justify-between py-2 text-xs text-slate-700 hover:text-slate-900"
                          >
                            <div className="flex items-center gap-2">
                              <span>{org.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{org.city}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, organizationIds: [...f.organizationIds, org.id] }))}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-semibold text-[10px] hover:bg-orange-100 hover:text-orange-700 transition-colors"
                            >
                              {t("Add")}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <TabPermissionSelector
                  grants={form.grantedModules}
                  onChange={(grantMap) => setForm({ ...form, grantedModules: grantMap })}
                  isSuperAdmin={true}
                  title={t("Assign Initial Tab & Feature Permissions for this Admin")}
                />

                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 font-bold">
                  <Save className="h-4 w-4 mr-2" /> {t("Register Admin & Save Tab Access")}
                </Button>
              </form>
            </Card>

            {/* Quick specifications helper panel */}
            <Card className="p-5 rounded-md border-border bg-slate-50 h-fit space-y-4">
              <h4 className="font-heading text-sm font-semibold text-slate-800 flex items-center">
                <UserCheck className="h-4 w-4 text-emerald-500 mr-2" /> {t("Administrator Rules")}
              </h4>
              <ul className="text-xs space-y-2.5 text-slate-600 list-disc list-inside">
                <li>{t("Admins **must be existing members** of the platform. Search and select a member to grant admin access.")}</li>
                <li>{t("Login credentials will be dispatched automatically via **WhatsApp & SMS** to the admin's mobile number.")}</li>
                <li>{t("**Temple/Dharamshala/Jain Center Admins** must be mapped to at least one scoped organization. They can only CRUD resources inside their scoped organizations.")}</li>
                <li>{t("**Monk Admins** have a global scope and are not restricted to specific organizations.")}</li>
              </ul>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 1. Temp Password Popup Modal */}
      {credentialPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="p-6 w-full max-w-md bg-white border border-border shadow-lg relative transform transition-all scale-100 space-y-4">
            <button 
              onClick={() => setCredentialPopup(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 text-amber-600">
              <KeyRound className="h-6 w-6" />
              <h3 className="text-lg font-semibold font-heading">{t("Temporary Admin Password")}</h3>
            </div>
            <p className="text-xs text-slate-600">
              {t("The administrator account has been successfully registered. The following credentials were generated and queued for SMS/WhatsApp dispatch:")}
            </p>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-md font-mono text-xs space-y-2.5">
              <div>
                <span className="text-slate-400">{t("Mobile/Login:")} </span>
                <span className="font-bold text-slate-800">{credentialPopup.username}</span>
              </div>
              <div>
                <span className="text-slate-400">{t("Temporary Password:")} </span>
                <span className="font-bold text-slate-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  {credentialPopup.password}
                </span>
              </div>
              <div>
                <span className="text-slate-400">{t("Assigned Role:")} </span>
                <span className="font-semibold text-slate-700">{credentialPopup.role}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t font-sans">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("Share Credentials")}</span>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => {
                    const msg = `Jai Jinendra, your admin account has been registered on the JiNANAM platform.\n\nUsername: ${credentialPopup.username}\nTemporary Password: ${credentialPopup.password}\nRole: ${credentialPopup.role}\n\nPlease login and change your password.`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                  }} 
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs py-1 h-9 px-2 flex items-center justify-center gap-1"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> {t("WhatsApp")}
                </Button>
                <Button 
                  onClick={() => {
                    const msg = `Jai Jinendra, your admin account has been registered on the JiNANAM platform.\n\nUsername: ${credentialPopup.username}\nTemporary Password: ${credentialPopup.password}\nRole: ${credentialPopup.role}\n\nPlease login and change your password.`;
                    window.open(`mailto:?subject=${encodeURIComponent("JiNANAM Admin Credentials")}&body=${encodeURIComponent(msg)}`, "_self");
                  }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 h-9 px-2 flex items-center justify-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5" /> {t("Email")}
                </Button>
                <Button 
                  onClick={() => {
                    const msg = `Jai Jinendra, your admin account has been registered on the JiNANAM platform.\n\nUsername: ${credentialPopup.username}\nTemporary Password: ${credentialPopup.password}\nRole: ${credentialPopup.role}\n\nPlease login and change your password.`;
                    navigator.clipboard.writeText(msg);
                    toast.success(t("Credentials copied to clipboard!"));
                  }} 
                  className="bg-slate-700 hover:bg-slate-800 text-white text-xs py-1 h-9 px-2 flex items-center justify-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" /> {t("Copy / SMS")}
                </Button>
              </div>
              <Button onClick={() => setCredentialPopup(null)} variant="outline" className="w-full h-9 mt-1 text-xs">
                {t("Close")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Update Scopes Mapping Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="p-6 w-full max-w-lg bg-white border border-border shadow-lg relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditingAdmin(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 text-slate-800">
              <Building className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold font-heading">
                {t("Update Scopes for")} <span className="text-orange-500">{editingAdmin.firstName}</span>
              </h3>
            </div>
            
            <p className="text-xs text-slate-500">
              {t("Configure which administrative centers this account is allowed to manage.")}
            </p>

            <div className="space-y-3.5">
              <div className="flex gap-2 flex-col sm:flex-row">
                <select
                  value={orgTypeFilter}
                  onChange={(e) => setOrgTypeFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
                >
                  <option value="">{t("All Types")}</option>
                  <option value="TEMPLE">{t("Temple")}</option>
                  <option value="STHANAK">{t("Sthanak")}</option>
                  <option value="DHARAMSHALA">{t("Dharamshala")}</option>
                  <option value="JAIN_CENTER">{t("Jain Center")}</option>
                  <option value="BHOJANSHALA">{t("Bhojanshala")}</option>
                  <option value="PATHSHALA">{t("Pathshala")}</option>
                </select>
                <Input 
                  value={orgSearchQuery}
                  onChange={(e) => setOrgSearchQuery(e.target.value)}
                  placeholder={t("Filter organizations...")}
                  className="text-xs h-9 flex-1"
                />
              </div>

              {editingOrgs.length > 0 && (
                <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto pr-1">
                  {editingOrgs.map(id => {
                    const org = organizations.find(o => o.id === id);
                    if (!org) return null;
                    return (
                      <div key={id} className="flex justify-between items-center bg-white border border-slate-200 px-3 py-2 rounded text-xs shadow-sm">
                        <div className="font-semibold text-slate-700">{org.name} <span className="text-slate-400 ml-1 font-normal font-mono">({org.city})</span></div>
                        <button type="button" onClick={() => setEditingOrgs(editingOrgs.filter(i => i !== id))} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title={t("Remove")}><X className="w-4 h-4"/></button>
                      </div>
                    )
                  })}
                </div>
              )}

              {loadingOrgs ? (
                <Skeleton className="h-28 w-full mt-2" />
              ) : filteredOrgs.filter(org => !editingOrgs.includes(org.id)).length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-6 mt-2">{t("No more organizations to add.")}</div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y bg-slate-50 border rounded-md px-3 mt-2">
                  {filteredOrgs.filter(org => !editingOrgs.includes(org.id)).map(org => (
                    <div
                      key={org.id} 
                      className="flex items-center justify-between py-2 text-xs text-slate-700 hover:text-slate-900"
                    >
                      <div className="flex items-center gap-2">
                        <span>{org.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{org.city}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingOrgs([...editingOrgs, org.id])}
                        className="px-2.5 py-1 bg-white border text-slate-700 rounded font-semibold text-[10px] hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200 transition-colors shadow-sm"
                      >
                        {t("Add")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setEditingAdmin(null)}>{t("Cancel")}</Button>
              <Button 
                onClick={saveScopeEdits} 
                disabled={savingScope || editingOrgs.length === 0} 
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {savingScope ? t("Saving...") : t("Save Scope Changes")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 3. Edit Profile Modal */}
      {editingProfileAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="p-6 w-full max-w-lg bg-white border border-border shadow-lg relative space-y-4">
            <button 
              onClick={() => setEditingProfileAdmin(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 text-slate-800">
              <Edit className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold font-heading">
                {t("Edit Admin Profile")}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">{t("First Name")}</Label>
                  <Input 
                    required
                    value={editingProfileAdmin.firstName || ""} 
                    onChange={(e) => setEditingProfileAdmin({ ...editingProfileAdmin, firstName: e.target.value })} 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">{t("Last Name")}</Label>
                  <Input 
                    value={editingProfileAdmin.lastName || ""} 
                    onChange={(e) => setEditingProfileAdmin({ ...editingProfileAdmin, lastName: e.target.value })} 
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">{t("Mobile Number *")}</Label>
                <PhoneField
                  value={editingProfileAdmin.mobile || ""}
                  onChange={(v) => setEditingProfileAdmin({ ...editingProfileAdmin, mobile: v })}
                  className="mt-1"
                />
              </div>

              <div className="pt-2 border-t mt-4">
                <Label className="text-xs font-semibold text-slate-700">{t("New Password (Optional)")}</Label>
                <Input 
                  type="text"
                  value={editingProfileAdmin.password || ""} 
                  onChange={(e) => setEditingProfileAdmin({ ...editingProfileAdmin, password: e.target.value })} 
                  placeholder={t("Leave empty to keep current password")} 
                  className="mt-1"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {t("If you set a new password here, you will be prompted to share it via WhatsApp/Email.")}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-[10px] h-7"
                  onClick={() => {
                    const temp = Math.random().toString(36).slice(-8);
                    setEditingProfileAdmin({ ...editingProfileAdmin, password: temp });
                  }}
                >
                  <KeyRound className="h-3 w-3 mr-1" /> {t("Generate Random Password")}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setEditingProfileAdmin(null)}>{t("Cancel")}</Button>
              <Button 
                onClick={saveProfileEdits} 
                disabled={savingProfile} 
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {savingProfile ? t("Saving...") : t("Save Changes")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Super Admin Manage Tab Access Dialog for Admin */}
      <Dialog open={tabAccessAdmin !== null} onOpenChange={(o) => { if (!o) setTabAccessAdmin(null); }}>
        <DialogContent className="max-w-3xl text-xs max-h-[85vh] overflow-y-auto">
          {tabAccessAdmin && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-800 font-bold">
                  <Sliders className="h-5 w-5 text-orange-600" />
                  {t("Manage Tab Access Permissions:")} {tabAccessAdmin.firstName} {tabAccessAdmin.lastName || ""}
                </DialogTitle>
              </DialogHeader>

              <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-lg text-[11px] text-orange-900 space-y-1.5">
                <div>
                  <strong>{t("Super Admin Override Control")}</strong>{t(": Selecting tabs here will dynamically grant or restrict which sidebar options and features")} <strong>{tabAccessAdmin.firstName}</strong> {t("can access and delegate to staff.")}
                </div>
                <div className="flex items-start gap-1.5 pt-1.5 border-t border-orange-200/70">
                  <Shield className="h-3.5 w-3.5 mt-px shrink-0 text-orange-600" />
                  <span>
                    {t("Each granted tab carries")} <strong>{t("View + Add + Edit")}</strong>.{" "}
                    {t("Delete stays with Super Admin only. This admin can pass these same tabs down to sub-admins and staff, but never more than what is selected here.")}
                  </span>
                </div>
              </div>

              {loadingTabAccess ? (
                <div className="py-8 space-y-4">
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              ) : (
                <TabPermissionSelector
                  grants={selectedAdminTabs}
                  onChange={setSelectedAdminTabs}
                  isSuperAdmin={true}
                  title={`Configured Tab Access for ${tabAccessAdmin.firstName}`}
                />
              )}

              <DialogFooter className="gap-2 border-t pt-3">
                <Button variant="ghost" onClick={() => setTabAccessAdmin(null)}>{t("Cancel")}</Button>
                <Button
                  onClick={handleSaveTabAccess}
                  disabled={savingTabs}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {savingTabs ? t("Saving Permissions...") : t("Save & Update Admin Tab Access")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
