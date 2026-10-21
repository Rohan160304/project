import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { Home } from "lucide-react";

export function RoomStatusTab({ orgId }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (orgId) {
      fetchRooms();
    }
  }, [orgId, categoryFilter, statusFilter]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;
      
      const res = await api.get(`/bookings/org/${orgId}/rooms`, { params });
      setRooms(res.data?.data || []);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await api.patch(`/bookings/org/${orgId}/rooms/${roomId}/status`, { status: newStatus });
      toast.success(t("Room status updated"));
      fetchRooms();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="outline" className="text-green-600 bg-green-50">{t("Available")}</Badge>;
      case "OCCUPIED":
        return <Badge variant="outline" className="text-blue-600 bg-blue-50">{t("Occupied")}</Badge>;
      case "MAINTENANCE":
        return <Badge variant="outline" className="text-orange-600 bg-orange-50">{t("Maintenance")}</Badge>;
      case "DIRTY":
        return <Badge variant="outline" className="text-red-600 bg-red-50">{t("Dirty")}</Badge>;
      case "UNDER_CLEANING":
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50">{t("Cleaning")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categories = [...new Set(rooms.map(r => r.category).filter(Boolean))];

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="w-full sm:w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("All Categories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Categories")}</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("All Statuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Statuses")}</SelectItem>
              <SelectItem value="AVAILABLE">{t("Available")}</SelectItem>
              <SelectItem value="OCCUPIED">{t("Occupied")}</SelectItem>
              <SelectItem value="MAINTENANCE">{t("Maintenance")}</SelectItem>
              <SelectItem value="DIRTY">{t("Dirty")}</SelectItem>
              <SelectItem value="UNDER_CLEANING">{t("Cleaning")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>{t("Room Name")}</TableHead>
                <TableHead>{t("Room No.")}</TableHead>
                <TableHead>{t("Category")}</TableHead>
                <TableHead>{t("Building/Wing")}</TableHead>
                <TableHead>{t("Current Status")}</TableHead>
                <TableHead>{t("Update Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t("No rooms found matching the selected filters.")}
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell className="font-semibold text-slate-700">{room.roomNumber || '-'}</TableCell>
                    <TableCell>{room.category}</TableCell>
                    <TableCell>
                      {room.wing?.building?.name} {room.wing?.name ? `- ${room.wing.name}` : ""}
                    </TableCell>
                    <TableCell>{getStatusBadge(room.status)}</TableCell>
                    <TableCell>
                      <Select value={room.status} onValueChange={(v) => handleStatusChange(room.id, v)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">{t("Available")}</SelectItem>
                          <SelectItem value="OCCUPIED">{t("Occupied")}</SelectItem>
                          <SelectItem value="DIRTY">{t("Dirty (Needs Cleaning)")}</SelectItem>
                          <SelectItem value="MAINTENANCE">{t("Maintenance")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
