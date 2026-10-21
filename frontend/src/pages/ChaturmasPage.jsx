import { useEffect, useState } from "react";
// Trigger recompile
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/common/StatCard";
import { Flame, Calendar, MapPin, Plus, UserCheck, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MemberLinkSelect from "@/components/common/MemberLinkSelect";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { PermissionGate } from "@/components/common/PermissionGate";

const getRowStatus = (row) => {
  if (row.status === "CANCELLED") return "CANCELLED";
  if (row.status === "COMPLETED") return "COMPLETED";
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (row.endDate) {
    const end = new Date(row.endDate);
    end.setHours(23, 59, 59, 999);
    if (now > end) return "COMPLETED";
  }

  if (row.startDate) {
    const start = new Date(row.startDate);
    start.setHours(0, 0, 0, 0);
    if (now < start) return "UPCOMING";
  }

  return row.status || "ACTIVE";
};

export default function ChaturmasPage() {
  const { t } = useLanguage();
  const { user, activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId || user?.organizationIds?.[0];
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.primaryRoleKey === 'SUPER_ADMIN' || user?.isSuperAdmin;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [orgTypeFilter, setOrgTypeFilter] = useState("ALL");
  
  const [monks, setMonks] = useState([]);
  const [temples, setTemples] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    monkId: "none", monkName: "", locationName: "", startDate: "", endDate: "", contactPersonId: "", contactPerson: "", contactMobile: "", status: "ACTIVE", notes: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const chaturmasEndpoint = `/chaturmas`;
      const [chaturmasRes, monksRes, tRes, sRes, jRes, dRes] = await Promise.all([
        api.get(chaturmasEndpoint).catch((err) => { toast.error("chaturmas error: " + err.message); return { data: { data: [] } }; }),
        api.get(`/monks`).catch((err) => { toast.error("monks error: " + err.message); return { data: { data: [] } }; }),
        api.get(`/temples`).catch((err) => { toast.error("temples error: " + err.message); return { data: { data: [] } }; }),
        api.get(`/sthanaks`).catch((err) => { toast.error("sthanaks error: " + err.message); return { data: { data: [] } }; }),
        api.get(`/jain-centers`).catch((err) => { toast.error("jain-centers error: " + err.message); return { data: { data: [] } }; }),
        api.get(`/dharamshalas`).catch((err) => { toast.error("dharamshalas error: " + err.message); return { data: { data: [] } }; })
      ]);
      setRows(chaturmasRes.data?.data?.items || chaturmasRes.data?.data || []);
      const fetchedMonks = monksRes.data?.data?.items || monksRes.data?.data || [];
      setMonks(fetchedMonks);
      console.log("Fetched monks:", fetchedMonks);
      const allOrgs = [
        ...(tRes.data?.data?.items || tRes.data?.data || []).map(o => ({ ...o, _uiType: 'TEMPLE' })),
        ...(sRes.data?.data?.items || sRes.data?.data || []).map(o => ({ ...o, _uiType: 'STHANAK' })),
        ...(jRes.data?.data?.items || jRes.data?.data || []).map(o => ({ ...o, _uiType: 'JAIN_CENTER' })),
        ...(dRes.data?.data?.items || dRes.data?.data || []).map(o => ({ ...o, _uiType: 'DHARAMSHALA' }))
      ];
      setTemples(allOrgs);
    } catch (e) {
      toast.error(t("Failed to load Chaturmas stays and monks."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const openAdd = () => {
    setEditing(null);
    setOrgTypeFilter("ALL");

    // Pre-select location for normal admin
    let defaultLocation = "";
    if (!isSuperAdmin && orgId) {
      const myOrg = temples.find(t => t.id === orgId);
      if (myOrg) defaultLocation = myOrg.name;
    }

    setForm({
      monkId: "", monkName: "", locationName: defaultLocation, startDate: "", endDate: "", contactPersonId: "", contactPerson: "", contactMobile: "", status: "ACTIVE", notes: ""
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setOrgTypeFilter("ALL");
    setForm({
      monkId: row.monkId || "",
      monkName: row.monkName,
      locationName: row.locationName,
      startDate: row.startDate ? row.startDate.slice(0, 10) : "",
      endDate: row.endDate ? row.endDate.slice(0, 10) : "",
      contactPersonId: row.contactPersonId || "",
      contactPerson: row.contactPerson || "",
      contactMobile: row.contactMobile || "",
      status: row.status || "ACTIVE",
      notes: row.notes || ""
    });
    setOpen(true);
  };

  const handleSave = async () => {
    let finalMonkName = form.monkName;
    if (form.monkId) {
      const selectedMonk = monks.find(m => m.id === form.monkId);
      if (selectedMonk) {
        finalMonkName = selectedMonk.dikshaName;
      }
    }

    let finalOrgId = orgId;
    const finalLocationName = form.locationName;

    if (form.locationName) {
      const selectedTemple = temples.find(t => t.name === form.locationName);
      if (selectedTemple) {
        finalOrgId = selectedTemple.id;
      }
    }

    if (!finalMonkName || !finalLocationName || !form.startDate || !form.monkId) {
      toast.error(t("Please fill in monk name, location and start date."));
      return;
    }

    if (!finalOrgId) {
      toast.error(t("Please select a Temple from the list to link this Chaturmas entry."));
      return;
    }

    const payload = {
      organizationId: finalOrgId,
      monkId: form.monkId,
      monkName: finalMonkName,
      locationName: finalLocationName,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      contactPersonId: form.contactPersonId || undefined,
      contactPerson: form.contactPerson || undefined,
      contactMobile: form.contactMobile || undefined,
      status: form.status,
      notes: form.notes || undefined
    };

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/chaturmas/${editing.id}`, payload);
        toast.success(t("Chaturmas listing updated successfully!"));
      } else {
        await api.post("/chaturmas", payload);
        toast.success(t("Chaturmas listing added successfully!"));
      }
      setOpen(false);
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save Chaturmas stay.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete Chaturmas stay for: ${row.monkName}?`)) return;
    try {
      await api.delete(`/chaturmas/${row.id}`);
      toast.success(t("Chaturmas listing deleted."));
      loadData();
    } catch (e) {
      toast.error(t("Failed to delete Chaturmas listing."));
    }
  };

  const columns = [
    { key: "monkName", header: t("Monk / Sadhvi"), render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-800">{r.monkName}</span>
        {!isSuperAdmin && r.organizationId === orgId && (
          <Badge variant="outline" className="text-[10px] text-orange-600 bg-orange-50 border-orange-200 uppercase">
            {t("Added By You")}
          </Badge>
        )}
      </div>
    ) },
    { key: "locationName", header: t("Location & Centre"), render: (r) => <span className="text-slate-600 flex items-center gap-1"><MapPin className="h-3 w-3 text-orange-500" />{r.locationName}</span> },
    { key: "dates", header: t("Period"), render: (r) => <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{r.startDate ? r.startDate.slice(0, 10) : "—"} to {r.endDate ? r.endDate.slice(0, 10) : "—"}</span> },
    { key: "status", header: t("Status"), render: (r) => {
      const status = getRowStatus(r);
      const isCompleted = status === "COMPLETED";
      const isUpcoming = status === "UPCOMING";
      const isCancelled = status === "CANCELLED";
      
      let badgeClass = "bg-orange-500 text-white hover:bg-orange-600";
      if (isCompleted) badgeClass = "bg-green-600 text-white hover:bg-green-700";
      else if (isUpcoming) badgeClass = "bg-blue-500 text-white hover:bg-blue-600";
      else if (isCancelled) badgeClass = "bg-red-500 text-white hover:bg-red-600";
      
      return <Badge className={badgeClass}>{status}</Badge>;
    } },
    {
      key: "actions", header: "", render: (r) => {
        const canEdit = isSuperAdmin || r.organizationId === orgId;
        return (
          <div className="flex gap-2 justify-end">
            {canEdit && (
              <>
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                <PermissionGate action="DELETE">
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(r)}><Trash2 className="h-4 w-4" /></Button>
                </PermissionGate>
              </>
            )}
          </div>
        );
      }
    }
  ];

  const filteredRows = rows.filter((r) => {
    if (selectedYear !== "all") {
      const year = r.startDate ? new Date(r.startDate).getFullYear().toString() : "";
      if (year !== selectedYear) return false;
    }
    if (selectedStatus !== "all") {
      if (getRowStatus(r) !== selectedStatus) return false;
    }
    if (selectedLocation !== "all" && r.locationName !== selectedLocation) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!r.monkName?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    // 1. Sort by ownership if normal admin
    if (!isSuperAdmin && orgId) {
      const aIsOwn = a.organizationId === orgId;
      const bIsOwn = b.organizationId === orgId;
      if (aIsOwn && !bIsOwn) return -1;
      if (!aIsOwn && bIsOwn) return 1;
    }
    
    // 2. Sort by status
    const statusPriority = { "ACTIVE": 1, "UPCOMING": 2, "COMPLETED": 3, "CANCELLED": 4 };
    const pA = statusPriority[getRowStatus(a)] || 99;
    const pB = statusPriority[getRowStatus(b)] || 99;
    return pA - pB;
  });

  const stayCentersCount = Array.from(new Set(filteredRows.map(r => r.locationName))).length;

  const currentYear = new Date().getFullYear();
  const defaultYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(String);
  const yearsSet = new Set([...defaultYears, ...rows.map(r => r.startDate ? new Date(r.startDate).getFullYear().toString() : null).filter(Boolean)]);
  const availableYears = Array.from(yearsSet).sort().reverse();
  const availableLocations = Array.from(new Set(rows.map(r => r.locationName).filter(Boolean))).sort();

  return (
    <div data-testid="chaturmas-page">
      <PageHeader
        title={t("Chaturmas Management")}
        subtitle={t("Manage seasonal Chaturmas stays, monk locations, lecture schedules, and local host coordination.")}
        actions={
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> {t("Add Chaturmas Stay")}</Button>
        }
      />

      <div className="flex flex-col lg:flex-row items-center justify-between mb-4 gap-4">
        <div className="w-full lg:w-1/3">
          <Input 
            placeholder={t("Search Monk / Sadhvi...")} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
          <div className="w-32 sm:w-40">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder={t("Location")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Locations")}</SelectItem>
                {availableLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32 sm:w-40">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t("Filter by Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Statuses")}</SelectItem>
                <SelectItem value="ACTIVE">{t("Active")}</SelectItem>
                <SelectItem value="COMPLETED">{t("Completed")}</SelectItem>
                <SelectItem value="UPCOMING">{t("Upcoming")}</SelectItem>
                <SelectItem value="CANCELLED">{t("Cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-32 sm:w-40">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder={t("Filter by Year")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Years")}</SelectItem>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatCard label={t("Active Chaturmas")} value={filteredRows.filter(r => getRowStatus(r) === "ACTIVE").length} icon={Flame} tone="warning" />
        <StatCard label={t("Total Stays")} value={filteredRows.length} icon={UserCheck} tone="default" />
        <StatCard label={t("Stay Centers")} value={stayCentersCount} icon={MapPin} tone="info" />
      </div>

      <DataTable
        columns={columns}
        rows={filteredRows}
        loading={loading}
        testId="chaturmas-table"
        emptyTitle={t("No Chaturmas stay listings")}
        emptyDescription={t("Add Chaturmas stay records to begin tracking monk rainy season stays.")}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("Edit Chaturmas Stay") : t("Add Chaturmas Stay")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">{t("Select Monk / Sadhvi *")}</Label>
              <Select
                value={form.monkId || ""}
                onValueChange={(val) => setForm({ ...form, monkId: val, monkName: monks.find(m => m.id === val)?.dikshaName || "" })}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t("Select a monk")} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {monks.length === 0 ? (
                    <SelectItem value="none" disabled>No monks found</SelectItem>
                  ) : (
                    monks.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.dikshaName} {m.publicId ? `(${m.publicId})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("Filter Location Type")}</Label>
                <Select
                  value={orgTypeFilter}
                  onValueChange={(val) => setOrgTypeFilter(val)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder={t("All Types")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("All Types")}</SelectItem>
                    <SelectItem value="TEMPLE">{t("Temple")}</SelectItem>
                    <SelectItem value="STHANAK">{t("Sthanak")}</SelectItem>
                    <SelectItem value="JAIN_CENTER">{t("Jain Center")}</SelectItem>
                    <SelectItem value="DHARAMSHALA">{t("Dharamshala")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">{t("Chaturmas Location / Temple *")}</Label>
                <Select
                  value={form.locationName || ""}
                  onValueChange={(val) => setForm({ ...form, locationName: val })}
                  disabled={!isSuperAdmin && !!orgId}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder={t("Select a location")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {temples.length === 0 ? (
                      <SelectItem value="none" disabled>No locations found</SelectItem>
                    ) : (
                      temples
                        .filter(t => isSuperAdmin ? (orgTypeFilter === "ALL" || t._uiType === orgTypeFilter) : t.id === orgId)
                        .map((t) => (
                          <SelectItem key={t.name} value={t.name}>
                            {t.name} {t.city ? `(${t.city})` : ''}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("Start Date *")}</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">{t("End Date")}</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("Contact Person")}</Label>
                <MemberLinkSelect
                  value={form.contactPersonId}
                  onChange={(val, member) => {
                    setForm({
                      ...form,
                      contactPersonId: val,
                      contactPerson: member ? (member.fullName || [member.firstName, member.surname].filter(Boolean).join(" ")) : "",
                      contactMobile: member ? member.mobile : form.contactMobile
                    });
                  }}
                  placeholder={t("Select contact person...")}
                  returnValueType="id"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">{t("Contact Mobile")}</Label>
                <Input value={form.contactMobile} onChange={(e) => setForm({ ...form, contactMobile: e.target.value })} placeholder={t("+91XXXXXXXXXX")} />
              </div>
            </div>
            {editing && (
              <div>
                <Label className="text-xs">{t("Status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => {
                    const updates = { status: val };
                    if (val === "COMPLETED") {
                      const today = new Date();
                      const tzOffset = today.getTimezoneOffset() * 60000;
                      updates.endDate = new Date(today.getTime() - tzOffset).toISOString().slice(0, 10);
                    }
                    setForm({ ...form, ...updates });
                  }}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder={t("Select status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t("Saving...") : editing ? t("Update Stays") : t("Save Stays")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
