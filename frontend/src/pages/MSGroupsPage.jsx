import { useEffect, useState } from "react";
import { api, extractErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Trash2, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MSGroupsPage() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [monks, setMonks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ id: null, name: "", leaderMonkId: "", memberMonkIds: [], notes: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsRes, monksRes] = await Promise.all([
        api.get("/monks/groups"),
        api.get("/monks")
      ]);
      setGroups(groupsRes.data?.data || []);
      setMonks(monksRes.data?.data || []);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (group = null) => {
    if (group) {
      setFormData({
        id: group.id,
        name: group.name || "",
        leaderMonkId: group.leaderMonkId || "",
        memberMonkIds: group.members?.map(m => m.id) || [],
        notes: group.notes || "",
      });
    } else {
      setFormData({ id: null, name: "", leaderMonkId: "", memberMonkIds: [], notes: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error(t("Group Name is required"));
      return;
    }
    try {
      setSaving(true);
      if (formData.id) {
        await api.patch(`/monks/groups/${formData.id}`, formData);
        toast.success(t("Group updated successfully"));
      } else {
        await api.post("/monks/groups", formData);
        toast.success(t("Group created successfully"));
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await api.delete(`/monks/groups/${id}`);
      toast.success(t("Group deleted successfully"));
      loadData();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()) || g.groupNumber?.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { key: "groupNumber", header: "Group ID" },
    { key: "name", header: "Group Name" },
    {
      key: "leader",
      header: "Leader",
      render: (g) => {
        const leader = monks.find(m => m.id === g.leaderMonkId);
        return leader ? leader.dikshaName : "—";
      }
    },
    {
      key: "members",
      header: "Members",
      render: (g) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Users className="w-4 h-4" />
          <span>{g.members?.length || 0}</span>
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (g) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(g)}>
            <Pencil className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="MS Groups"
        subtitle="Manage groups of Sadhus and Sadhvis."
        actions={
          <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </Button>
        }
      />

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search groups..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filteredGroups}
        loading={loading}
        emptyTitle="No groups found"
        emptyDescription="Create a new group to get started."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{formData.id ? "Edit Group" : "Create Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Group Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Acharya Shri's Sangh"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Leader</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.leaderMonkId}
                onChange={(e) => setFormData(p => ({ ...p, leaderMonkId: e.target.value }))}
              >
                <option value="">-- Select Leader --</option>
                {monks.map(m => (
                  <option key={m.id} value={m.id}>{m.dikshaName} ({m.publicId})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Members</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {monks.map(m => (
                  <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input 
                      type="checkbox"
                      checked={formData.memberMonkIds.includes(m.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData(p => ({
                          ...p,
                          memberMonkIds: checked 
                            ? [...p.memberMonkIds, m.id] 
                            : p.memberMonkIds.filter(id => id !== m.id)
                        }));
                      }}
                    />
                    <span>{m.dikshaName} ({m.publicId})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Group"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
