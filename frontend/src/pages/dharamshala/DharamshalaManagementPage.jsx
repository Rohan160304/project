import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, extractErrorMessage } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Building, DoorOpen, PlusCircle, IndianRupee, Layers, 
  Trash, Upload, Image as ImageIcon, Settings, Info, List
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export default function DharamshalaManagementPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "structure";

  const { user, isSuperAdmin, isGlobalScope, organizationIds , activeOrganizationId} = useAuth();
  
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Load organizations like Bhojanshala does
  useEffect(() => {
    setLoadingOrgs(true);
    api.get("/dharamshalas?limit=1000") // Fetch organizations
      .then((res) => {
        let orgs = res.data?.data?.items || res.data?.data || [];
        
        // Filter based on user's scope if they are not a global admin
        if (!isGlobalScope) {
          if (organizationIds && organizationIds.length > 0) {
            orgs = orgs.filter(o => organizationIds.includes(o.id) || organizationIds.includes(o.publicId));
          } else {
            orgs = [];
          }
        }
        
        // Filter to only those organizations that are DHARAMSHALAs or have hasDharamshala=true
        orgs = orgs.filter(o => o.type === "DHARAMSHALA" || o.hasDharamshala);

        setOrganizations(orgs);
        
        // Set default selected org
        const initialOrgId = (activeOrganizationId || user?.organizationIds?.[0]) || (orgs.length > 0 ? orgs[0].id : "");
        if (initialOrgId && !selectedOrgId) {
          setSelectedOrgId(initialOrgId);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingOrgs(false));
  }, [isGlobalScope, organizationIds]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("Dharamshala Management")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("Manage buildings, rooms, categories, prices and more.")}</p>
        </div>
        
        {(isGlobalScope || organizations.length > 0) && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">{t("Select Dharamshala")}:</label>
            <select
              value={selectedOrgId || ""}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white min-w-[200px]"
              disabled={loadingOrgs}
            >
              <option value="" disabled>-- {t("Select Dharamshala")} --</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar">
          <button
            onClick={() => handleTabChange("structure")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "structure"
                ? "border-purple-600 text-purple-700 bg-purple-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building className="w-4 h-4" />
            {t("Structure & Rooms")}
          </button>
          <button
            onClick={() => handleTabChange("amenities")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "amenities"
                ? "border-purple-600 text-purple-700 bg-purple-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <List className="w-4 h-4" />
            {t("Amenities")}
          </button>
          <button
            onClick={() => handleTabChange("gallery")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "gallery"
                ? "border-purple-600 text-purple-700 bg-purple-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            {t("Gallery")}
          </button>
          <button
            onClick={() => handleTabChange("rules")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "rules"
                ? "border-purple-600 text-purple-700 bg-purple-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Info className="w-4 h-4" />
            {t("Rules")}
          </button>
          <button
            onClick={() => handleTabChange("settings")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "settings"
                ? "border-purple-600 text-purple-700 bg-purple-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-4 h-4" />
            {t("Settings")}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-50/50 min-h-[500px]">
          {!selectedOrgId ? (
            <div className="flex items-center justify-center h-64 text-slate-500">
              {t("Please select a Dharamshala to manage.")}
            </div>
          ) : (
            <>
              {currentTab === "structure" && <StructureTab orgId={selectedOrgId} />}
              {currentTab === "amenities" && <AmenitiesTab orgId={selectedOrgId} />}
              {currentTab === "gallery" && <GalleryTab orgId={selectedOrgId} />}
              {currentTab === "rules" && <RulesTab orgId={selectedOrgId} />}
              {currentTab === "settings" && <SettingsTab orgId={selectedOrgId} selectedOrg={selectedOrg} setOrganizations={setOrganizations} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Tab Components ---

const StructureTab = ({ orgId }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [saving, setSaving] = useState(false);

  // Modals
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [activeBuildingId, setActiveBuildingId] = useState(null);
  const [activeWingId, setActiveWingId] = useState(null);

  const [newBuildingName, setNewBuildingName] = useState("");
  const [newFloorName, setNewFloorName] = useState("");
  
  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "ROOM",
    category: "Non-AC",
    capacity: 2,
    pricePerUnit: 0,
    roomNumber: "",
    bedType: "Double",
    amenities: [],
  });

  useEffect(() => {
    if (!orgId) return;
    loadStructure();
  }, [orgId]);

  const loadStructure = async () => {
    setLoading(true);
    try {
      const structRes = await api.get(`/dharamshalas/${orgId}/structure`);
      setBuildings(structRes.data?.data?.buildings || []);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAddBuilding = async () => {
    if (!newBuildingName.trim()) return;
    setSaving(true);
    try {
      await api.post(`/dharamshalas/${orgId}/buildings`, { name: newBuildingName.trim() });
      toast.success(t("Building added successfully!"));
      setIsBuildingModalOpen(false);
      setNewBuildingName("");
      loadStructure();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleAddFloor = async () => {
    if (!newFloorName.trim() || !activeBuildingId) return;
    setSaving(true);
    try {
      await api.post(`/dharamshalas/buildings/${activeBuildingId}/wings`, { name: newFloorName.trim() });
      toast.success(t("Floor added successfully!"));
      setIsFloorModalOpen(false);
      setNewFloorName("");
      loadStructure();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.name.trim() || !activeWingId) return;
    setSaving(true);
    try {
      await api.post(`/dharamshalas/wings/${activeWingId}/rooms`, { ...newRoom });
      toast.success(t("Room added successfully!"));
      setIsRoomModalOpen(false);
      setNewRoom({ name: "", type: "ROOM", category: "Non-AC", capacity: 2, pricePerUnit: 0, roomNumber: "", bedType: "Double", amenities: [] });
      loadStructure();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-purple-50 p-4 rounded-lg border border-purple-100">
        <div>
          <h3 className="font-semibold text-purple-900">{t("Property Structure")}</h3>
          <p className="text-sm text-purple-700">{t("Add buildings, then floors, and finally rooms with prices and categories.")}</p>
        </div>
        <Button onClick={() => setIsBuildingModalOpen(true)} className="bg-purple-700 text-white hover:bg-purple-800">
          <Plus className="h-4 w-4 mr-2" />
          {t("Add Building")}
        </Button>
      </div>

      {buildings.length === 0 ? (
        <EmptyState 
          icon={Building}
          title={t("No Buildings Found")}
          description={t("Start by adding a building. Then you can add floors and rooms to it.")}
          action={<Button onClick={() => setIsBuildingModalOpen(true)}>{t("Add Building")}</Button>}
        />
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
          {buildings.map((b) => (
            <AccordionItem value={`building-${b.id}`} key={b.id} className="border rounded-lg bg-card shadow-sm overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 text-left">
                  <div className="bg-purple-100 p-2 rounded-md">
                    <Building className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{b.name}</h3>
                    <p className="text-sm text-muted-foreground">{b.wings?.length || 0} Floors</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-foreground">{t("Floors / Wings")}</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setActiveBuildingId(b.id); setIsFloorModalOpen(true); }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t("Add Floor")}
                  </Button>
                </div>

                {(!b.wings || b.wings.length === 0) ? (
                  <div className="text-center p-6 bg-muted/30 rounded-md border border-dashed">
                    <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">{t("No floors added to this building yet.")}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {b.wings.map((w) => (
                      <div key={w.id} className="border rounded-md bg-background overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 flex justify-between items-center border-b">
                          <div className="font-medium flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            {w.name}
                          </div>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => { setActiveWingId(w.id); setIsRoomModalOpen(true); }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {t("Add Room")}
                          </Button>
                        </div>
                        
                        <div className="p-4">
                          {(!w.rooms || w.rooms.length === 0) ? (
                            <p className="text-sm text-muted-foreground text-center py-4">{t("No rooms added to this floor yet.")}</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {w.rooms.map((r) => (
                                <Card key={r.id} className="p-4 border-l-4 border-l-blue-500">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h5 className="font-semibold">{r.name}</h5>
                                      {r.roomNumber && <p className="text-xs text-muted-foreground">Room No: {r.roomNumber}</p>}
                                    </div>
                                    <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">
                                      {r.category || "Standard"}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                                    <div className="flex items-center gap-1">
                                      <IndianRupee className="h-3 w-3" />
                                      {r.pricePerUnit || 0}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <DoorOpen className="h-3 w-3" />
                                      {r.capacity} {t("Beds")}
                                    </div>
                                  </div>
                                  {r.amenities && r.amenities.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {r.amenities.map(a => (
                                        <span key={a} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                          {a}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Building Modal */}
      <Dialog open={isBuildingModalOpen} onOpenChange={setIsBuildingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Add New Building")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("Building Name")}</label>
              <Input 
                value={newBuildingName}
                onChange={(e) => setNewBuildingName(e.target.value)}
                placeholder={t("e.g. Main Block")}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuildingModalOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={handleAddBuilding} disabled={!newBuildingName.trim() || saving} className="bg-purple-700 text-white">
              {saving ? t("Saving...") : t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floor Modal */}
      <Dialog open={isFloorModalOpen} onOpenChange={setIsFloorModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Add New Floor / Wing")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("Floor Name")}</label>
              <Input 
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder={t("e.g. Ground Floor, First Floor, North Wing")}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFloorModalOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={handleAddFloor} disabled={!newFloorName.trim() || saving} className="bg-purple-700 text-white">
              {saving ? t("Saving...") : t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Modal */}
      <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Add New Room")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">{t("Room Name / Title")}</label>
              <Input 
                value={newRoom.name}
                onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                placeholder={t("e.g. Deluxe Family Room")}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("Room Number")}</label>
              <Input 
                value={newRoom.roomNumber}
                onChange={(e) => setNewRoom({...newRoom, roomNumber: e.target.value})}
                placeholder={t("e.g. 101")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("Category")}</label>
              <UISelect value={newRoom.category} onValueChange={(val) => setNewRoom({...newRoom, category: val})}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select Category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Non-AC">{t("Non-AC")}</SelectItem>
                  <SelectItem value="AC">{t("AC")}</SelectItem>
                  <SelectItem value="Cooler">{t("Cooler")}</SelectItem>
                  <SelectItem value="Dormitory">{t("Dormitory")}</SelectItem>
                </SelectContent>
              </UISelect>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("Price (per day)")}</label>
              <Input 
                type="number"
                value={newRoom.pricePerUnit}
                onChange={(e) => setNewRoom({...newRoom, pricePerUnit: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("Bed Capacity")}</label>
              <Input 
                type="number"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="col-span-2 space-y-2 mt-2">
              <label className="text-sm font-medium">{t("Room Amenities")}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {["Attached Bathroom", "Western Toilet", "Indian Toilet", "AC", "Cooler", "Geyser", "TV", "Balcony", "WiFi"].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-100 hover:bg-slate-100 transition-colors">
                    <Checkbox 
                      id={`room-amenity-${amenity.replace(/\s+/g, '-')}`} 
                      checked={newRoom.amenities?.includes(amenity)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewRoom({...newRoom, amenities: [...(newRoom.amenities || []), amenity]});
                        } else {
                          setNewRoom({...newRoom, amenities: (newRoom.amenities || []).filter(a => a !== amenity)});
                        }
                      }}
                    />
                    <label htmlFor={`room-amenity-${amenity.replace(/\s+/g, '-')}`} className="text-xs font-medium leading-none cursor-pointer">
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoomModalOpen(false)}>{t("Cancel")}</Button>
            <Button onClick={handleAddRoom} disabled={!newRoom.name.trim() || saving} className="bg-purple-700 text-white">
              {saving ? t("Saving...") : t("Save Room")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AmenitiesTab = ({ orgId }) => {
  const { t } = useLanguage();
  const [facilities, setFacilities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const COMMON_AMENITIES = [
    "Parking", "Lift", "WiFi", "Hot Water", "AC", "Cooler", 
    "Geyser", "Wheelchair Accessible", "Security Guard", "CCTV",
    "24/7 Check-in", "Daily Housekeeping"
  ];

  useEffect(() => {
    if (orgId) {
      setLoading(true);
      api.get(`/dharamshalas/${orgId}`).then(res => {
        setFacilities(res.data?.data?.facilities || []);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [orgId]);

  const handleSaveFacilities = async () => {
    setSaving(true);
    try {
      await api.patch(`/dharamshalas/${orgId}`, { facilities });
      toast.success(t("Amenities updated successfully!"));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="bg-muted/30 px-6 py-4 border-b">
        <h3 className="text-lg font-medium">{t("Amenities Management")}</h3>
        <p className="text-sm text-muted-foreground">{t("Configure parking, lift, wifi and other global amenities here.")}</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {COMMON_AMENITIES.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/20">
              <Checkbox 
                id={`facility-${amenity}`} 
                checked={facilities.includes(amenity)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFacilities([...facilities, amenity]);
                  } else {
                    setFacilities(facilities.filter(f => f !== amenity));
                  }
                }}
              />
              <label htmlFor={`facility-${amenity}`} className="text-sm font-medium leading-none cursor-pointer">
                {amenity}
              </label>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSaveFacilities} disabled={saving} className="bg-purple-700 text-white">
            {saving ? t("Saving...") : t("Save Amenities")}
          </Button>
        </div>
      </div>
    </div>
  );
};

const RulesTab = ({ orgId }) => {
  const { t } = useLanguage();
  const [rulesText, setRulesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId) {
      setLoading(true);
      api.get(`/dharamshalas/${orgId}`).then(res => {
        setRulesText(res.data?.data?.rulesText || "");
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [orgId]);

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      await api.patch(`/dharamshalas/${orgId}`, { rulesText });
      toast.success(t("Rules updated successfully!"));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="bg-muted/30 px-6 py-4 border-b">
        <h3 className="text-lg font-medium">{t("Rules & Policies")}</h3>
        <p className="text-sm text-muted-foreground">{t("Set check-in/out times, cancellation policies, etc.")}</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("Rules & Regulations")}</label>
          <Textarea 
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            placeholder={t("Enter rules, check-in policies, ID requirements, etc.")}
            className="min-h-[200px]"
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveRules} disabled={saving} className="bg-purple-700 text-white">
            {saving ? t("Saving...") : t("Save Rules")}
          </Button>
        </div>
      </div>
    </div>
  );
};

const GalleryTab = ({ orgId }) => {
  const { t } = useLanguage();
  const [gallery, setGallery] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadGallery = () => {
    api.get(`/dharamshalas/${orgId}`).then(res => {
      setGallery(res.data?.data?.gallery || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (orgId) {
      setLoading(true);
      loadGallery();
    }
  }, [orgId]);

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    setSaving(true);
    try {
      await api.post(`/dharamshalas/${orgId}/gallery/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t("Images uploaded successfully!"));
      loadGallery();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
      e.target.value = null;
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm(t("Are you sure you want to delete this image?"))) return;
    setSaving(true);
    try {
      await api.delete(`/dharamshalas/${orgId}/gallery/${imageId}`);
      toast.success(t("Image deleted successfully!"));
      loadGallery();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="bg-muted/30 px-6 py-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t("Dharamshala Gallery")}</h3>
          <p className="text-sm text-muted-foreground">{t("Upload images of the exterior, reception, rooms, etc.")}</p>
        </div>
        <div>
          <input
            type="file"
            multiple
            accept="image/*"
            id="gallery-upload"
            className="hidden"
            onChange={handleGalleryUpload}
          />
          <label htmlFor="gallery-upload">
            <Button variant="outline" asChild disabled={saving}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {saving ? t("Uploading...") : t("Upload Images")}
              </span>
            </Button>
          </label>
        </div>
      </div>
      
      <div className="p-6">
        {(!gallery || gallery.length === 0) ? (
          <EmptyState 
            icon={ImageIcon}
            title={t("No Images Found")}
            description={t("Upload images to show in your Dharamshala profile.")}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((img) => (
              <div key={img._id || img.id} className="relative group rounded-lg overflow-hidden border aspect-video bg-muted/20">
                <img 
                  src={img.url} 
                  alt="Gallery" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDeleteImage(img._id || img.id)}
                    disabled={saving}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsTab = ({ orgId, selectedOrg, setOrganizations }) => {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const handleTogglePublish = async () => {
    if (!selectedOrg) return;
    setSaving(true);
    try {
      const payload = { dharamshalaPublished: !selectedOrg.dharamshalaPublished };
      await api.patch(`/temples/${orgId}`, payload);
      toast.success(payload.dharamshalaPublished ? t("Dharamshala published successfully!") : t("Dharamshala unpublished."));
      setOrganizations(orgs => orgs.map(o => o.id === selectedOrg.id ? { ...o, dharamshalaPublished: payload.dharamshalaPublished } : o));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-4">{t("Global Settings")}</h3>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <h4 className="font-medium text-slate-900">{t("Publish Dharamshala")}</h4>
            <p className="text-sm text-slate-500 mt-1">{t("Toggle this to make your Dharamshala visible to users for booking.")}</p>
          </div>
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${selectedOrg?.dharamshalaPublished ? 'bg-purple-600' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedOrg?.dharamshalaPublished ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
