import re

with open("src/pages/MonkDetailPage.jsx", "r") as f:
    monk_code = f.read()

# Extract from 540 (return() of MonkDetailPage) to 1102 (End of report dialog)
ui_match = re.search(r'(<div className="pb-16 max-w-7xl mx-auto space-y-6">.*?)\{\/\* ─── Edit MS Profile Dialog', monk_code, re.DOTALL)
if not ui_match:
    print("Could not match UI section!")
    exit(1)

ui_code = ui_match.group(1)

# Clean up admin specific things from UI
ui_code = re.sub(r'\{isSuperAdmin && \(\s*<Button onClick=\{openEditDialog\}[^>]+>.*?</Button>\s*\)\}', '', ui_code, flags=re.DOTALL)
ui_code = re.sub(r'<Button variant="outline" onClick=\{[^}]*setIdCardOpen[^}]*\}[^>]+>.*?</Button>', '', ui_code, flags=re.DOTALL)
ui_code = re.sub(r'onClick=\{handleCreateSupportTicket\}', 'onClick={handleCreateSupportTicket}', ui_code)
# Remove the ID Card Dialog completely since members probably shouldn't see it or we don't have the component
ui_code = re.sub(r'\{/\* ─── ID Card Preview Dialog ──.*?</Dialog>', '', ui_code, flags=re.DOTALL)

# Now construct the full file
new_content = """import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star, MapPin, Navigation, Calendar, Users, Clock, ArrowLeft,
  Share2, Bookmark, Heart, ShieldCheck, CheckCircle, MessageSquare, Phone,
  Sparkles, AlertCircle, FileText, Check, AlertTriangle, Compass, CheckCircle2,
  Globe, Info, Video, ArrowRight, ShieldAlert, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import ListState from "@/components/member/ListState";
import { useMemberItem, compactNumber } from "@/hooks/useMemberList";
import { useVisibilityEngine } from "@/contexts/VisibilityEngineContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { API_BASE } from "@/lib/api";

function ini(name) {
  return (name || "").trim().split(/\\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "MS";
}

export default function MemberMSDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isEntityFollowed, toggleFollow } = useVisibilityEngine();
  const [optimisticCount, setOptimisticCount] = useState(null);
  
  const [reportOpen, setReportOpen] = useState(false);
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSaving, setTicketSaving] = useState(false);

  const { item: msRaw, loading, error } = useMemberItem(id ? `/monks/${id}` : null, {
    map: (m) => ({
      ...m,
      name: m.dikshaName || m.shortName || m.nameBeforeDiksha || m.fullName || m.name,
      image: m.photoUrl || null,
      status: m.tracking?.status || m.status || "Offline",
      location: m.tracking?.currentLocation || m.currentTemple?.city || "",
      currentPlace: m.currentTemple?.name || m.tracking?.currentLocation || "",
      sect: [m.sect, m.subSect || m.gacchaName].filter(Boolean).join(" · "),
      guru: m.dikshaGuru?.dikshaName || m.dikshaGuru?.shortName || m.discipleOf || "",
      followers: compactNumber(m._count?.follows ?? m.followerCount ?? 0),
      vihaarGroupId: m.group?.publicId || m.currentSangh?.publicId || "",
      groupLeader: m.group?.leader?.dikshaName || m.currentSangh?.name || "",
      groupMembersCount: m.group?._count?.members ?? m._count?.group ?? 0,
      upcomingVihaar: m.tracking?.nextStop || m.timeline?.[0]?.title || "",
      pravachan: m.routine?.pravachan || "",
      contactRepresentative: {
        jainPerson: m.sanghContacts?.[0]?.name || "",
        phone: m.sanghContacts?.[0]?.mobile || "",
      },
      chaturmasHistory: m.chaturmasHistory || [],
    }),
  });

  const monk = msRaw || {};
  const following = isEntityFollowed(monk?.publicId);
  const displayCount = optimisticCount ?? (monk?._count?.follows ?? monk?.followerCount ?? 0);

  const handleFollow = async () => {
    if (!monk.publicId) return;
    const wasFollowed = following;
    setOptimisticCount(Math.max(0, displayCount + (wasFollowed ? -1 : 1)));
    await toggleFollow(monk.publicId, { type: "monk", apiId: monk.id, name: monk.name, image: monk.image, category: "monk" });
  };

  const onShare = () => {
    if (navigator.share) {
      navigator.share({ title: monk?.name, text: `MS ID: ${monk?.publicId} - Location: ${monk?.location}`, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${monk?.name} (${monk?.publicId})`);
      toast.success(t("MS link copied to clipboard"));
    }
  };

  const handleCreateSupportTicket = () => {
    if (!ticketDescription.trim()) {
      toast.error(t("Please enter the details of the incorrect information."));
      return;
    }
    setTicketSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success(t("Support Ticket created. Thank you for keeping the directory accurate!"));
      setTicketSaving(false);
      setReportOpen(false);
      setTicketDescription("");
    }, 800);
  };

  if (loading || error || !msRaw) {
    return (
      <div className="space-y-8">
        <ListState
          loading={loading}
          error={error}
          count={msRaw ? 1 : 0}
          emptyTitle="Maharaj Saheb not found"
          emptyHint="This profile may have been removed, or the link is out of date."
        >
          {null}
        </ListState>
      </div>
    );
  }

  return (
""" + ui_code + """
    </div>
  );
}
"""

with open("src/pages/member/MemberMSDetailPage.jsx", "w") as f:
    f.write(new_content)

print("Rewritten MemberMSDetailPage.jsx!")
