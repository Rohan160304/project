import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, extractErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { PhoneField } from "@/components/common/PhoneInput";

export function DelegateModuleModal({ open, onClose, moduleKey, orgId, onSuccess }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    permissionLevel: "READ_WRITE"
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.mobile) {
      toast.error(t("Please fill all required fields"));
      return;
    }
    
    try {
      setLoading(true);
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        role: "STAFF",
        organizationIds: [orgId],
        modules: [moduleKey],
        permissionLevel: formData.permissionLevel
      };
      
      const res = await api.post("/auth/admins", payload);
      toast.success(t("Staff account created successfully for this module"));
      
      if (res.data?.data?.tempPassword) {
        setCreatedPassword(res.data.data.tempPassword);
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
      
    } catch (err) {
      toast.error(extractErrorMessage(err) || t("Failed to create staff account"));
    } finally {
      setLoading(false);
    }
  };

  if (createdPassword) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Staff Account Created")}</DialogTitle>
            <p className="text-sm text-slate-500">
              {t("Please share these credentials securely with the staff member.")}
            </p>
          </DialogHeader>
          <div className="bg-slate-50 p-4 rounded-md space-y-2 mt-4 border border-slate-100">
            <p className="text-sm"><span className="font-semibold text-slate-700">{t("Mobile")}:</span> {formData.mobile}</p>
            <p className="text-sm"><span className="font-semibold text-slate-700">{t("Password")}:</span> <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono border border-slate-200">{createdPassword}</code></p>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => {
              if (onSuccess) onSuccess();
              onClose();
            }} className="bg-blue-600 hover:bg-blue-700">
              {t("Done")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Delegate Module Access")}</DialogTitle>
          <p className="text-sm text-slate-500">
            {t("Create a staff account with access limited to")} <strong className="text-slate-800">{moduleKey}</strong>.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("First Name")} *</Label>
              <Input name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>{t("Last Name")}</Label>
              <Input name="lastName" value={formData.lastName} onChange={handleChange} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{t("Mobile Number")} *</Label>
            <PhoneField 
              id="mobile"
              value={formData.mobile} 
              onChange={(val) => setFormData(prev => ({ ...prev, mobile: val }))} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>{t("Access Level")} *</Label>
            <div className="flex space-x-4 mt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="permissionLevel" 
                  value="READ" 
                  checked={formData.permissionLevel === "READ"}
                  onChange={handleChange}
                  className="form-radio text-blue-600"
                />
                <span className="text-sm font-medium">{t("Read Only")}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="permissionLevel" 
                  value="READ_WRITE" 
                  checked={formData.permissionLevel === "READ_WRITE"}
                  onChange={handleChange}
                  className="form-radio text-blue-600"
                />
                <span className="text-sm font-medium">{t("Read & Write")}</span>
              </label>
            </div>
            <p className="text-xs text-slate-500">
              {formData.permissionLevel === "READ" ? t("User can only view the data.") : t("User can view, add, edit and manage data.")}
            </p>
          </div>

          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? t("Creating...") : t("Create Account")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
