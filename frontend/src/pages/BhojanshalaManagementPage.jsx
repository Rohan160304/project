import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Clock,
  Utensils,
  Ticket,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  MoreVertical,
  QrCode,
  Settings,
  Users
} from "lucide-react";
import { api, extractErrorMessage } from "../lib/api";
import { toast } from "sonner";
import { ScanPassModal } from "../components/modals/ScanPassModal";
import CreatePassModal from "../components/modals/CreatePassModal";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const BhojanshalaManagementPage = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "timings";

  const { isGlobalScope, organizationIds } = useAuth();
  
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  useEffect(() => {
    setLoadingOrgs(true);
    api.get("/bhojanshalas?limit=1000") // Fetch organizations
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
        
        // Filter to only those organizations that are BHOJANSHALAs or have hasBhojanshala=true
        orgs = orgs.filter(o => o.type === "BHOJANSHALA" || o.hasBhojanshala);

        setOrganizations(orgs);
        if (orgs.length > 0 && !selectedOrgId) {
          setSelectedOrgId(orgs[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingOrgs(false));
  }, [isGlobalScope, organizationIds]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleTogglePublish = async () => {
    if (!selectedOrg) return;
    try {
      const payload = { bhojanshalaPublished: !selectedOrg.bhojanshalaPublished };
      await api.patch(`/temples/${selectedOrg.id}`, payload);
      toast.success(payload.bhojanshalaPublished ? "Bhojanshala published successfully!" : "Bhojanshala unpublished.");
      setOrganizations(orgs => orgs.map(o => o.id === selectedOrg.id ? { ...o, bhojanshalaPublished: payload.bhojanshalaPublished } : o));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bhojanshala Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage timings, pricing, menus, and booking passes.</p>
        </div>
        
        {(isGlobalScope || organizations.length > 0) && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Select Organization:</label>
            <select
              value={selectedOrgId || ""}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white min-w-[200px]"
              disabled={loadingOrgs}
            >
              <option value="" disabled>-- Select Bhojanshala --</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.bhojanshalaName || org.name}
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
            onClick={() => handleTabChange("timings")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "timings"
                ? "border-orange-500 text-orange-600 bg-orange-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Clock className="w-4 h-4" />
            Timings & Prices
          </button>
          <button
            onClick={() => handleTabChange("menu")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "menu"
                ? "border-orange-500 text-orange-600 bg-orange-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Utensils className="w-4 h-4" />
            Menu Management
          </button>
          <button
            onClick={() => handleTabChange("passes")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "passes"
                ? "border-orange-500 text-orange-600 bg-orange-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Ticket className="w-4 h-4" />
            Pass Management
          </button>
          <button
            onClick={() => handleTabChange("managers")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "managers"
                ? "border-orange-500 text-orange-600 bg-orange-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" />
            Managers
          </button>
          <button
            onClick={() => handleTabChange("settings")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === "settings"
                ? "border-orange-500 text-orange-600 bg-orange-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-50/50 min-h-[500px]">
          {!selectedOrgId ? (
            <div className="flex items-center justify-center h-64 text-slate-500">
              Please select an organization to manage Bhojanshala.
            </div>
          ) : (
            <>
              {currentTab === "timings" && <TimingsTab orgId={selectedOrgId} selectedOrg={selectedOrg} />}
              {currentTab === "menu" && <MenuTab orgId={selectedOrgId} />}
              {currentTab === "passes" && <PassesTab orgId={selectedOrgId} />}
              {currentTab === "managers" && <ManagersTab orgId={selectedOrgId} />}
              {currentTab === "settings" && <SettingsTab orgId={selectedOrgId} selectedOrg={selectedOrg} setOrganizations={setOrganizations} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BhojanshalaManagementPage;

// --- Tab Components ---

const TimingsTab = ({ orgId, selectedOrg }) => {
  const [formData, setFormData] = useState({
    bhojanshalaBreakfastTiming: "",
    bhojanshalaBreakfastCharge: "",
    bhojanshalaLunchTiming: "",
    bhojanshalaLunchCharge: "",
    bhojanshalaDinnerTiming: "",
    bhojanshalaDinnerCharge: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch latest org details specifically if selectedOrg is not fully populated with these fields
    if (orgId) {
      api.get(`/temples/${orgId}`).then(res => {
        const org = res.data?.data || selectedOrg || {};
        setFormData({
          bhojanshalaBreakfastTiming: org.bhojanshalaBreakfastTiming || "",
          bhojanshalaBreakfastCharge: org.bhojanshalaBreakfastCharge || "",
          bhojanshalaLunchTiming: org.bhojanshalaLunchTiming || "",
          bhojanshalaLunchCharge: org.bhojanshalaLunchCharge || "",
          bhojanshalaDinnerTiming: org.bhojanshalaDinnerTiming || "",
          bhojanshalaDinnerCharge: org.bhojanshalaDinnerCharge || "",
        });
      }).catch(console.error);
    }
  }, [orgId, selectedOrg]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put(`/bhojanshala/${orgId}/timings`, formData);
      toast.success(t("Timings and prices saved successfully!"));
    } catch (err) {
      toast.error(t("Error saving: ") + extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-4">Set Timings & Charges</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Breakfast */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              Breakfast
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Timing (e.g., 08:00 AM - 10:00 AM)</label>
                <input name="bhojanshalaBreakfastTiming" value={formData.bhojanshalaBreakfastTiming} onChange={handleChange} type="text" placeholder="08:00 AM - 10:00 AM" className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Charge (₹)</label>
                <input name="bhojanshalaBreakfastCharge" value={formData.bhojanshalaBreakfastCharge} onChange={handleChange} type="number" placeholder="50" className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Lunch */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Lunch
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Timing (e.g., 12:00 PM - 02:00 PM)</label>
                <input name="bhojanshalaLunchTiming" value={formData.bhojanshalaLunchTiming} onChange={handleChange} type="text" placeholder="12:00 PM - 02:00 PM" className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Charge (₹)</label>
                <input name="bhojanshalaLunchCharge" value={formData.bhojanshalaLunchCharge} onChange={handleChange} type="number" placeholder="100" className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Dinner */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Dinner
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Timing (e.g., 06:00 PM - 08:30 PM)</label>
                <input name="bhojanshalaDinnerTiming" value={formData.bhojanshalaDinnerTiming} onChange={handleChange} type="text" placeholder="05:30 PM - 07:30 PM" className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Charge (₹)</label>
                <input name="bhojanshalaDinnerCharge" value={formData.bhojanshalaDinnerCharge} onChange={handleChange} type="number" placeholder="100" className="w-full mt-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuTab = ({ orgId }) => {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    mealType: "BREAKFAST",
    itemName: "",
    description: "",
    startTime: "",
    endTime: "",
    price: "",
  });

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bhojanshala/${orgId}/menu`, { params: { dayOfWeek: selectedDay } });
      setMenuItems(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchMenu();
  }, [orgId, selectedDay]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        mealType: item.mealType,
        itemName: item.itemName,
        description: item.description || "",
        startTime: item.startTime || "",
        endTime: item.endTime || "",
        price: item.price !== null ? item.price : "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        mealType: "BREAKFAST",
        itemName: "",
        description: "",
        startTime: "",
        endTime: "",
        price: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dayOfWeek: selectedDay,
        price: formData.price ? parseFloat(formData.price) : null,
      };

      if (editingItem) {
        await api.put(`/bhojanshala/${orgId}/menu/${editingItem.id}`, payload);
      } else {
        await api.post(`/bhojanshala/${orgId}/menu`, payload);
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      toast.error(t("Error saving menu: ") + extractErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("Are you sure you want to delete this menu item?"))) {
      try {
        await api.delete(`/bhojanshala/${orgId}/menu/${id}`);
        fetchMenu();
      } catch (err) {
        toast.error(t("Error deleting menu item: ") + extractErrorMessage(err));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                selectedDay === day 
                ? "bg-orange-100 text-orange-700 border border-orange-200" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Menu Item
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="font-medium text-slate-800">Menu for {selectedDay}</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading menu...</div>
        ) : menuItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No menu items found for {selectedDay}.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {menuItems.map((menu) => (
              <div key={menu.id} className="p-4 hover:bg-slate-50 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      menu.mealType === "BREAKFAST" ? "bg-yellow-100 text-yellow-800" :
                      menu.mealType === "LUNCH" ? "bg-orange-100 text-orange-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {menu.mealType}
                    </span>
                    {(menu.startTime || menu.price !== null) && (
                      <div className="flex gap-2 text-xs text-slate-500 font-medium">
                        {menu.startTime && <span>Timing: {menu.startTime} - {menu.endTime}</span>}
                        {menu.price !== null && <span>• ₹{menu.price}</span>}
                      </div>
                    )}
                  </div>
                  <p className="text-slate-700 text-sm font-medium">{menu.itemName}</p>
                  {menu.description && <p className="text-slate-500 text-xs mt-0.5">{menu.description}</p>}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button onClick={() => handleOpenModal(menu)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(menu.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'} ({selectedDay})</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMenu} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meal Type *</label>
                <select required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={formData.mealType} onChange={(e) => setFormData({...formData, mealType: e.target.value})}>
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Menu Items *</label>
                <input required type="text" placeholder="e.g., Dal, Roti, Rice" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input type="text" placeholder="Extra details..." className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-500 mb-3">Leave below fields empty to use the default timings and prices for this meal.</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Start Time (Override)</label>
                    <input type="text" placeholder="08:00 AM" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">End Time (Override)</label>
                    <input type="text" placeholder="10:00 AM" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Price (Override ₹)</label>
                  <input type="number" placeholder="50" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PassesTab = ({ orgId }) => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatePassModalOpen, setIsCreatePassModalOpen] = useState(false);

  const fetchPasses = () => {
    if (orgId) {
      setLoading(true);
      api.get(`/bhojanshala/${orgId}/passes`)
        .then(res => setPasses(res.data?.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  
  const handleCancel = async (passId) => {
    if (!window.confirm(t("Are you sure you want to cancel this pass?"))) return;
    let toastId;
    try {
      toastId = toast.loading(t("Cancelling pass..."));
      await api.patch(`/bhojanshala/${orgId}/passes/${passId}/cancel`);
      toast.success(t("Pass cancelled successfully"), { id: toastId });
      fetchPasses();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(extractErrorMessage(error));
    }
  };

  const handleApprove = async (passId) => {
    let toastId;
    try {
      toastId = toast.loading(t("Approving pass..."));
      await api.patch(`/bhojanshala/${orgId}/passes/${passId}/approve`);
      toast.success(t("Pass approved successfully"), { id: toastId });
      fetchPasses();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(extractErrorMessage(error));
    }
  };

  const handlePending = async (passId) => {
    let toastId;
    try {
      toastId = toast.loading(t("Moving to pending..."));
      await api.patch(`/bhojanshala/${orgId}/passes/${passId}/pending`);
      toast.success(t("Pass marked as pending"), { id: toastId });
      fetchPasses();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(extractErrorMessage(error));
    }
  };


  useEffect(() => {
    fetchPasses();
  }, [orgId]);

  const filteredPasses = passes.filter((p) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = p.member?.firstName?.toLowerCase().includes(q) || p.member?.lastName?.toLowerCase().includes(q);
    const idMatch = p.id?.toLowerCase().includes(q) || p.publicId?.toLowerCase().includes(q);
    return nameMatch || idMatch;
  });


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search bookings by ID or Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            Scan Pass
          </button>
          <button 
            onClick={() => setIsCreatePassModalOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Pass
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-4">Booking ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Date & Meal</th>
              <th className="px-6 py-4">Guests</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="text-center p-8 text-slate-500">Loading passes...</td></tr>
            ) : passes.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-8 text-slate-500">No passes found.</td></tr>
            ) : filteredPasses.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-8 text-slate-500">No matching passes found.</td></tr>
            ) : filteredPasses.map((bkg) => (
              <tr key={bkg.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{bkg.status === "PENDING" ? <span className="text-slate-400 text-xs italic font-normal">Pending Approval</span> : <span className="font-mono text-orange-700">{bkg.publicId}</span>}</td>
                <td className="px-6 py-4 text-slate-700">{bkg.member?.firstName} {bkg.member?.lastName}</td>
                <td className="px-6 py-4">
                  <div className="text-slate-900">{new Date(bkg.date).toLocaleDateString()}</div>
                  <div className="text-xs text-slate-500">{bkg.mealType}</div>
                </td>
                <td className="px-6 py-4 text-slate-700">{bkg.numberOfPersons}</td>
                <td className="px-6 py-4 text-slate-700 font-medium">₹{bkg.totalAmount}</td>
                <td className="px-6 py-4">
                  {bkg.status === 'BOOKED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3"/> Active
                    </span>
                  )}
                  {bkg.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  )}
                  {bkg.status === 'SCANNED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Scanned
                    </span>
                  )}
                  {['EXPIRED', 'CANCELLED'].includes(bkg.status) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {bkg.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                  <select
                    className="text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none hover:bg-slate-50 transition-colors cursor-pointer"
                    value={['SCANNED', 'EXPIRED'].includes(bkg.status) ? bkg.status : bkg.status}
                    onChange={(e) => {
                      if (e.target.value === 'BOOKED' && bkg.status !== 'BOOKED') handleApprove(bkg.id);
                      else if (e.target.value === 'CANCELLED' && bkg.status !== 'CANCELLED') handleCancel(bkg.id);
                      else if (e.target.value === 'PENDING' && bkg.status !== 'PENDING') handlePending(bkg.id);
                    }}
                    disabled={['SCANNED', 'EXPIRED'].includes(bkg.status)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="BOOKED">Approved</option>
                    <option value="CANCELLED">Cancelled</option>
                    {['SCANNED', 'EXPIRED'].includes(bkg.status) && (
                      <option value={bkg.status}>{bkg.status.charAt(0) + bkg.status.slice(1).toLowerCase()}</option>
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ScanPassModal 
        isOpen={isScanModalOpen} 
        onClose={() => setIsScanModalOpen(false)} 
        organizationId={orgId} 
        onScanSuccess={fetchPasses}
      />
      
      <CreatePassModal
        isOpen={isCreatePassModalOpen}
        onClose={() => setIsCreatePassModalOpen(false)}
        organizationId={orgId}
        onSuccess={fetchPasses}
      />
    </div>
  );
};

const ManagersTab = ({ orgId }) => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchManagers = () => {
    if (!orgId) return;
    setLoading(true);
    api.get(`/bhojanshala/${orgId}/managers`)
      .then(res => setManagers(res.data?.data || []))
      .catch(err => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchManagers();
  }, [orgId]);

  const handleAddManager = async (e) => {
    e.preventDefault();
    if (!mobile || mobile.length < 10) {
      toast.error(t("Please enter a valid mobile number."));
      return;
    }
    
    try {
      setIsAdding(true);
      const res = await api.post(`/bhojanshala/${orgId}/managers`, { mobile });
      toast.success(t("Manager added successfully!"));
      if (res.data?.data?.tempPassword) {
        // Show the temporary password for a new user in the real world
        toast.info(t(`Generated Password: ${res.data.data.tempPassword}`), { duration: 10000 });
      }
      setMobile("");
      fetchManagers();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm(t("Are you sure you want to remove this manager?"))) return;
    try {
      await api.delete(`/bhojanshala/${orgId}/managers/${userId}`);
      toast.success(t("Manager removed successfully."));
      fetchManagers();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-4">Bhojanshala Managers</h3>
        
        <form onSubmit={handleAddManager} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Add Manager by Mobile Number</label>
            <input 
              type="text" 
              placeholder="e.g. 9876543210" 
              className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm" 
              value={mobile} 
              onChange={(e) => setMobile(e.target.value)} 
            />
          </div>
          <button 
            type="submit" 
            disabled={isAdding}
            className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isAdding ? "Adding..." : "Add Manager"}
          </button>
        </form>

        <div className="mt-6 border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Mobile Number</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="3" className="text-center p-8 text-slate-500">Loading managers...</td></tr>
              ) : managers.length === 0 ? (
                <tr><td colSpan="3" className="text-center p-8 text-slate-500">No managers found.</td></tr>
              ) : (
                managers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {m.user?.firstName} {m.user?.lastName}
                      {(!m.user?.firstName && !m.user?.lastName) ? "Unnamed User" : ""}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{m.user?.mobile}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRemove(m.userId)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsTab = ({ orgId, selectedOrg, setOrganizations }) => {
  const [loading, setLoading] = useState(false);
  const [bhojanshalaName, setBhojanshalaName] = useState("");

  useEffect(() => {
    if (selectedOrg) {
      setBhojanshalaName(selectedOrg.bhojanshalaName || "");
    }
  }, [selectedOrg]);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await api.patch(`/temples/${orgId}`, { bhojanshalaName });
      toast.success(t("Settings saved successfully!"));
      setOrganizations(orgs => orgs.map(o => o.id === orgId ? { ...o, bhojanshalaName } : o));
    } catch (err) {
      toast.error("Error saving settings: " + extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!selectedOrg) return;
    try {
      const payload = { bhojanshalaPublished: !selectedOrg.bhojanshalaPublished };
      await api.patch(`/temples/${selectedOrg.id}`, payload);
      toast.success(payload.bhojanshalaPublished ? "Bhojanshala published successfully!" : "Bhojanshala unpublished.");
      setOrganizations(orgs => orgs.map(o => o.id === selectedOrg.id ? { ...o, bhojanshalaPublished: payload.bhojanshalaPublished } : o));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-4">Bhojanshala Settings</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div>
              <h4 className="font-medium text-slate-800">Publish Bhojanshala</h4>
              <p className="text-sm text-slate-500 mt-1">Make this Bhojanshala visible to members on the mobile app.</p>
            </div>
            <button
              onClick={handleTogglePublish}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${selectedOrg?.bhojanshalaPublished ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedOrg?.bhojanshalaPublished ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bhojanshala Name (Optional)</label>
            <p className="text-xs text-slate-500 mb-3">If left blank, the temple or organization name will be used.</p>
            <input 
              type="text" 
              placeholder="e.g. Shri Mahavir Bhojanshala" 
              className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm max-w-md" 
              value={bhojanshalaName} 
              onChange={(e) => setBhojanshalaName(e.target.value)} 
            />
          </div>

          <div className="pt-4 border-t flex justify-start">
            <button 
              onClick={handleSaveSettings} 
              disabled={loading}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
