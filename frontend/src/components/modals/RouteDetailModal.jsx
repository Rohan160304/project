import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Navigation, UserCircle, Users, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function RouteDetailModal({ routeId, open, onOpenChange, initialRouteData, onRouteUpdated }) {
  const { t } = useLanguage();
  const [route, setRoute] = useState(initialRouteData || null);
  const [loading, setLoading] = useState(false);
  const [startingJourney, setStartingJourney] = useState(false);

  useEffect(() => {
    if (initialRouteData) {
      setRoute(initialRouteData);
    } else if (open && routeId) {
      setLoading(true);
      api.get("/tracking/routes")
        .then(res => {
          const found = (res.data?.data || []).find(r => r.id === routeId);
          setRoute(found || null);
        })
        .finally(() => setLoading(false));
    }
  }, [open, routeId, initialRouteData]);

  const handleMarkArrived = async (routeId, stopIndex) => {
    try {
      if (!route) return;
      const newStops = [...route.stops];
      newStops[stopIndex].status = "COMPLETED";
      newStops[stopIndex].actualArrival = new Date().toISOString();
      
      await api.patch(`/tracking/routes/${routeId}`, { stops: newStops });
      toast.success(t("Stop marked as arrived."));
      setRoute({ ...route, stops: newStops });
      if (onRouteUpdated) onRouteUpdated();
    } catch (err) {
      toast.error(t("Failed to mark as arrived"));
    }
  };

  const handleStartJourney = async () => {
    setStartingJourney(true);
    try {
      await api.post("/tracking/journeys", { routeId: route.id });
      toast.success(t("Journey started successfully! You can now track it in the Live Map."));
      if (onRouteUpdated) onRouteUpdated();
      onOpenChange(false);
    } catch (err) {
      const apiError = err?.response?.data?.error;
      const errorMessage = typeof apiError === "object" && apiError !== null
        ? (apiError.message || JSON.stringify(apiError))
        : (apiError || t("Failed to start journey. It might already be in progress."));
      toast.error(errorMessage);
    } finally {
      setStartingJourney(false);
    }
  };

  if (!open) return null;

  const isStopCompleted = (stop) => {
    if (stop.status === 'COMPLETED') return true;
    if (stop.dateTime) {
      const stopTime = new Date(stop.dateTime);
      const now = new Date();
      if (now > stopTime) return true;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Navigation className="h-5 w-5 text-orange-500" />
            {route ? route.name : t("Loading Route...")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-slate-500">{t("Loading...")}</div>
        ) : route ? (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{t("Vihar Target")}</p>
                {route.monkId ? (
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-slate-600" />
                    <span className="font-medium">{route.monk?.dikshaName || "Unknown Monk"}</span>
                  </div>
                ) : route.monkGroupId ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-slate-600" />
                      <span className="font-medium">{route.monkGroup?.name || "Unknown Group"}</span>
                    </div>
                    <div className="pl-7">
                      <p className="text-xs text-slate-500 mb-1">{t("Participating Monks:")}</p>
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        {/* We use participantMonksData provided by backend or map from local list if needed */}
                        {(route.participantMonksData || route.participantMonkIds || []).map((m, idx) => {
                           if (typeof m === 'string') return <li key={idx}>{m}</li>; // fallback if only ID is present
                           return <li key={m.id || idx}>{m.dikshaName}</li>;
                        })}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{t("Vihar Date & Time")}</p>
                  <p className="font-medium">
                    {route.journeyDate ? new Date(route.journeyDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '') : "TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{t("Contact Persons")}</p>
                  {((route.contactPersonsData && route.contactPersonsData.length > 0) || (route.contactPersonIds && route.contactPersonIds.length > 0)) ? (
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      {(route.contactPersonsData || route.contactPersonIds).map((member, idx) => {
                         if (typeof member === 'string') return <li key={idx}>{member}</li>; // fallback if only ID is present
                         return (
                           <li key={member.id || idx}>
                             {member.fullName || (member.firstName + ' ' + (member.surname || ''))} ({member.publicId})
                             {member.mobile ? ` - ${member.mobile}` : ''}
                           </li>
                         );
                      })}
                    </ul>
                  ) : (
                    <span className="text-sm text-slate-500">None Assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b">
                <h3 className="text-sm font-semibold">{t("Route Timeline")}</h3>
                {route?.hasActiveJourney ? (
                  <Button 
                    size="sm" 
                    className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white" 
                    disabled
                  >
                    <PlayCircle className="h-4 w-4" />
                    {t("Journey in Progress")}
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="h-8 gap-1.5" 
                    onClick={handleStartJourney}
                    disabled={startingJourney || route?.stops?.every(s => isStopCompleted(s))}
                  >
                    <PlayCircle className="h-4 w-4" />
                    {startingJourney ? t("Starting...") : t("Start Journey")}
                  </Button>
                )}
              </div>
              <div className="space-y-4 relative before:absolute before:top-0 before:bottom-0 before:left-[11px] md:before:left-1/2 md:before:-translate-x-1/2 before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {(route.stops || []).map((stop, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div key={idx} className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                      {/* Card */}
                      <div className={`w-[calc(100%-2.5rem)] ml-auto md:ml-0 md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col`}>
                        <span className="font-bold text-slate-800">{stop.templeName}</span>
                        {(stop.orgName || stop.templeId) && (
                          <span className="text-xs font-semibold text-purple-600 mt-0.5">
                            {stop.orgName || stop.templeId} {stop.orgCity ? `(${stop.orgCity})` : ''}
                          </span>
                        )}
                        {stop.dateTime && (
                          <span className="text-xs text-slate-500 mt-1">
                            {new Date(stop.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        )}
                        {isStopCompleted(stop) ? (
                          <Badge className="bg-green-500 w-fit mt-2">{t("Completed")}</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="w-fit mt-2 text-xs h-7 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200" onClick={() => handleMarkArrived(route.id, idx)}>
                            {t("Arrive")}
                          </Button>
                        )}
                      </div>
                      
                      {/* Spacer for desktop layout */}
                      <div className="hidden md:block md:w-[calc(50%-1.5rem)]"></div>

                      {/* Dot */}
                      <div className="absolute left-[3px] md:left-1/2 -translate-x-0 md:-translate-x-1/2 w-4 h-4 rounded-full border-2 border-white bg-orange-500 shadow-sm z-10 flex items-center justify-center">
                        {isStopCompleted(stop) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-red-500">{t("Route details not found.")}</div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t("Close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
