import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { eventsApi } from "@/lib/memberApi";
import { extractErrorMessage } from "@/lib/api";
import { Loader2, Calendar, MapPin, Users, ChevronLeft } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function MemberEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [attendees, setAttendees] = useState(1);
  const [memberIds, setMemberIds] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await eventsApi.detail(id);
      setEvent(res);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const submitRsvp = async (e) => {
    e.preventDefault();
    if (!event) return;
    
    const ids = memberIds.split(",").map((s) => s.trim()).filter(Boolean);
    const count = Number(attendees);
    
    if (!ids.length && (!Number.isFinite(count) || count < 1)) {
      toast.error(t("Please enter the number of attendees."));
      return;
    }
    
    setSaving(true);
    try {
      const res = await eventsApi.rsvp(event.id || event.publicId, {
        attendees: count,
        memberIds: ids,
      });
      const status = String(res?.status || "CONFIRMED").toUpperCase();
      if (status === "WAITING_LIST") toast.success(t("You have joined the waiting list."));
      else if (status === "CLOSED") toast.error(t("RSVP is closed for this event."));
      else toast.success(t("RSVP confirmed."));
      
      setRsvpOpen(false);
      setMemberIds(""); 
      setAttendees(1);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cancelRsvp = async () => {
    try {
      await eventsApi.cancelRsvp(event.id || event.publicId);
      toast.success(t("RSVP cancelled."));
      load();
    } catch (err) { 
      toast.error(extractErrorMessage(err)); 
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <EmptyState
        title={t("Event Not Found")}
        description={error || t("Could not load the requested event.")}
        action={<Button onClick={() => navigate(-1)}>{t("Go Back")}</Button>}
      />
    );
  }

  const isPaid = !!event.isPaid;
  const soldOut = event.seatsLeft === 0;
  
  // NOTE: event details from detail API might not include member rsvp status easily 
  // without a specific rsvp record. We might not have rsvp_status here directly 
  // unless backend attaches it. Assuming it does or we only allow join if we don't know.

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-full p-1 hover:bg-slate-100 active:bg-slate-200">
            <ChevronLeft className="h-5 w-5 text-slate-700" />
          </button>
          <h1 className="font-heading text-lg font-bold text-slate-900 truncate">
            {t("Event Details")}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <img 
          src={event.bannerUrl && event.bannerUrl && event.bannerUrl !== 'attached_banner_placeholder.png' ? event.bannerUrl : "https://placehold.co/600x400/f3f4f6/9ca3af?text=Event"} 
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/f3f4f6/9ca3af?text=Event" }}
          alt={event.title} 
          className="w-full h-48 object-cover rounded-xl" 
        />
        
        <div>
          <h2 className="font-heading font-bold text-xl text-slate-900">{event.title}</h2>
          {event.organization?.name && (
            <p className="text-sm text-slate-500 mt-1">{event.organization.name}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {event.category?.name && (
            <Badge variant="outline" className="text-xs">{t(event.category.name)}</Badge>
          )}
          <Badge className={`text-xs border-0 ${isPaid ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
            {isPaid ? t("Paid Event") : t("Free Event")}
          </Badge>
          {event.isRsvped && (
            <Badge className="text-xs border-0 bg-blue-100 text-blue-700">
              {t(event.rsvpStatus === "WAITING_LIST" ? "Waiting List" : "RSVP Confirmed")}
            </Badge>
          )}
        </div>

        <Card className="p-4 rounded-xl space-y-3">
          {event.startAt && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span>{new Date(event.startAt).toLocaleString()}</span>
            </div>
          )}
          {(event.city || event.venue) && (
            <div className="flex flex-col gap-1 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span>{[event.venue, event.city].filter(Boolean).join(", ")}</span>
              </div>
            </div>
          )}
          {isPaid && event.seatsLeft != null && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Users className="h-4 w-4 text-orange-500" />
              <span>{t("{0} seats left", [event.seatsLeft])}</span>
            </div>
          )}
        </Card>

        {event.description && (
          <div>
            <h3 className="font-bold text-sm mb-2">{t("About")}</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}
      </div>
      
      {/* Footer Action */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-slate-100 md:bottom-0">
        {!isPaid ? (
          event.isRsvped ? (
            <Button className="w-full font-bold" variant="secondary" onClick={cancelRsvp}>
              {t("Cancel RSVP")}
            </Button>
          ) : (
            <Button className="w-full font-bold" onClick={() => setRsvpOpen(true)}>
              {t("RSVP to Event")}
            </Button>
          )
        ) : (
          <Button className="w-full font-bold" disabled={soldOut || event.isRsvped}>
            {event.isRsvped ? t("Ticket Booked") : soldOut ? t("Sold Out") : t("Book Ticket")}
          </Button>
        )}
      </div>

      <Dialog open={rsvpOpen} onOpenChange={setRsvpOpen}>
        <DialogContent className="max-w-xs rounded-2xl mx-auto">
          <DialogHeader>
            <DialogTitle>{t("RSVP to Event")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitRsvp} className="space-y-4 py-2">
            <div>
              <Label className="text-xs">{t("Number of Attendees")}</Label>
              <Input
                type="number"
                min={1}
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">{t("Or enter JiNANAM Member IDs (comma separated)")}</Label>
              <Input
                value={memberIds}
                onChange={(e) => setMemberIds(e.target.value)}
                placeholder={t("e.g. JFJM102, JFNJM501")}
                className="mt-1 bg-white font-mono text-xs"
              />
            </div>
            <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-col">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Confirm RSVP")}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setRsvpOpen(false)}>
                {t("Cancel")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
