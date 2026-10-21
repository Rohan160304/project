import { useState, useEffect } from "react";
import { X, CalendarIcon, Users, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { memberClient } from "@/lib/memberClient";
import { toast } from "sonner";

export function EventHallBookingModal({ open, onClose, orgId, eventHalls = [] }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    eventHallId: "",
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Next day
  });

  useEffect(() => {
    if (open && eventHalls.length > 0) {
      setFormData(prev => ({ ...prev, eventHallId: eventHalls[0].id }));
    }
  }, [open, eventHalls]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.eventHallId) {
      toast.error(t("Please select an event hall"));
      return;
    }

    setLoading(true);
    try {
      await memberClient.post(`/event-halls/book`, {
        eventHallId: formData.eventHallId,
        dateFrom: new Date(formData.fromDate).toISOString(),
        dateTo: new Date(formData.toDate).toISOString(),
      });
      toast.success(t("Event Hall booked successfully!"));
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.error?.message || error?.response?.data?.message || t("Failed to book Event Hall"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-slate-800">{t("Book Event Hall")}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {eventHalls.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-4">
            <div className="bg-slate-100 p-4 rounded-full">
              <Home className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-center font-medium">
              {t("No event halls are currently available at this organization.")}
            </p>
            <Button onClick={onClose} className="mt-4">{t("Close")}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("Event Hall Option")}</Label>
              <select
                value={formData.eventHallId}
                onChange={(e) => setFormData({ ...formData, eventHallId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {eventHalls.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.price ? `(₹${item.price})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("From Date")}</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t("To Date")}</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <Input
                  type="date"
                  min={formData.fromDate}
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>



            <div className="pt-2 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                {t("Cancel")}
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? t("Booking...") : t("Confirm Booking")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
