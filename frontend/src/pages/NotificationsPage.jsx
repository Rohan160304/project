import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, extractErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { RouteDetailModal } from "@/components/modals/RouteDetailModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Bell, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { activeOrganizationId, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  useEffect(() => {
    api.get("/notifications/my")
      .then((res) => setRows(res.data?.data?.items || res.data?.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const markOpened = async (id) => {
    try { await api.post(`/notifications/${id}/opened`); } catch {}
    setRows((r) => r.map((n) => n.id === id ? { ...n, openedAt: new Date().toISOString() } : n));
  };

  return (
    <div data-testid="notifications-page">
      <PageHeader title={t("Notifications")} subtitle={t("In-app notification inbox.")} />
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title={t("You're all caught up")} icon={Bell} />
      ) : (
        <div className="space-y-2 max-w-3xl">
          {rows.filter(n => {
            if (isSuperAdmin && !activeOrganizationId) return true;
            if (n.payload?.organizationId && activeOrganizationId) {
              return n.payload.organizationId === activeOrganizationId;
            }
            if (!n.payload?.organizationId) return true; // Show global notifications
            return false;
          }).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No notifications found for this organization.
            </div>
          ) : rows.filter(n => {
            if (isSuperAdmin && !activeOrganizationId) return true;
            if (n.payload?.organizationId && activeOrganizationId) {
              return n.payload.organizationId === activeOrganizationId;
            }
            if (!n.payload?.organizationId) return true;
            return false;
          }).map((n) => {
            const title = n.payload?.title || n.payload?.subject || n.title;
            const body = n.payload?.message || n.payload?.body || n.body || n.message;
            const actionUrl = n.payload?.actionUrl;
            const actionText = n.payload?.actionText || "View";
            
            return (
              <Card
                key={n.id}
                className={`p-4 rounded-md border-border cursor-pointer hover:shadow-sm transition-all ${!n.openedAt ? "border-l-4 border-l-primary" : ""}`}
                onClick={() => markOpened(n.id)}
                data-testid={`notification-${n.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{body}</div>
                    {actionUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          markOpened(n.id);
                          if (actionUrl.includes('viewRouteId=')) {
                            const urlParams = new URLSearchParams(actionUrl.split('?')[1]);
                            const routeId = urlParams.get('viewRouteId');
                            if (routeId) {
                              setSelectedRouteId(routeId);
                              return;
                            }
                          }
                          navigate(actionUrl);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        {actionText}
                      </Button>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-[10px]">{n.channel || "IN_APP"}</Badge>
                      <Badge variant="outline" className="text-[10px]">{n.category || "SERVICE"}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{formatDateTime(n.createdAt)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RouteDetailModal 
        routeId={selectedRouteId} 
        open={!!selectedRouteId} 
        onOpenChange={(val) => !val && setSelectedRouteId(null)} 
      />
    </div>
  );
}
