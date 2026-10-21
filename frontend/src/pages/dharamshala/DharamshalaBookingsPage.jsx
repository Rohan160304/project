import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/common/PageHeader";
import { OrgSelect } from "@/components/common/OrgSelect";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgs } from "@/hooks/useOrgs";
import { api, extractErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { CalendarCheck, Eye, Check, X, QrCode } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RoomStatusTab } from "./RoomStatusTab";
import { QrScanner } from "@/components/common/QrScanner";

export default function DharamshalaBookingsPage({ orgId: propOrgId, hideHeader = false }) {
  const { t } = useLanguage();
  const { user, isSuperAdmin, activeOrganizationId } = useAuth();
  const { orgs } = useOrgs();
  const [selectedOrg, setSelectedOrg] = useState(activeOrganizationId || "");

  useEffect(() => {
    if (!isSuperAdmin && activeOrganizationId) {
      setSelectedOrg(activeOrganizationId);
    }
  }, [activeOrganizationId, isSuperAdmin]);

  const dharamshalas = orgs.filter((o) => o.type === "DHARAMSHALA");
  const orgId = propOrgId || selectedOrg || activeOrganizationId || user?.organizationIds?.[0] || (isSuperAdmin ? dharamshalas[0]?.id : undefined);

  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [previewImageBooking, setPreviewImageBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  useEffect(() => {
    if (selectedBooking && isViewModalOpen) {
      if (selectedBooking.bookingItem?.name) {
        fetchAvailableRooms(selectedBooking.bookingItem.name);
      }
      setSelectedRoomIds(selectedBooking.allocatedRoomId ? selectedBooking.allocatedRoomId.split(',').map(id => id.trim()) : []);
    }
  }, [selectedBooking, isViewModalOpen]);

  const fetchAvailableRooms = async (itemName) => {
    try {
      const res = await api.get(`/bookings/org/${orgId}/rooms`, { params: { status: 'AVAILABLE' } });
      const rooms = res.data?.data || [];
      // Filter by name since RoomOrHall links to BookingItem by name
      setAvailableRooms(rooms.filter(r => r.name === itemName));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchBookings();
    }
  }, [orgId]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookings/org/${orgId}`);
      setBookings(res.data?.data || []);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId, action, status) => {
    setActionLoading(true);
    try {
      if (action === "decision") {
        await api.post(`/bookings/${bookingId}/decision`, { 
          decision: status, 
          reason: "",
          allocatedRoomId: selectedRoomIds.filter(Boolean).join(',') || undefined
        });
        toast.success(t(`Booking ${status.toLowerCase()} successfully.`));
      } else if (action === "payment-verification") {
        await api.post(`/bookings/${bookingId}/payment-verification`, { 
          decision: status, 
          reason: ""
        });
        toast.success(t(`Payment ${status.toLowerCase()} successfully.`));
      } else if (action === "check-in") {
        await api.post(`/bookings/${bookingId}/check-in`, { roomId: selectedRoomIds.filter(Boolean).join(',') || undefined });
        toast.success(t("Check-in successful."));
      } else if (action === "check-out") {
        await api.post(`/bookings/${bookingId}/check-out`);
        toast.success(t("Check-out successful."));
      }
      fetchBookings();
      setIsViewModalOpen(false);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
      case "PENDING_APPROVAL":
      case "SUBMITTED":
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50">{t("Pending")}</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="text-blue-600 bg-blue-50">{t("Approved")}</Badge>;
      case "CHECKED_IN":
        return <Badge variant="outline" className="text-purple-600 bg-purple-50">{t("Checked In")}</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="text-green-600 bg-green-50">{t("Completed")}</Badge>;
      case "REJECTED":
      case "CANCELLED":
        return <Badge variant="outline" className="text-red-600 bg-red-50">{t(status)}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleScan = (scannedText) => {
    if (!scannedText) return;
    const cleanId = scannedText.replace("BOOKING:", "").trim().toLowerCase();
    
    const matched = bookings.find(b => {
      const bId = String(b.id || "").toLowerCase();
      const bUid = String(b.uid || "").toLowerCase();
      const b_Id = String(b._id || "").toLowerCase();
      
      // Exact match
      if (bId === cleanId || bUid === cleanId || b_Id === cleanId) return true;
      
      // Partial match for manually typed short IDs (at least 6 chars to be safe)
      if (cleanId.length >= 6) {
        if (bId.includes(cleanId) || bUid.includes(cleanId) || b_Id.includes(cleanId)) return true;
      }
      return false;
    });

    if (matched) {
      setSelectedBooking(matched);
      setIsViewModalOpen(true);
      setIsScannerOpen(false);
    } else {
      toast.error(t("Booking not found in the current list."));
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") {
      return ["PENDING", "PENDING_APPROVAL"].includes(b.status);
    }
    if (activeTab === "APPROVED") {
      return ["APPROVED", "PAYMENT_PENDING", "PAYMENT_VERIFICATION", "CONFIRMED"].includes(b.status);
    }
    if (activeTab === "COMPLETED") {
      return ["COMPLETED", "CHECKED_OUT", "CANCELLED", "REJECTED", "EXPIRED"].includes(b.status);
    }
    return b.status === activeTab;
  });

  return (
    <div className={`p-6 max-w-6xl mx-auto space-y-6 ${hideHeader ? 'p-0' : ''}`}>
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader 
            title={t("Bookings Management")} 
            description={t("Manage member reservations, check-ins, and check-outs.")} 
          />
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {isSuperAdmin && (
              <OrgSelect
                value={selectedOrg || orgId}
                onChange={setSelectedOrg}
                options={dharamshalas}
                label={t("Select Dharamshala")}
                className="w-full md:w-64"
              />
            )}
            <Button onClick={() => setIsScannerOpen(true)} className="w-full sm:w-auto">
              <QrCode className="w-4 h-4 mr-2" />
              {t("Scan QR & Check-in")}
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg bg-card">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-x-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full justify-start md:grid md:grid-cols-6 h-auto p-1 bg-slate-100/50 flex-wrap sm:flex-nowrap">
              <TabsTrigger value="ALL">{t("All")}</TabsTrigger>
              <TabsTrigger value="PENDING">{t("Pending")}</TabsTrigger>
              <TabsTrigger value="APPROVED">{t("Approved")}</TabsTrigger>
              <TabsTrigger value="CHECKED_IN">{t("Checked In")}</TabsTrigger>
              <TabsTrigger value="COMPLETED">{t("Completed")}</TabsTrigger>
              <TabsTrigger value="ROOM_STATUS" className="bg-purple-100/50 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">{t("Room Status")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto">
          {activeTab === "ROOM_STATUS" ? (
            <RoomStatusTab orgId={orgId} />
          ) : loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title={t("No Bookings Found")}
              description={t("There are no bookings matching the selected filter.")}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Booking ID")}</TableHead>
                  <TableHead>{t("Member")}</TableHead>
                  <TableHead>{t("Check-In")}</TableHead>
                  <TableHead>{t("Check-Out")}</TableHead>
                  <TableHead>{t("Rooms")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id || booking.id}>
                    <TableCell className="font-medium text-xs">{(booking._id || booking.id).substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell>
                      {booking.member?.fullName || 'Unknown'}
                      <div className="text-xs text-muted-foreground">{booking.member?.mobile || ''}</div>
                    </TableCell>
                    <TableCell>{format(new Date(booking.dateFrom), "dd MMM yyyy")}</TableCell>
                    <TableCell>{booking.dateTo ? format(new Date(booking.dateTo), "dd MMM yyyy") : 'N/A'}</TableCell>
                    <TableCell>{booking.rooms?.length || 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        {booking.paymentProofUrl && (
                          <button 
                            onClick={() => setPreviewImageBooking(booking)}
                            className="text-blue-500 hover:text-blue-700 focus:outline-none" 
                            title={t("View Payment Proof")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsViewModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {t("View")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("Booking Details")}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("Primary Occupant")}</h4>
                  <p className="font-medium">{selectedBooking.member?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.member?.mobile || ''}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("Stay Dates")}</h4>
                  <p>{format(new Date(selectedBooking.dateFrom), "dd MMM yyyy")} {selectedBooking.dateTo ? `- ${format(new Date(selectedBooking.dateTo), "dd MMM yyyy")}` : ''}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("Status")}</h4>
                  <div>{getStatusBadge(selectedBooking.status)}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("Payment Summary")}</h4>
                  <p className="text-sm flex justify-between"><span>{t("Requested Rooms")}:</span> <span className="font-medium">{selectedBooking.quantity || 1}</span></p>
                  <p className="text-sm flex justify-between"><span>{t("Total Amount")}:</span> <span className="font-medium">₹{selectedBooking.totalAmount || 0}</span></p>
                  <p className="text-sm flex justify-between"><span>{t("Amount Paid")}:</span> <span className="font-medium text-green-600">₹{selectedBooking.amountPaid || 0}</span></p>
                  <p className="text-sm flex justify-between"><span>{t("Payment Status")}:</span> <span className="font-medium">{selectedBooking.paymentStatus}</span></p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("Special Requests")}</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedBooking.specialRequests || t("None")}</p>
                </div>

                {(selectedBooking.paymentReference || selectedBooking.paymentNotes) && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-md mt-4">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">{t("Payment Verification Details")}</h4>
                    {selectedBooking.paymentReference && (
                      <p className="text-sm flex justify-between mb-1">
                        <span className="text-orange-700">{t("UTR / Reference")}:</span> 
                        <span className="font-mono font-bold text-orange-900">{selectedBooking.paymentReference}</span>
                      </p>
                    )}
                    {selectedBooking.paymentNotes && (
                      <p className="text-sm flex justify-between mb-1">
                        <span className="text-orange-700">{t("Notes")}:</span> 
                        <span className="font-medium text-orange-900 text-right">{selectedBooking.paymentNotes}</span>
                      </p>
                    )}
                    {selectedBooking.paymentProofUrl && (
                      <p className="text-sm mt-2">
                        <button 
                          onClick={() => setPreviewImageBooking(selectedBooking)}
                          className="text-blue-600 hover:underline inline-flex items-center focus:outline-none"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t("View Screenshot")}
                        </button>
                      </p>
                    )}
                  </div>
                )}
                
                {/* Room Assignment */}
                {['PENDING', 'PENDING_APPROVAL', 'SUBMITTED', 'APPROVED', 'CONFIRMED'].includes(selectedBooking?.status) && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-muted-foreground">{t("Assign Room")} ({t("Requested")}: {selectedBooking.quantity || 1})</h4>
                      <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {t("Selected")}: {selectedRoomIds.length} / {selectedBooking.quantity || 1}
                      </span>
                    </div>
                    
                    {availableRooms.length === 0 && selectedRoomIds.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">{t("No available rooms for this category")}</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-md bg-slate-50/50">
                        {/* Render currently assigned rooms that might not be in the 'availableRooms' list */}
                        {selectedRoomIds.filter(id => !availableRooms.find(r => r.id === id)).map(id => (
                          <div 
                            key={id} 
                            onClick={() => {
                              setSelectedRoomIds(prev => prev.filter(rId => rId !== id));
                            }}
                            className="border border-purple-600 bg-purple-50 text-purple-700 rounded px-2 py-1.5 cursor-pointer text-xs flex justify-between items-center font-medium shadow-sm"
                          >
                            <span>{t("Assigned Room")}</span>
                            <Check className="w-3 h-3" />
                          </div>
                        ))}
                        
                        {/* Render all available rooms */}
                        {availableRooms.map(room => {
                          const isSelected = selectedRoomIds.includes(room.id);
                          return (
                            <div 
                              key={room.id}
                              onClick={() => {
                                setSelectedRoomIds(prev => {
                                  if (isSelected) return prev.filter(id => id !== room.id);
                                  if (prev.length >= (selectedBooking.quantity || 1)) {
                                    toast.error(t(`You can only select up to ${selectedBooking.quantity || 1} room(s).`));
                                    return prev;
                                  }
                                  return [...prev, room.id];
                                });
                              }}
                              className={`border rounded px-2 py-1.5 cursor-pointer text-xs flex justify-between items-center transition-colors ${
                                isSelected 
                                  ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium shadow-sm' 
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <span className="truncate mr-2">
                                {room.roomNumber ? `Room ${room.roomNumber}` : room.name} 
                                <span className="text-[10px] text-slate-400 block truncate">{room.wing?.name || t("Main")}</span>
                              </span>
                              {isSelected && <Check className="w-3 h-3 shrink-0" />}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {['PENDING', 'PENDING_APPROVAL', 'SUBMITTED'].includes(selectedBooking?.status) && (
              <>
                <Button 
                  variant="destructive" 
                  disabled={actionLoading} 
                  onClick={() => handleAction(selectedBooking._id || selectedBooking.id, "decision", "REJECT")}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("Reject")}
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white" 
                  disabled={actionLoading} 
                  onClick={() => handleAction(selectedBooking._id || selectedBooking.id, "decision", "APPROVE")}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t("Approve")}
                </Button>
              </>
            )}

            {['PAYMENT_VERIFICATION', 'PAYMENT_PENDING'].includes(selectedBooking?.status) && (
              <>
                <Button 
                  variant="destructive" 
                  disabled={actionLoading} 
                  onClick={() => handleAction(selectedBooking._id || selectedBooking.id, "payment-verification", "REJECT")}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("Reject Payment")}
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white" 
                  disabled={actionLoading} 
                  onClick={() => handleAction(selectedBooking._id || selectedBooking.id, "payment-verification", "APPROVE")}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t("Verify Payment")}
                </Button>
              </>
            )}
            
            {["APPROVED", "CONFIRMED"].includes(selectedBooking?.status) && (
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white" 
                disabled={actionLoading} 
                onClick={() => handleAction(selectedBooking._id || selectedBooking.id, "check-in")}
              >
                {t("Check In")}
              </Button>
            )}

            {selectedBooking?.status === "CHECKED_IN" && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={actionLoading} 
                onClick={() => handleAction(selectedBooking._id || selectedBooking.id, "check-out")}
              >
                {t("Check Out")}
              </Button>
            )}

            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              {t("Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Preview Modal */}
      <Dialog open={!!previewImageBooking} onOpenChange={(open) => !open && setPreviewImageBooking(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("Payment Proof Details")}</DialogTitle>
          </DialogHeader>
          {previewImageBooking && (
            <div className="space-y-4">
              <div className="flex justify-center bg-gray-100 border border-gray-200 rounded-lg overflow-hidden h-[60vh]">
                <img 
                  src={previewImageBooking.paymentProofUrl} 
                  alt="Payment Proof" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div>
                  <h4 className="text-sm font-semibold text-orange-800 mb-1">{t("UTR / Reference No.")}</h4>
                  <p className="font-mono font-medium text-orange-900 bg-white px-3 py-2 rounded border border-orange-200">
                    {previewImageBooking.paymentReference || t("N/A")}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-orange-800 mb-1">{t("Payment Notes")}</h4>
                  <p className="text-sm text-orange-900 bg-white px-3 py-2 rounded border border-orange-200 min-h-[42px]">
                    {previewImageBooking.paymentNotes || t("N/A")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isScannerOpen && (
        <QrScanner 
          title="Scan Booking QR"
          inputLabel="Enter Booking ID"
          onScan={handleScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
}
