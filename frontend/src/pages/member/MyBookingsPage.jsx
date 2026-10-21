import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CalendarCheck, ChevronRight, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { bookingsApi, eventsApi, formatMinor } from "@/lib/memberApi";
import { useMemberSocket } from "@/hooks/useMemberSocket";
import { extractErrorMessage } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { memberClient } from "@/lib/memberClient";
import { QRCodeSVG } from "qrcode.react";
/**
 * My Bookings — §B16.7.
 * "All bookings across the entire platform appear in one place. Members never
 *  have to look in different sections for different booking types."
 * Merges accommodation, general bookings, event tickets and tour registrations,
 * grouped as Upcoming · Active · Past.
 */
const GROUPS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "active", label: "Active" },
  { key: "past", label: "Past" },
];

// §B16.1 categories (Super Admin master — extendable without redevelopment)
const CATEGORIES = [
  "Accommodation", "Temple Hall", "Event Hall", "Temple Space", "Pooja Booking",
  "Pooja Material", "Bhojanshala", "Pathshala Hall", "Seminar Hall", "Conference Hall",
  "Meeting Room", "Locker", "Parking", "Religious Ceremony", "Event Ticket",
  "Tour Registration", "Other",
];

const STATUS_TONE = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  PAYMENT_PENDING: "bg-orange-100 text-orange-700",
  PAYMENT_VERIFICATION: "bg-blue-100 text-blue-700",
  WAITING_LIST: "bg-purple-100 text-purple-700",
  RESERVED: "bg-blue-100 text-blue-700",
  CHECKED_IN: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-200 text-slate-600",
  NO_SHOW: "bg-slate-200 text-slate-600",
};

const pretty = (status) =>
  String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function MyBookingsPage() {
  const { t } = useLanguage();
  const [group, setGroup] = useState("upcoming");
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBhojanshalaPass, setSelectedBhojanshalaPass] = useState(null);
  const [selectedEventRsvp, setSelectedEventRsvp] = useState(null);

  /*
   * Booking status is the thing a member refreshes for: submitted → approved →
   * payment pending → confirmed. Patch the row in place when the server moves
   * it, so the list reflects reality without a reload.
   */
  useMemberSocket("/dashboards", {
    "booking:updated": (evt) => {
      if (!evt?.bookingId) return;
      setRows((prev) => prev.map((b) =>
        (b.id === evt.bookingId || b.uid === evt.bookingId || b.display_id === evt.bookingId)
          ? { ...b, status: evt.status ?? b.status }
          : b
      ));
    },
    "booking:new": (evt) => {
      if (!evt?.bookingId) return;
      // A booking made on another device belongs in this list too.
      setRows((prev) => prev.some((b) => b.id === evt.bookingId) ? prev : [evt, ...prev]);
    },
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchBookings = bookingsApi.mine({ scope: group, ...(category ? { category } : {}) });

    const fetchBhojanshala = (category === "" || category === "Bhojanshala")
      ? memberClient.get('/bhojanshala/my-passes')
          .then(res => res.data?.data || [])
          .catch(err => {
            console.error("Error fetching Bhojanshala passes:", err);
            return [];
          })
      : Promise.resolve([]);

    const fetchEvents = (category === "" || category === "Event RSVP")
      ? eventsApi.browse({ scope: 'my-rsvp' })
          .catch(err => {
            console.error("Error fetching events:", err);
            return [];
          })
      : Promise.resolve([]);

    const fetchEventHalls = (category === "" || category === "Event Hall")
      ? memberClient.get('/event-halls/my-bookings')
          .then(res => res.data?.data || [])
          .catch(err => {
            console.error("Error fetching Event Hall bookings:", err);
            return [];
          })
      : Promise.resolve([]);

    Promise.all([fetchBookings, fetchBhojanshala, fetchEvents, fetchEventHalls])
      .then(([bookingsDataRaw, passesData, eventsData, eventHallsData]) => {
        if (cancelled) return;

        const bookingsData = (bookingsDataRaw || []).map(b => ({
          ...b,
          item_name: b.bookingItem?.name,
          organization_name: b.organization?.name,
          from_date: b.dateFrom,
          to_date: b.dateTo,
          amount_minor: b.amount ? Number(b.amount) * 100 : null,
          category: b.bookingItem?.categoryId || b.bookingItem?.type,
        }));

        const today = new Date();
        today.setHours(0,0,0,0);
        
        const filteredPasses = passesData.filter(pass => {
          const pDate = new Date(pass.date);
          pDate.setHours(0,0,0,0);
          const isPastStatus = ['CANCELLED', 'SCANNED', 'EXPIRED'].includes(pass.status);

          if (group === 'past') return isPastStatus || pDate < today;
          if (group === 'active') return !isPastStatus && pDate.getTime() === today.getTime();
          if (group === 'upcoming') return !isPastStatus && pDate >= today;
          return false;
        });

        const mappedPasses = filteredPasses.map(p => ({
          id: p.publicId || p.id,
          uid: p.publicId || p.id,
          _isBhojanshala: true,
          item_name: `Bhojanshala Pass - ${p.mealType}`,
          status: p.status,
          organization_name: p.organization?.name,
          from_date: p.date,
          amount_minor: Number(p.totalAmount || 0) * 100,
          currency: 'INR',
          category: 'Bhojanshala',
          _originalPass: p
        }));

        const filteredEvents = eventsData.filter(rsvp => {
          const eDate = new Date(rsvp.event?.start_at || rsvp.event?.startAt || rsvp.createdAt);
          eDate.setHours(0,0,0,0);
          const isPastStatus = ['CANCELLED', 'CHECKED_IN'].includes(rsvp.status);

          if (group === 'past') return isPastStatus || eDate < today;
          if (group === 'active') return !isPastStatus && eDate.getTime() === today.getTime();
          if (group === 'upcoming') return !isPastStatus && eDate >= today;
          return false;
        });

        const mappedEvents = filteredEvents.map(r => ({
          id: r.id,
          uid: r.id,
          _isEventRsvp: true,
          item_name: `Event RSVP - ${r.event?.title}`,
          status: r.status,
          organization_name: r.event?.organization?.name || r.event?.organization_name,
          from_date: r.event?.start_at || r.event?.startAt,
          category: 'Event RSVP',
          _originalRsvp: r
        }));

        const filteredEventHalls = eventHallsData.filter(eh => {
          const eDate = new Date(eh.bookingDate);
          eDate.setHours(0,0,0,0);
          const isPastStatus = ['CANCELLED', 'COMPLETED', 'REJECTED'].includes(eh.status);

          if (group === 'past') return isPastStatus || eDate < today;
          if (group === 'active') return !isPastStatus && eDate.getTime() === today.getTime();
          if (group === 'upcoming') return !isPastStatus && eDate >= today;
          return false;
        });

        const mappedEventHalls = filteredEventHalls.map(eh => ({
          id: eh.id,
          uid: eh.id,
          _isEventHall: true,
          item_name: `Event Hall - ${eh.eventHall?.name || 'Unknown'}`,
          status: eh.status,
          organization_name: eh.eventHall?.organization?.name,
          from_date: eh.bookingDate,
          to_date: eh.bookingDate,
          amount_minor: Number(eh.amountPaid || 0) * 100,
          currency: 'INR',
          category: 'Event Hall',
          _originalEventHall: eh
        }));

        const combined = [...bookingsData, ...mappedPasses, ...mappedEvents, ...mappedEventHalls];
        
        combined.sort((a, b) => {
          const dateA = new Date(a.from_date || a.booking_date || 0);
          const dateB = new Date(b.from_date || b.booking_date || 0);
          return dateB - dateA;
        });

        setRows(combined);
      })
      .catch((e) => {
        if (cancelled) return;
        setRows([]);
        toast.error(extractErrorMessage(e));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [group, category]);

  const categoryOptions = useMemo(
    () => [{ value: "", label: t("All Categories") }, ...CATEGORIES.map((c) => ({ value: c, label: t(c) })), { value: "Event RSVP", label: t("Event RSVP") }],
    [t]
  );

  return (
    <div data-testid="member-bookings-page">
      <h1 className="font-heading text-xl font-bold text-slate-900">{t("My Bookings")}</h1>
      <p className="text-xs text-slate-500 mt-1">
        {t("Every booking across the platform in one place — stays, halls, pooja, tickets and tours.")}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGroup(g.key)}
            data-testid={`bookings-group-${g.key}`}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              group === g.key
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-slate-600 border-slate-200 hover:border-orange-400"
            }`}
          >
            {t(g.label)}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <SearchableSelect
          value={category}
          onValueChange={setCategory}
          options={categoryOptions}
          placeholder={t("All Categories")}
          searchPlaceholder={t("Search category…")}
        />
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 rounded-xl">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </Card>
          ))}

        {!loading && rows.length === 0 && (
          <EmptyState
            icon={CalendarCheck}
            title={t("No bookings found")}
            description={t("Bookings you make will appear here, grouped as Upcoming, Active and Past.")}
          />
        )}

        {!loading &&
          rows.map((b) => {
            const isBhojanshala = b._isBhojanshala;
            const isEventHall = b._isEventHall;
            const cardContent = (
              <Card
                className="p-4 rounded-xl hover:border-orange-300 transition-colors"
                data-testid={`booking-card-${b.uid || b.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {b.item_name || b.title || t("Booking")}
                      </span>
                      <Badge
                        className={`text-[10px] font-semibold border-0 ${
                          STATUS_TONE[String(b.status || "").toUpperCase()] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t(pretty(b.status))}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {b.organization_name || b.institution_name || "—"}
                      {b.category ? ` · ${t(b.category)}` : ""}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {b.from_date
                        ? `${new Date(b.from_date).toLocaleDateString()}${
                            b.to_date ? ` → ${new Date(b.to_date).toLocaleDateString()}` : ""
                          }`
                        : b.booking_date
                        ? new Date(b.booking_date).toLocaleDateString()
                        : ""}
                    </div>
                    {b.amount_minor != null && (
                      <div className="text-xs font-bold text-slate-800 mt-1.5">
                        {formatMinor(b.amount_minor, b.currency)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                    {b.status === 'PAYMENT_PENDING' && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200 mt-2 hover:bg-orange-200 transition-colors">
                        {t("Upload Proof")}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );

            const isEventRsvp = b._isEventRsvp;
            if (isBhojanshala) {
              return (
                <div 
                  key={b.uid || b.id} 
                  className="block cursor-pointer"
                  onClick={() => setSelectedBhojanshalaPass(b._originalPass)}
                >
                  {cardContent}
                </div>
              );
            }

            if (isEventRsvp) {
              return (
                <div 
                  key={b.uid || b.id} 
                  className="block cursor-pointer"
                  onClick={() => setSelectedEventRsvp(b._originalRsvp)}
                >
                  {cardContent}
                </div>
              );
            }
            
            if (isEventHall) {
              return (
                <div 
                  key={b.uid || b.id} 
                  className="block cursor-pointer"
                  onClick={() => window.alert("Event Hall Booking Detail view coming soon!")}
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link key={b.uid || b.id} to={`/member/bookings/${b.uid || b.id}`} className="block">
                {cardContent}
              </Link>
            );
          })}
      </div>

      <Dialog open={!!selectedBhojanshalaPass} onOpenChange={(open) => !open && setSelectedBhojanshalaPass(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Bhojanshala Pass Details")}</DialogTitle>
          </DialogHeader>
          {selectedBhojanshalaPass && (
            <div className="space-y-4 pt-4">
               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                 <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{selectedBhojanshalaPass.organization?.name}</h3>
                      <div className="flex items-center text-xs text-slate-500 mt-1 gap-2">
                        <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3"/> {new Date(selectedBhojanshalaPass.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {selectedBhojanshalaPass.mealType}</span>
                      </div>
                    </div>
                    {selectedBhojanshalaPass.status === 'PENDING' && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>}
                    {selectedBhojanshalaPass.status === 'BOOKED' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>}
                    {selectedBhojanshalaPass.status === 'SCANNED' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Used</Badge>}
                    {['EXPIRED', 'CANCELLED'].includes(selectedBhojanshalaPass.status) && <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{selectedBhojanshalaPass.status}</Badge>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Guests</p>
                      <p className="font-semibold text-slate-800">{selectedBhojanshalaPass.numberOfPersons}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Amount</p>
                      <p className="font-semibold text-slate-800">₹{selectedBhojanshalaPass.totalAmount}</p>
                    </div>
                  </div>

                  {selectedBhojanshalaPass.status !== 'PENDING' && (
                    <div className="mt-4 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Booking ID</p>
                      <p className="text-2xl font-mono font-bold tracking-widest text-slate-800">{selectedBhojanshalaPass.publicId}</p>
                    </div>
                  )}
                  {selectedBhojanshalaPass.status === 'PENDING' && (
                     <div className="mt-4 flex items-center justify-center p-3 border border-slate-100 rounded-lg bg-orange-50/50">
                       <p className="text-xs text-orange-600 text-center">Your pass is awaiting admin approval. Booking ID will be generated upon confirmation.</p>
                     </div>
                  )}
                </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEventRsvp} onOpenChange={(open) => !open && setSelectedEventRsvp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Event RSVP Details")}</DialogTitle>
          </DialogHeader>
          {selectedEventRsvp && (
            <div className="space-y-4 pt-4">
               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                 <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{selectedEventRsvp.event?.title}</h3>
                      <div className="flex items-center text-xs text-slate-500 mt-1 gap-2">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="w-3 h-3"/> 
                          {new Date(selectedEventRsvp.event?.start_at || selectedEventRsvp.event?.startAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {selectedEventRsvp.status === 'CONFIRMED' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>}
                    {selectedEventRsvp.status === 'CHECKED_IN' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Checked In</Badge>}
                    {['CANCELLED'].includes(selectedEventRsvp.status) && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Attendees</p>
                      <p className="font-semibold text-slate-800">{selectedEventRsvp.attendeeCount}</p>
                    </div>
                  </div>

                  {['CONFIRMED', 'CHECKED_IN'].includes(selectedEventRsvp.status) && (
                    <div className="mt-4 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-semibold">Entry QR Code</p>
                      <div className="bg-white p-2 border rounded-xl shadow-sm">
                        <QRCodeSVG value={`EVENT_RSVP:${selectedEventRsvp.event?.id || selectedEventRsvp.event?.uid}:${selectedEventRsvp.id}`} size={160} level="M" />
                      </div>
                    </div>
                  )}
                </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
