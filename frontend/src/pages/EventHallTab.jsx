import React, { useState, useEffect, useContext } from "react";
import { toast } from "sonner";
import { ApiClientContext } from "./OrgDetailPage";
import { useLanguage } from "../contexts/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { EventHallBookingModal } from "@/components/modals/EventHallBookingModal";
import { AdminEventHallModal } from "@/components/modals/AdminEventHallModal";

export default function EventHallTab({ org, apiPrefix, onRefresh, canEdit }) {
  const apiClient = useContext(ApiClientContext);
  const { t } = useLanguage();
  
  const [eventHalls, setEventHalls] = useState([]);
  const [loadingHalls, setLoadingHalls] = useState(false);
  
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);

  useEffect(() => {
    fetchEventHalls();
    if (canEdit) {
      fetchBookings();
    }
  }, [org.id, canEdit]);

  const fetchEventHalls = async () => {
    setLoadingHalls(true);
    try {
      // Assuming public route to get event halls
      const res = await apiClient.get(`/event-halls/orgs/${org.id}`);
      setEventHalls(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to load event halls"));
    } finally {
      setLoadingHalls(false);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      // Fetch event hall bookings specifically
      const res = await apiClient.get(`/event-halls/orgs/${org.id}/bookings`);
      setBookings(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleDeleteHall = async (id) => {
    if (!window.confirm(t("Are you sure you want to delete this event hall?"))) return;
    try {
      await apiClient.delete(`/event-halls/${id}`);
      toast.success(t("Event Hall deleted successfully"));
      fetchEventHalls();
    } catch (err) {
      toast.error(t("Failed to delete event hall"));
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await apiClient.put(`/event-halls/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(t(`Booking status updated to ${newStatus}`));
      fetchBookings();
    } catch (err) {
      toast.error(t("Failed to update booking status"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Halls List Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">{t("Event Halls")}</h2>
        {canEdit && (
          <Button 
            size="sm" 
            onClick={() => { setEditingHall(null); setAdminModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("Add Event Hall")}
          </Button>
        )}
      </div>

      {loadingHalls ? (
        <div className="text-center py-6 text-sm text-slate-500">{t("Loading event halls...")}</div>
      ) : eventHalls.length === 0 ? (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-slate-500 mb-4">{t("No event halls available")}</div>
            {!canEdit && <div className="text-xs text-slate-400">{t("This organization has not added any event halls yet.")}</div>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventHalls.map(hall => (
            <Card key={hall.id} className="overflow-hidden hover:shadow-md transition-shadow relative group">
              <CardContent className="p-0">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{hall.name}</h3>
                    <div className="text-sm text-slate-500 mt-1">
                      {hall.price ? `₹${hall.price}` : t("Price not specified")}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex space-x-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => { setEditingHall(hall); setAdminModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => handleDeleteHall(hall.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-4 text-sm space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-medium">{t("Capacity")}:</span>
                    <span>{hall.roomCount > 0 ? `${hall.roomCount} Rooms` : t("N/A")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">{t("Food Available")}:</span>
                    <span>{hall.foodAvailable ? t("Yes") : t("No")}</span>
                  </div>
                  {hall.facilities && (
                    <div>
                      <span className="font-medium block mb-1">{t("Facilities")}:</span>
                      <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded">{hall.facilities}</p>
                    </div>
                  )}
                  {!hall.isActive && (
                    <Badge variant="destructive" className="mt-2">{t("Inactive")}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bookings Section (Admin Only) */}
      {canEdit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              {t("Event Hall Booking Requests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="text-center py-6 text-sm text-slate-500">{t("Loading bookings...")}</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">
                {t("No event hall bookings found.")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold text-slate-600">Event Hall</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-600">Date/Time</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-600">Requested By</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-600">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookings.map(b => {
                      // Find the hall name if available
                      const hallName = eventHalls.find(h => h.id === b.eventHallId)?.name || "Unknown Hall";
                      
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-medium text-slate-700">{hallName}</td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-800">{new Date(b.date || b.bookingDate).toLocaleDateString()}</div>
                            <div className="text-slate-500">{b.timeSlot}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-800">{b.member?.user?.name || b.member?.fullName || t("Unknown User")}</div>
                            <div className="text-slate-500">{b.member?.user?.mobile || b.member?.user?.phone || "-"}</div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={b.status === "APPROVED" ? "success" : b.status === "REJECTED" ? "destructive" : "secondary"}>
                              {b.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            {(b.status === "PENDING" || b.status === "SUBMITTED") && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] text-green-700 bg-green-50 hover:bg-green-100 border-green-200" onClick={() => updateBookingStatus(b.id, "APPROVED")}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] text-red-700 bg-red-50 hover:bg-red-100 border-red-200" onClick={() => updateBookingStatus(b.id, "REJECTED")}>
                                  <XCircle className="h-3 w-3 mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Book Button (Member Only) */}
      {!canEdit && eventHalls.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button onClick={() => setBookingModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-2 rounded-full font-semibold shadow-md text-white">
            {t("Book Event Hall")}
          </Button>
        </div>
      )}

      {/* Modals */}
      <EventHallBookingModal 
        open={bookingModalOpen} 
        onClose={() => setBookingModalOpen(false)} 
        orgId={org.id}
        eventHalls={eventHalls}
      />

      <AdminEventHallModal
        open={adminModalOpen}
        onClose={() => { setAdminModalOpen(false); setEditingHall(null); }}
        orgId={org.id}
        apiClient={apiClient}
        apiPrefix={apiPrefix}
        initialData={editingHall}
        onSuccess={fetchEventHalls}
      />
    </div>
  );
}
