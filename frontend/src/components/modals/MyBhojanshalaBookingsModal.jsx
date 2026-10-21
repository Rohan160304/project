import React, { useEffect, useState } from "react";
import { X, Calendar, MapPin, Receipt, Clock } from "lucide-react";
import { memberClient } from "@/lib/memberClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function MyBhojanshalaBookingsModal({ open, onClose }) {
  const { t } = useLanguage();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      memberClient.get('/bhojanshala/my-passes')
        .then(res => {
          let data = res.data?.data || [];
          
          const statusPriority = {
            'BOOKED': 1,
            'PENDING': 2,
            'SCANNED': 3,
            'EXPIRED': 4,
            'CANCELLED': 5
          };

          data.sort((a, b) => {
            const pA = statusPriority[a.status] || 99;
            const pB = statusPriority[b.status] || 99;
            if (pA !== pB) return pA - pB;
            return new Date(b.date) - new Date(a.date);
          });

          setPasses(data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col h-[80vh] sm:h-[600px] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b shrink-0 bg-white z-10 sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t("My Bhojanshala Passes")}</h2>
            <p className="text-xs text-slate-500">{t("Your booking history")}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-50 space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-100">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))
          ) : passes.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{t("No bookings found")}</p>
            </div>
          ) : (
            passes.map(pass => (
              <div key={pass.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{pass.organization?.name}</h3>
                      <div className="flex items-center text-xs text-slate-500 mt-1 gap-2">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(pass.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {pass.mealType}</span>
                      </div>
                    </div>
                    {pass.status === 'PENDING' && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>}
                    {pass.status === 'BOOKED' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>}
                    {pass.status === 'SCANNED' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Used</Badge>}
                    {['EXPIRED', 'CANCELLED'].includes(pass.status) && <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{pass.status}</Badge>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Guests</p>
                      <p className="font-semibold text-slate-800">{pass.numberOfPersons}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Amount</p>
                      <p className="font-semibold text-slate-800">₹{pass.totalAmount}</p>
                    </div>
                  </div>

                  {pass.status !== 'PENDING' && (
                    <div className="mt-4 flex items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Booking ID</p>
                        <p className="text-xl font-mono font-bold tracking-widest text-slate-800">{pass.publicId}</p>
                      </div>
                    </div>
                  )}
                  {pass.status === 'PENDING' && (
                     <div className="mt-4 flex items-center justify-center p-3 border border-slate-100 rounded-lg bg-orange-50/50">
                       <p className="text-xs text-orange-600 text-center">Your pass is awaiting admin approval. Booking ID will be generated upon confirmation.</p>
                     </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
