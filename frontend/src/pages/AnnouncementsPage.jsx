import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import GenericListPage from "@/components/common/GenericListPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityFormDialog } from "@/components/common/EntityFormDialog";
import { formatDateTime } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { OrgSelect } from "@/components/common/OrgSelect";
import { useOrgs, orgOptions } from "@/hooks/useOrgs";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AnnouncementsPage() {
  const { t } = useLanguage();
  const { canDo, user, isSuperAdmin } = useAuth();
  const [openCreate, setOpenCreate] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchParams] = useSearchParams();
  const [filterOrgId, setFilterOrgId] = useState(searchParams.get("orgId") || "ALL");
  const { orgs } = useOrgs();

  // Filter orgs to only those the admin manages (unless Super Admin)
  const myOrgs = isSuperAdmin ? orgs : orgs.filter((o) => user?.organizationIds?.includes(o.id));
  const orgOpts = orgOptions(myOrgs);

  const columns = [
    { key: "title", header: t("Announcement"), render: (r) => (
      <div>
        <div className="font-medium">{r.title}</div>
        <div className="text-xs text-muted-foreground truncate max-w-md">{r.body || r.message || r.description}</div>
      </div>
    ) },
    { key: "audience", header: t("Audience"), render: (r) => r.visibilityConfig?.audience || "All" },
    { key: "publishedAt", header: t("Published"), render: (r) => formatDateTime(r.publishedAt || r.createdAt) },
  ];
  
  const endpoint = filterOrgId === "ALL" ? "/announcements" : `/announcements?organizationId=${filterOrgId}`;

  return (
    <>
      <GenericListPage
        key={reloadKey}
        title={t("announcements.title", "Announcements")}
        subtitle={t("Platform-wide and org-scoped announcements.")}
        endpoint={endpoint}
        columns={columns}
        testId="announcements-page"
        extraFilters={
          myOrgs.length > 0 && (
            <OrgSelect
              value={filterOrgId}
              onChange={setFilterOrgId}
              options={[{ id: "ALL", name: "All Organizations" }, ...myOrgs]}
              showTypeFilter={true}
              className="flex items-center space-x-2"
              label={""}
            />
          )
        }
        extraActions={canDo("ANNOUNCEMENTS", "CREATE") && (
          <Button onClick={() => setOpenCreate(true)} data-testid="announcements-create-btn">
            <Plus className="h-4 w-4 mr-2" /> {t("New Announcement")}
          </Button>
        )}
      />
      <EntityFormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={t("New Announcement")}
        endpoint="/announcements"
        onSubmit={async (payload) => {
          const { organizations, ...rest } = payload;
          if (Array.isArray(organizations) && organizations.length > 0) {
            // Post for each selected organization
            const promises = organizations.map((orgId) =>
              api.post("/announcements", { ...rest, organizationId: orgId })
            );
            await Promise.all(promises);
            return {}; // Return dummy response for success
          } else {
            // Platform-wide announcement (or single org if payload.organizationId was set elsewhere, though we use `organizations` array here)
            const res = await api.post("/announcements", rest);
            return res.data?.data;
          }
        }}
        onSaved={() => setReloadKey((k) => k + 1)}
        testId="announcement-form"
        fields={[
          ...(myOrgs.length > 0 ? [{ name: "organizations", label: t("Organizations"), type: "multi-select", options: orgOpts, required: true, placeholder: t("Select organizations...") }] : []),
          { name: "title", label: t("Title"), required: true },
          { name: "body", label: t("Message"), type: "textarea", required: true },
        ]}
      />
    </>
  );
}
