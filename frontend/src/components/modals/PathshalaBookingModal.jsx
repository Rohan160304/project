import { useState } from "react";
import { X, CalendarIcon, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { memberClient } from "@/lib/memberClient";
import { toast } from "sonner";

export function PathshalaBookingModal({ open, onClose, orgId }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    numberOfPersons: 1,
  });

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await memberClient.post(`/pathshala/${orgId}/bookings`, {
        date: new Date(formData.date).toISOString(),
        numberOfPersons: Number(formData.numberOfPersons),
      });
      toast.success(t("Pathshala registered successfully!"));
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("Failed to register for Pathshala"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-slate-800">{t("Register for Pathshala")}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("Date")}</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("Persons")}</Label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.numberOfPersons}
                onChange={(e) => setFormData({ ...formData, numberOfPersons: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
              {loading ? t("Registering...") : t("Confirm Registration")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
