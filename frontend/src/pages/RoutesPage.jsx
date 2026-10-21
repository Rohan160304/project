import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, MapPin, Trash2, Edit, Eye, Navigation, UserCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { RouteDetailModal } from "@/components/modals/RouteDetailModal";

const formatLocalDatetime = (isoStr) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export default function RoutesPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monks, setMonks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rows, setRows] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [members, setMembers] = useState([]);
  const [viewRoute, setViewRoute] = useState(null);
  const [form, setForm] = useState({ id: null, name: "", targetType: "MONK", monkId: "", monkGroupId: "", participantMonkIds: [], contactPersonIds: [], journeyDate: "", stops: [] });

  const loadRoutesAndMonks = async () => {
    setLoading(true);
    try {
      const [routesRes, monksRes, groupsRes, templesRes, jainCentersRes, dharamshalasRes, sthanaksRes, membersRes] = await Promise.all([
        api.get("/tracking/routes"),
        api.get("/monks"),
        api.get("/monks/groups").catch(() => ({ data: { data: [] } })),
        api.get("/temples").catch(() => ({ data: { data: [] } })),
        api.get("/jain-centers").catch(() => ({ data: { data: [] } })),
        api.get("/dharamshalas").catch(() => ({ data: { data: [] } })),
        api.get("/sthanaks").catch(() => ({ data: { data: [] } })),
        api.get("/members").catch(() => ({ data: { data: [] } }))
      ]);
      setRows(routesRes.data?.data || []);
      setMonks(monksRes.data?.data?.items || monksRes.data?.data || []);
      setGroups(groupsRes.data?.data || []);
      setMembers(membersRes.data?.data?.items || membersRes.data?.data || []);

      const allOrgs = [
        ...(templesRes.data?.data || []).map(o => ({ ...o, orgType: "TEMPLE" })),
        ...(jainCentersRes.data?.data || []).map(o => ({ ...o, orgType: "JAIN_CENTER" })),
        ...(dharamshalasRes.data?.data || []).map(o => ({ ...o, orgType: "DHARAMSHALA" })),
        ...(sthanaksRes.data?.data || []).map(o => ({ ...o, orgType: "STHANAK" })),
      ].map(o => ({ value: o.id, label: `${o.name} (${o.publicId})`, city: o.city || "", orgType: o.orgType }));
      setOrgs(allOrgs);

      const viewRouteId = searchParams.get("viewRouteId");
      if (viewRouteId) {
        const loadedRoutes = routesRes.data?.data || [];
        const routeToView = loadedRoutes.find(r => r.id === viewRouteId);
        if (routeToView) {
          setViewRoute(routeToView);
          // Remove query param to prevent re-opening on refresh
          searchParams.delete("viewRouteId");
          setSearchParams(searchParams, { replace: true });
        }
      }
    } catch (e) {
      toast.error(t("Failed to load data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutesAndMonks();
  }, []);

  const openAdd = () => {
    setForm({
      id: null,
      name: "",
      targetType: "MONK",
      monkId: "",
      monkGroupId: "",
      participantMonkIds: [],
      contactPersonIds: [],
      journeyDate: "",
      stops: [
        { templeId: "", templeName: "", dateTime: "" },
        { templeId: "", templeName: "", dateTime: "" }
      ]
    });
    setOpen(true);
  };

  const openEdit = (r) => {
    setForm({
      id: r.id,
      name: r.name,
      targetType: r.monkGroupId ? "GROUP" : "MONK",
      monkId: r.monkId || "",
      monkGroupId: r.monkGroupId || "",
      participantMonkIds: r.participantMonkIds || [],
      contactPersonIds: r.contactPersonIds || [],
      journeyDate: r.journeyDate ? formatLocalDatetime(r.journeyDate) : "",
      stops: r.stops && r.stops.length > 0 ? r.stops.map(s => {
        let orgType = "";
        if (s.templeId) {
           const o = orgs.find(x => x.value === s.templeId);
           orgType = o ? o.orgType : "";
        }
        return { templeId: s.templeId || "", templeName: s.templeName || "", dateTime: s.dateTime ? formatLocalDatetime(s.dateTime) : "", orgType };
      }) : [
        { templeId: "", templeName: "", dateTime: "", orgType: "" },
        { templeId: "", templeName: "", dateTime: "", orgType: "" }
      ]
    });
    setOpen(true);
  };

  const saveRoute = async () => {
    if (!form.name || (!form.monkId && !form.monkGroupId) || !form.journeyDate) {
      toast.error(t("Please fill in Route Name, Target (at least one), and Vihar Start Date."));
      return;
    }
    const validStops = form.stops.filter(s => s.templeName.trim());
    if (validStops.length < 2) {
      toast.error(t("Please provide at least 2 stops."));
      return;
    }

    for (let i = 1; i < validStops.length; i++) {
      if (validStops[i].dateTime && validStops[i-1].dateTime) {
        if (new Date(validStops[i].dateTime) < new Date(validStops[i-1].dateTime)) {
          toast.error(t(`Stop ${i + 1} date/time cannot be before Stop ${i} date/time.`));
          return;
        }
      }
    }

    const payload = {
      name: form.name,
      monkId: form.targetType === "MONK" ? (form.monkId || undefined) : undefined,
      monkGroupId: form.targetType === "GROUP" ? (form.monkGroupId || undefined) : undefined,
      participantMonkIds: form.targetType === "GROUP" ? form.participantMonkIds : [],
      contactPersonIds: form.contactPersonIds,
      journeyDate: new Date(form.journeyDate).toISOString(),
      stops: validStops.map((s, idx) => ({
        order: idx,
        templeName: s.templeName,
        templeId: s.templeId || undefined,
        dateTime: s.dateTime || undefined,
        status: "PENDING"
      }))
    };

    setSaving(true);
    try {
      if (form.id) {
        await api.patch(`/tracking/routes/${form.id}`, payload);
        toast.success(t("Vihar route updated successfully."));
      } else {
        await api.post("/tracking/routes", payload);
        toast.success(t("New Vihar route created successfully."));
      }
      setOpen(false);
      loadRoutesAndMonks();
    } catch (e) {
      toast.error(e?.response?.data?.message || t("Failed to save route."));
    } finally {
      setSaving(false);
    }
  };

  const updateStop = (index, field, val) => {
    const newStops = [...form.stops];
    newStops[index][field] = val;
    if (field === 'templeId') {
      const org = orgs.find(o => o.value === val);
      if (org) {
        newStops[index].templeName = org.city || org.label.split(' (')[0];
      }
    }
    setForm({ ...form, stops: newStops });
  };

  const addStop = () => {
    setForm({ ...form, stops: [...form.stops, { templeId: "", templeName: "", dateTime: "", orgType: "" }] });
  };

  const removeStop = (index) => {
    const newStops = [...form.stops];
    newStops.splice(index, 1);
    setForm({ ...form, stops: newStops });
  };

  const handleMarkArrived = async (routeId, stopIndex) => {
    try {
      const route = rows.find(r => r.id === routeId);
      if (!route) return;
      
      const newStops = [...route.stops];
      newStops[stopIndex].status = "COMPLETED";
      
      await api.patch(`/tracking/routes/${routeId}`, { stops: newStops });
      toast.success(t("Stop marked as arrived."));
      loadRoutesAndMonks();
      
      if (viewRoute && viewRoute.id === routeId) {
        setViewRoute({ ...viewRoute, stops: newStops });
      }
    } catch (e) {
      toast.error(t("Failed to update stop status."));
      console.error(e);
    }
  };

  const columns = [
    { key: "name", header: t("Route Name"), render: (r) => <span className="font-semibold text-slate-800 cursor-pointer hover:underline hover:text-orange-600" onClick={() => setViewRoute(r)}>{r.name}</span> },
    { key: "target", header: t("Target"), render: (r) => <span className="text-slate-700 font-medium">{r.monk?.dikshaName || r.monkGroup?.name || "Unknown"}</span> },
    { key: "span", header: t("Route Span"), render: (r) => {
      const stops = r.stops || [];
      const start = stops[0]?.templeName || "Start";
      const end = stops[stops.length - 1]?.templeName || "End";
      return (
        <span className="text-sm text-slate-600 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-orange-500" /> {start} to {end}
        </span>
      );
    }},
    { key: "journeyDate", header: t("Vihar Date & Time"), render: (r) => <span className="text-sm font-mono">{r.journeyDate ? new Date(r.journeyDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '') : "—"}</span> },
    { key: "stops", header: t("Defined Rest Stops"), render: (r) => <Badge className="bg-orange-500 text-white">{(r.stops || []).length} {t("Stops")}</Badge> },
    { key: "actions", header: "", align: "right", render: (r) => (
      <div className="flex gap-1 justify-end">
        <Button variant="ghost" size="icon" onClick={() => {
          // Pre-populate monk and contact data for the modal using local state
          const populatedRoute = {
            ...r,
            monk: monks.find(m => m.id === r.monkId) || null,
            monkGroup: r.monkGroup,
            participantMonksData: (r.participantMonkIds || []).map(id => monks.find(m => m.id === id)).filter(Boolean),
            contactPersonsData: (r.contactPersonIds || []).map(id => members.find(m => m.id === id)).filter(Boolean),
            stops: (r.stops || []).map(stop => ({
              ...stop,
              orgName: orgs.find(o => o.value === stop.templeId)?.label
            }))
          };
          setViewRoute(populatedRoute);
        }}><Eye className="h-4 w-4 text-slate-500" /></Button>
        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit className="h-4 w-4 text-slate-500" /></Button>
      </div>
    ) }
  ];

  return (
    <div data-testid="routes-page">
      <PageHeader
        title={t("Vihar Routes Master")}
        subtitle={t("Pre-define, configure and inspect standard Vihar highway transit pathways.")}
        actions={
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> {t("Add Route Definition")}</Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        testId="routes-table"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? t("Edit Vihar Route") : t("Add Vihar Route")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label className="text-xs">{t("Route Name *")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("e.g. Mumbai-Pune Highway Route")} className="mt-1" /></div>
            
            <div><Label className="text-xs">{t("Vihar Date & Time *")}</Label><Input type="datetime-local" value={form.journeyDate} onChange={(e) => setForm({ ...form, journeyDate: e.target.value })} className="mt-1" /></div>

            <div className="flex gap-4 items-center">
               <Label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="targetType" value="MONK" checked={form.targetType === "MONK"} onChange={() => setForm({ ...form, targetType: "MONK", monkGroupId: "", participantMonkIds: [] })} /> {t("Individual Monk")}</Label>
               <Label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="targetType" value="GROUP" checked={form.targetType === "GROUP"} onChange={() => setForm({ ...form, targetType: "GROUP", monkId: "" })} /> {t("Monk Group")}</Label>
            </div>

            {form.targetType === "MONK" && (
              <div>
                <Label className="text-xs">{t("Monk / Sadhvi (Optional)")}</Label>
                <SearchableSelect
                  value={form.monkId}
                  onValueChange={(val) => setForm({ ...form, monkId: val })}
                  options={monks.map((m) => ({ value: m.id, label: `${m.dikshaName} (${m.publicId})` }))}
                  placeholder={t("Select a monk")}
                  searchPlaceholder={t("Search monks…")}
                  className="mt-1"
                />
              </div>
            )}

            {form.targetType === "GROUP" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{t("Sangh / Group (Optional)")}</Label>
                  <SearchableSelect
                    value={form.monkGroupId}
                    onValueChange={(val) => setForm({ ...form, monkGroupId: val, participantMonkIds: monks.filter(m => m.groupId === val).map(m => m.id) })}
                    options={groups.map((g) => ({ value: g.id, label: g.name }))}
                    placeholder={t("Select a group")}
                    searchPlaceholder={t("Search groups…")}
                    className="mt-1"
                  />
                </div>
                
                {form.monkGroupId && (
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                    <Label className="text-xs mb-2 block">{t("Select Participating Monks")}</Label>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                      {monks.filter(m => m.groupId === form.monkGroupId).map(m => (
                         <Label key={m.id} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                           <input type="checkbox" checked={form.participantMonkIds.includes(m.id)} 
                             onChange={(e) => {
                               const ids = e.target.checked ? [...form.participantMonkIds, m.id] : form.participantMonkIds.filter(id => id !== m.id);
                               setForm({ ...form, participantMonkIds: ids });
                             }}
                           />
                           {m.dikshaName}
                         </Label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs">{t("Contact Persons (Optional)")}</Label>
              <SearchableSelect
                multiple
                value={form.contactPersonIds}
                onValueChange={(val) => setForm({ ...form, contactPersonIds: val })}
                options={members.map((m) => ({ value: m.id, label: `${m.fullName || (m.firstName + ' ' + (m.surname || ''))} (${m.publicId})${m.mobile ? ` - ${m.mobile}` : ''}` }))}
                placeholder={t("Select contact persons")}
                searchPlaceholder={t("Search members…")}
                className="mt-1"
              />
            </div>
            
            <div className="border border-slate-200 rounded-md p-3 space-y-3 bg-slate-50/50">
              <Label className="text-sm font-semibold">{t("Route Stops")}</Label>
              <p className="text-xs text-slate-500">{t("Define the sequence of locations (A to B to C). Link to organizations for automatic feed updates.")}</p>
              
              {form.stops.map((stop, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-white p-2 border border-slate-100 rounded shadow-sm">
                  <div className="flex-1 space-y-2">
                    <select 
                      className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      value={stop.orgType || ""}
                      onChange={(e) => {
                        const newStops = [...form.stops];
                        newStops[idx] = { ...newStops[idx], orgType: e.target.value, templeId: "" };
                        setForm({ ...form, stops: newStops });
                      }}
                    >
                      <option value="">{t("Select Organization Type (Optional)")}</option>
                      <option value="TEMPLE">{t("Temple")}</option>
                      <option value="STHANAK">{t("Sthanak")}</option>
                      <option value="JAIN_CENTER">{t("Jain Center")}</option>
                      <option value="DHARAMSHALA">{t("Dharamshala")}</option>
                    </select>
                    <SearchableSelect
                      value={stop.templeId}
                      onValueChange={(val) => updateStop(idx, 'templeId', val)}
                      options={stop.orgType ? orgs.filter(o => o.orgType === stop.orgType) : orgs}
                      placeholder={t("Link to Organization (Optional)")}
                      searchPlaceholder={t("Search organizations…")}
                    />
                    <Input 
                      value={stop.templeName} 
                      onChange={(e) => updateStop(idx, 'templeName', e.target.value)} 
                      placeholder={t("Location / Stop Name *")}
                    />
                    <Input 
                      type="datetime-local"
                      value={stop.dateTime || ""} 
                      onChange={(e) => updateStop(idx, 'dateTime', e.target.value)} 
                      min={idx > 0 && form.stops[idx-1].dateTime ? form.stops[idx-1].dateTime : undefined}
                      className="text-xs"
                    />
                  </div>
                  {form.stops.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeStop(idx)} className="mt-1 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStop} className="w-full border-dashed bg-white">
                <Plus className="h-4 w-4 mr-2" /> {t("Add Another Stop")}
              </Button>
            </div>


          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={saveRoute} disabled={saving}>{saving ? t("Saving...") : t("Save Route")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Route Details Modal */}
      <RouteDetailModal 
        routeId={viewRoute?.id} 
        open={!!viewRoute} 
        onOpenChange={(val) => !val && setViewRoute(null)} 
        initialRouteData={viewRoute}
        onRouteUpdated={() => loadRoutesAndMonks()}
      />
    </div>
  );
}
