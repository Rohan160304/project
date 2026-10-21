import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ChangePasswordModal({ open, onClose, apiClient }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const resetForm = () => {
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.newPassword) {
      toast.error(t("New password is required."));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error(t("New passwords do not match."));
      return;
    }

    setLoading(true);
    try {
      if (form.currentPassword) {
        // Change existing password
        await apiClient.post("/auth/password/change", {
          oldPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      } else {
        // Set new password
        await apiClient.post("/auth/password/set", {
          password: form.newPassword,
        });
      }
      toast.success(t("Password updated successfully."));
      handleClose();
    } catch (err) {
      let msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || t("Failed to update password");
      if (err.response?.data?.error?.fieldErrors) {
        const fields = Object.values(err.response.data.error.fieldErrors).flat();
        if (fields.length > 0) msg += ": " + fields[0];
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-orange-500" />
            {t("Set / Change Password")}
          </DialogTitle>
          <DialogDescription>
            {t("Update your password to keep your account secure.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t("Current Password (Optional)")}</Label>
            <Input
              type="password"
              placeholder={t("Leave empty if you don't have one")}
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground">
              {t("Required only if you are changing an existing password.")}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t("New Password *")}</Label>
            <Input
              type="password"
              placeholder={t("Enter new password")}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t("Confirm New Password *")}</Label>
            <Input
              type="password"
              placeholder={t("Confirm new password")}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.newPassword || !form.confirmPassword}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("Save Password")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
