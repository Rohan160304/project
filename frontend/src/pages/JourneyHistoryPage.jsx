import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, MapPin, Map, Clock, CheckCircle, Activity, Info } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function JourneyHistoryPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const fetchJourneys = () => {
    setLoading(true);
    
    Promise.all([
      api.get("/tracking/journeys?status=COMPLETED,TERMINATED,CANCELLED").catch(() => ({ data: { data: [] } })),
      api.get("/tracking/routes").catch(() => ({ data: { data: [] } }))
    ]).then(([journeysRes, routesRes]) => {
      const journeyItems = journeysRes.data?.data?.items || journeysRes.data?.data || [];
      const routeItems = routesRes.data?.data?.items || routesRes.data?.data || [];
      
      const journeyRouteIds = new Set(journeyItems.map(j => j.routeId));
      
      const historicalRoutes = routeItems.filter(r => {
        if (journeyRouteIds.has(r.id)) return false;
        if (!r.stops || r.stops.length === 0) return false;
        const lastStop = r.stops[r.stops.length - 1];
        if (!lastStop.dateTime) return false;
        return new Date(lastStop.dateTime) < new Date();
      }).map(r => ({
        id: `historical-${r.id}`,
        isHistoricalRoute: true,
        routeId: r.id,
        status: 'COMPLETED',
        route: r,
        monk: r.monk,
        monkGroup: r.monkGroup,
        startedAt: r.stops[0]?.dateTime || r.journeyDate,
        endedAt: r.stops[r.stops.length - 1]?.dateTime,
        currentStopIndex: r.stops.length
      }));
      
      setRows([...journeyItems, ...historicalRoutes]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  const openTimeline = (journey) => {
    setSelectedJourney(journey);
    if (journey.isHistoricalRoute) {
      // Historical routes don't have real timeline events, we mock them
      const events = journey.route.stops.map((stop, idx) => ({
        id: `mock-${idx}`,
        type: idx === 0 ? 'START' : (idx === journey.route.stops.length - 1 ? 'END' : 'ARRIVAL'),
        timestamp: stop.dateTime,
        note: `Auto-completed at ${stop.templeName}`
      }));
      setTimelineEvents(events);
      return;
    }
    
    setTimelineLoading(true);
    api.get(`/tracking/journeys/${journey.id}/timeline`)
      .then((res) => {
        setTimelineEvents(res.data?.data?.events || []);
      })
      .catch(() => {
        setTimelineEvents([]);
      })
      .finally(() => setTimelineLoading(false));
  };

  const columns = [
    { 
      key: "target", 
      header: t("Target (Monk/Sangh)"), 
      render: (r) => (
        <span className="font-semibold text-slate-800">
          {r.monkGroup?.name || r.monk?.dikshaName || "Unknown"}
        </span>
      ) 
    },
    { 
      key: "routeName", 
      header: t("Route Name"), 
      render: (r) => (
        <span className="text-slate-600 font-medium flex items-center gap-1">
          <MapPin className="h-3 w-3 text-orange-500" />
          {r.route?.name || "Unknown Route"}
        </span>
      ) 
    },
    { 
      key: "status", 
      header: t("Status"), 
      render: (r) => {
        if (r.status === 'COMPLETED') return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
        if (r.status === 'TERMINATED') return <Badge variant="destructive">Terminated</Badge>;
        if (r.status === 'PAUSED') return <Badge variant="outline" className="text-orange-600 border-orange-300">Paused</Badge>;
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge>;
      } 
    },
    { 
      key: "stops", 
      header: t("Progress"), 
      render: (r) => (
        <span className="text-sm font-medium text-slate-600">
          {r.currentStopIndex || 0} / {r.route?.stops?.length || r.totalStops || 0} Stops
        </span>
      ) 
    },
    { 
      key: "timeline", 
      header: t("Timeline"), 
      render: (r) => (
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {t("Started")}: {formatDateTime(r.startedAt)}</span>
          {r.status === 'COMPLETED' && r.endedAt ? (
            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3 w-3" /> {t("Ended")}: {formatDateTime(r.endedAt)}</span>
          ) : r.status === 'IN_PROGRESS' ? (
            <span className="flex items-center gap-1 text-blue-500"><Activity className="h-3 w-3" /> {t("Ongoing")}</span>
          ) : null}
        </div>
      ) 
    }
  ];

  return (
    <div data-testid="journey-history-page">
      <PageHeader
        title={t("Journey History")}
        subtitle={t("Historical archive of all holy Monk Vihar travels, rest stops, and routes taken.")}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={openTimeline}
        testId="journey-history-table"
      />

      {/* Timeline Drawer */}
      <Sheet open={!!selectedJourney} onOpenChange={(o) => !o && setSelectedJourney(null)}>
        <SheetContent className="sm:max-w-md md:max-w-lg overflow-hidden flex flex-col h-full bg-slate-50 border-l">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-orange-500" />
              {t("Journey Timeline")}
            </SheetTitle>
            <SheetDescription>
              {selectedJourney?.monkGroup?.name || selectedJourney?.monk?.dikshaName} • {selectedJourney?.route?.name}
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6 py-4">
            {timelineLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : timelineEvents.length === 0 ? (
              <div className="text-center py-10 text-slate-500 flex flex-col items-center gap-2">
                <Info className="h-8 w-8 text-slate-300" />
                <p>No timeline events recorded yet.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-orange-200 ml-3 space-y-6 pb-6">
                {timelineEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative pl-6">
                    {/* Timeline Node */}
                    <span className={`absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white ${
                      evt.type === 'START' ? 'border-emerald-500' :
                      evt.type === 'END' ? 'border-emerald-500 bg-emerald-500' :
                      evt.type === 'DELAY' ? 'border-red-500' :
                      'border-orange-500'
                    }`} />
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800">
                          {evt.type === 'START' && "Journey Started"}
                          {evt.type === 'ARRIVAL' && "Arrived at Stop"}
                          {evt.type === 'DEPARTURE' && "Departed from Stop"}
                          {evt.type === 'DELAY' && "Journey Delayed"}
                          {evt.type === 'END' && "Journey Completed"}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(evt.timestamp)}
                        </span>
                      </div>
                      
                      {evt.note && (
                        <div className="bg-white border rounded-md p-2 mt-1 text-sm text-slate-600 shadow-sm">
                          {evt.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
