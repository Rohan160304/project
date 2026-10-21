const fs = require('fs');

let content = `import React, { useState, useEffect, useMemo } from "react";
import { X, Calendar as CalendarIcon, Users, CreditCard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { memberClient } from "@/lib/memberClient";
import { toast } from "sonner";

export function BhojanshalaBookingModal({ open, onClose, orgId }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [scheduleBooking, setScheduleBooking] = useState(false);
  const [formData, setFormData] = useState({
    mealType: "LUNCH",
    date: new Date().toISOString().split("T")[0],
    numberOfPersons: 1,
  });

  useEffect(() => {
    if (open && orgId) {
      memberClient.get(\`/bhojanshala/\${orgId}/menu\`)
        .then(res => setMenuItems(res.data?.data || []))
        .catch(err => console.error("Failed to fetch menu", err));
      
      setScheduleBooking(false);
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split("T")[0]
      }));
    }
  }, [open, orgId]);

  const currentDayOfWeek = useMemo(() => {
    if (!formData.date) return "";
    return new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' });
  }, [formData.date]);

  const availableMealsForDay = useMemo(() => {
    return menuItems.filter(m => m.dayOfWeek === currentDayOfWeek && m.isAvailable);
  }, [menuItems, currentDayOfWeek]);

  const selectedMenu = useMemo(() => {
    return availableMealsForDay.find(m => m.mealType === formData.mealType);
  }, [availableMealsForDay, formData.mealType]);

  const pricePerPerson = selectedMenu?.price || 0;
  const totalAmount = pricePerPerson * formData.numberOfPersons;

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await memberClient.post(\`/bhojanshala/\${orgId}/passes\`, {
        mealType: formData.mealType,
        date: new Date(formData.date).toISOString(),
        numberOfPersons: Number(formData.numberOfPersons),
        pricePaid: totalAmount,
        status: 'PENDING'
      });
      toast.success(t("Bhojanshala Pass booked successfully!"));
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("Failed to book pass"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-slate-800">{t("Book Bhojanshala Pass")}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <Checkbox 
              id="schedule" 
              checked={scheduleBooking}
              onCheckedChange={(checked) => {
                setScheduleBooking(checked);
                if (!checked) {
                  setFormData(prev => ({ ...prev, date: new Date().toISOString().split("T")[0] }));
                }
              }}
            />
            <label
              htmlFor="schedule"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
            >
              {t("Schedule Booking (Advance)")}
            </label>
          </div>

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
                disabled={!scheduleBooking}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("Meal Type")}</Label>
            <Select 
              value={formData.mealType} 
              onValueChange={(val) => setFormData({ ...formData, mealType: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select Meal")} />
              </SelectTrigger>
              <SelectContent zIndex={200}>
                <SelectItem value="BREAKFAST">{t("Breakfast")}</SelectItem>
                <SelectItem value="LUNCH">{t("Lunch")}</SelectItem>
                <SelectItem value="DINNER">{t("Dinner (Choviyar)")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedMenu && (
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-orange-900 text-sm">{selectedMenu.itemName}</h4>
                  <p className="text-xs text-orange-700">{selectedMenu.description}</p>
                  {(selectedMenu.startTime && selectedMenu.endTime) && (
                     <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                       <CalendarIcon className="w-3 h-3"/> {selectedMenu.startTime} - {selectedMenu.endTime}
                     </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600">₹{pricePerPerson}</div>
                  <div className="text-[10px] text-orange-500 uppercase">{t("per person")}</div>
                </div>
              </div>
            </div>
          )}

          {!selectedMenu && (
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 mt-0.5" />
              <p className="text-xs text-slate-600">
                {t("Menu details are not available for this meal on")} {currentDayOfWeek}.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("Number of Persons")}</Label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.numberOfPersons}
                onChange={(e) => setFormData({ ...formData, numberOfPersons: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-slate-100">
             <div className="text-sm text-slate-600 font-medium">{t("Total Amount")}:</div>
             <div className="text-xl font-bold text-slate-800">₹{totalAmount}</div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
              {loading ? t("Booking...") : t("Confirm Booking")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/modals/BhojanshalaBookingModal.jsx', content);
