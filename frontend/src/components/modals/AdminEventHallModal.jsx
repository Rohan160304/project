import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";

export function AdminEventHallModal({ open, onClose, orgId, apiClient, apiPrefix, initialData, onSuccess }) {
  const { t } = useLanguage();
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    roomCount: "",
    foodAvailable: false,
    facilities: "",
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.name || "",
        price: initialData.price?.toString() || "",
        roomCount: initialData.roomCount?.toString() || "",
        foodAvailable: initialData.foodAvailable || false,
        facilities: initialData.facilities || "",
        isActive: initialData.isActive !== false
      });
    } else if (open) {
      setFormData({
        name: "",
        price: "",
        roomCount: "",
        foodAvailable: false,
        facilities: "",
        isActive: true
      });
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error(t("Name is required"));
    
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        price: formData.price ? parseFloat(formData.price) : null,
        roomCount: formData.roomCount ? parseInt(formData.roomCount) : 0,
        foodAvailable: formData.foodAvailable,
        facilities: formData.facilities,
        isActive: formData.isActive
      };

      if (isEditing) {
        await apiClient.put(`/event-halls/${initialData.id}`, payload);
        toast.success(t("Event Hall updated successfully"));
      } else {
        await apiClient.post(`/event-halls/orgs/${orgId}`, payload);
        toast.success(t("Event Hall added successfully"));
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t(isEditing ? "Failed to update event hall" : "Failed to add event hall"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("Edit Event Hall") : t("Add Event Hall")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("Hall Name")} <span className="text-red-500">*</span></Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Main Banquet Hall" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t("Price (₹)")}</Label>
              <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomCount">{t("Room Capacity")}</Label>
              <Input id="roomCount" name="roomCount" type="number" value={formData.roomCount} onChange={handleChange} placeholder="Number of rooms" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="facilities">{t("Facilities")}</Label>
            <Textarea id="facilities" name="facilities" value={formData.facilities} onChange={handleChange} placeholder="AC, Projector, Stage, etc." className="h-20" />
          </div>
          
          <div className="flex items-center justify-between border p-3 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">{t("Food Available")}</Label>
              <div className="text-sm text-slate-500">{t("Does this hall offer catering?")}</div>
            </div>
            <Switch checked={formData.foodAvailable} onCheckedChange={(c) => handleSwitchChange("foodAvailable", c)} />
          </div>

          <div className="flex items-center justify-between border p-3 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">{t("Is Active")}</Label>
              <div className="text-sm text-slate-500">{t("Enable or disable this hall")}</div>
            </div>
            <Switch checked={formData.isActive} onCheckedChange={(c) => handleSwitchChange("isActive", c)} />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>{t("Cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("Saving...") : t("Save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
