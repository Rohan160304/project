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

export default function PathshalaManagementPage() {
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
    api.get("/pathshalas?limit=1000") // Fetch organizations
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
        
        // Filter to only those organizations that are PATHSHALAs or have hasPathshala=true
        orgs = orgs.filter(o => o.type === "PATHSHALA" || o.hasPathshala);

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("Pathshala Management")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("Manage buildings, rooms, categories, prices and more.")}</p>
        </div>
        
        {(isGlobalScope || organizations.length > 0) && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">{t("Select Pathshala")}:</label>
            <select
              value={selectedOrgId || ""}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white min-w-[200px]"
              disabled={loadingOrgs}
            >
              <option value="" disabled>-- {t("Select Pathshala")} --</option>
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
              {t("Please select a Pathshala to manage.")}
            </div>
          ) : (
            <>
              {currentTab === "gallery" && <GalleryTab orgId={selectedOrgId} />}
              {currentTab === "settings" && <SettingsTab orgId={selectedOrgId} selectedOrg={selectedOrg} setOrganizations={setOrganizations} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Tab Components ---

const GalleryTab = ({ orgId }) => {
  const { t } = useLanguage();
  const [gallery, setGallery] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadGallery = () => {
    api.get(`/pathshalas/${orgId}`).then(res => {
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
      await api.post(`/pathshalas/${orgId}/gallery/bulk`, formData, {
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
      await api.delete(`/pathshalas/${orgId}/gallery/${imageId}`);
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
          <h3 className="text-lg font-medium">{t("Pathshala Gallery")}</h3>
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
            description={t("Upload images to show in your Pathshala profile.")}
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
      const payload = { pathshalaPublished: !selectedOrg.pathshalaPublished };
      await api.patch(`/temples/${orgId}`, payload);
      toast.success(payload.pathshalaPublished ? t("Pathshala published successfully!") : t("Pathshala unpublished."));
      setOrganizations(orgs => orgs.map(o => o.id === selectedOrg.id ? { ...o, pathshalaPublished: payload.pathshalaPublished } : o));
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
            <h4 className="font-medium text-slate-900">{t("Publish Pathshala")}</h4>
            <p className="text-sm text-slate-500 mt-1">{t("Toggle this to make your Pathshala visible to users for booking.")}</p>
          </div>
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${selectedOrg?.pathshalaPublished ? 'bg-purple-600' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedOrg?.pathshalaPublished ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
