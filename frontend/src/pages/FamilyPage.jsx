import { useEffect, useState } from "react";
import { api, extractErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { MemberIdCardDialog } from "@/components/common/MemberIdCardDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MemberLinkSelect from "@/components/common/MemberLinkSelect";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { GENDER_OPTIONS } from "@/constants/dropdownOptions";
import { UserPlus, Loader2, Users, Shield, IdCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { PhoneField } from "@/components/common/PhoneInput";

/* ─── Add Family Member Dialog ─────────────────────────────────────────
 *
 * Two ways to add someone:
 *   "link"   — pick an EXISTING member and relate them to the anchor member.
 *   "invite" — create a new person from name + mobile (original behaviour).
 *
 * Expected API contract (backend team — please match):
 *   POST /family
 *     link   → { anchorMemberPublicId?, relatedMemberPublicId, relationshipTypeId }
 *     invite → { anchorMemberPublicId?, name, mobile, relationshipTypeId, category }
 *   `anchorMemberPublicId` is omitted for "my family"; Super Admins send it to
 *   link two arbitrary members under one family.
 * ------------------------------------------------------------------ */
function AddFamilyDialog({ open, onClose, onCreated, anchorPublicId, anchorLabel, myPublicId }) {
  const { t } = useLanguage();
  const { user, isSuperAdmin , activeOrganizationId} = useAuth();
  const orgId = activeOrganizationId || user?.organizationIds?.[0];
  const [mode, setMode] = useState("link");
  const [linkedMember, setLinkedMember] = useState("");
  const [form, setForm] = useState({
    firstName: "", surname: "", mobile: "", relationshipTypeId: "", dob: "", gender: "Male",
  });
  const [relTypes, setRelTypes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      api.get("/master-data/relationship-types")
        .then((res) => setRelTypes(res.data?.data || []))
        .catch(() => setRelTypes([]));
    }
  }, [open]);

  const reset = () => {
    setForm({ firstName: "", surname: "", mobile: "", relationshipTypeId: "", dob: "", gender: "Male" });
    setLinkedMember("");
    setMode("link");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.relationshipTypeId) { toast.error(t("Please select a relationship.")); return; }
    if (mode === "link" && !linkedMember) { toast.error(t("Please select a member to link.")); return; }
    if (mode === "link" && anchorPublicId && linkedMember === anchorPublicId) {
      toast.error(t("A member cannot be linked to themselves."));
      return;
    }
    setSaving(true);
    try {
      if (mode === "link") {
        await api.post("/family/link", {
          primaryMemberPublicId: anchorPublicId || myPublicId,
          relatedMemberPublicId: linkedMember,
          relationshipTypeId: form.relationshipTypeId,
          ...(orgId && !isSuperAdmin ? { organizationId: orgId } : {})
        });
        toast.success(t("Members linked into one family."));
      } else {
        const payload = {
          ...(anchorPublicId ? { anchorMemberPublicId: anchorPublicId } : {}),
          name: `${form.firstName} ${form.surname}`.trim(),
          mobile: form.mobile,
          relationshipTypeId: form.relationshipTypeId,
          category: "JAIN",
          ...(orgId && !isSuperAdmin ? { organizationId: orgId } : {})
        };
        await api.post("/family", payload);
        toast.success(t("Family member added."));
      }
      onCreated();
      onClose();
      reset();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="family-add-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("Add Family Member")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {anchorLabel && (
            <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5">
              {t("Adding to the family of")} <span className="font-semibold text-slate-700">{anchorLabel}</span>
            </p>
          )}

          {/* Link an existing member, or invite someone new */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "link", label: t("Link Existing Member") },
              { key: "invite", label: t("Invite New Person") },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMode(opt.key)}
                className={`text-xs font-semibold rounded-md border px-3 py-2 transition-colors ${
                  mode === opt.key
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-orange-400"
                }`}
                data-testid={`family-mode-${opt.key}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {mode === "link" ? (
            <div>
              <Label className="text-xs">{t("Member to Link *")}</Label>
              <MemberLinkSelect
                value={linkedMember}
                onChange={setLinkedMember}
                placeholder={t("Search Jain / Non-Jain member by name or member ID (e.g. JFJM112)…")}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {t("Both members will appear under the same family group.")}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("First Name *")}</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required={mode === "invite"} data-testid="family-first-name" />
                </div>
                <div>
                  <Label className="text-xs">{t("Surname")}</Label>
                  <Input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} data-testid="family-surname" />
                </div>
              </div>
              <div>
                <Label className="text-xs">{t("Mobile (+91…) *")}</Label>
                <PhoneField value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} placeholder={t("Mobile Number")} required={mode === "invite"} id="family-mobile" />
              </div>
            </>
          )}
          <div>
            <Label className="text-xs">{t("Relationship *")}</Label>
            <SearchableSelect
              value={form.relationshipTypeId}
              onValueChange={(v) => setForm({ ...form, relationshipTypeId: v })}
              options={relTypes.map((r) => ({ value: r.id, label: r.name }))}
              placeholder={t("Select relationship…")}
              searchPlaceholder={t("Search relationship…")}
            />
          </div>
          {/* Only relevant when creating a brand-new person */}
          {mode === "invite" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("Date of Birth")}</Label>
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} data-testid="family-dob" />
              </div>
              <div>
                <Label className="text-xs">{t("Gender")}</Label>
                <SearchableSelect
                  value={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                  options={GENDER_OPTIONS}
                  placeholder={t("Select gender")}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>{t("Cancel")}</Button>
            <Button type="submit" disabled={saving} data-testid="family-add-submit">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {mode === "link" ? t("Link Member") : t("Send Invite")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Create Family Group Dialog ─────────────────────────────────────
 * Lets the admin explicitly build a family group by picking 2+ existing
 * members and (optionally) an anchor. On save it creates pairwise
 * FamilyMember links between everyone via the existing POST /family API
 * — one call per pair (n=6 → 15 calls) which is fine for typical family
 * sizes. No backend schema change required.
 * ------------------------------------------------------------------ */
function CreateFamilyGroupDialog({ open, onClose, onCreated, setAnchorPublicId }) {
  const { t } = useLanguage();
  const { user, isSuperAdmin , activeOrganizationId} = useAuth();
  const orgId = activeOrganizationId || user?.organizationIds?.[0];
  const [groupName, setGroupName] = useState("");
  const [memberIds, setMemberIds] = useState([]);
  const [memberDetails, setMemberDetails] = useState({}); // publicId → { fullName, mobile }
  const [anchorId, setAnchorId] = useState("");
  const [relPerMember, setRelPerMember] = useState({}); // publicId → relationshipTypeId
  const [relTypes, setRelTypes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      api.get("/master-data/relationship-types")
        .then((res) => setRelTypes(res.data?.data || []))
        .catch(() => setRelTypes([]));
    } else {
      setGroupName("");
      setMemberIds([]);
      setMemberDetails({});
      setAnchorId("");
      setRelPerMember({});
    }
  }, [open]);

  // Whenever the multi-select changes, resolve names for any newly picked IDs
  // so the Anchor + per-member relation rows can show real names, not IDs.
  useEffect(() => {
    const missing = memberIds.filter((pid) => !memberDetails[pid]);
    if (missing.length === 0) return;
    Promise.all(missing.map((pid) =>
      api.get(`/members/${pid}`).then((r) => ({ pid, data: r.data?.data })).catch(() => ({ pid, data: null }))
    )).then((rows) => {
      setMemberDetails((prev) => {
        const next = { ...prev };
        for (const { pid, data } of rows) {
          if (data) next[pid] = { fullName: data.fullName || data.firstName || pid };
          else next[pid] = { fullName: pid };
        }
        return next;
      });
    });
  }, [memberIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameOf = (pid) => memberDetails[pid]?.fullName || pid;

  const submit = async (e) => {
    e.preventDefault();
    if (memberIds.length < 2) {
      toast.error(t("Pick at least 2 members to form a family group."));
      return;
    }
    if (!anchorId) {
      toast.error(t("Choose one member as the anchor of the family."));
      return;
    }
    const others = memberIds.filter((id) => id !== anchorId);
    const missingRel = others.find((pid) => !relPerMember[pid]);
    if (missingRel) {
      toast.error(t(`Pick a relationship for ${nameOf(missingRel)} → ${nameOf(anchorId)}.`));
      return;
    }
    setSaving(true);
    try {
      // Correct endpoint for LINKING existing members is POST /family/link
      // (POST /family without /link is for creating a new person + invite).
      const results = await Promise.allSettled(
        others.map((otherId) =>
          api.post("/family/link", {
            primaryMemberPublicId: anchorId,
            relatedMemberPublicId: otherId,
            relationshipTypeId: relPerMember[otherId],
            ...(orgId && !isSuperAdmin ? { organizationId: orgId } : {})
          })
        )
      );

      // Idempotency: treat "already linked" as success. The pair is in the
      // family; that's what the user wanted anyway.
      const isAlreadyLinked = (msg) => {
        const s = String(msg || "").toLowerCase();
        return s.includes("already linked") || s.includes("already exists") || s.includes("unique");
      };

      const failed = results.filter((r) => {
        if (r.status !== "rejected") return false;
        const msg = extractErrorMessage(r.reason);
        return !isAlreadyLinked(msg);
      });
      const alreadyLinkedCount = results.filter((r) => r.status === "rejected" && isAlreadyLinked(extractErrorMessage(r.reason))).length;
      const created = results.length - failed.length - alreadyLinkedCount;

      const failureMessages = failed
        .map((f) => extractErrorMessage(f.reason))
        .filter(Boolean);

      // Deliberately NOT overwriting each member's surname to `groupName` —
      // that destroys real personal data (e.g. Kartik B Jain's actual
      // surname is "Jain", not "Limbachiya"). The family name is stored as
      // a display label only and the surname-based grouping in Family
      // Management continues to cluster naturally when members share a
      // surname. A proper FamilyGroup entity is the right long-term fix if
      // mixed-surname families need a shared label.

      const totalLinked = created + alreadyLinkedCount;
      if (totalLinked > 0) {
        const label = groupName.trim() ? `"${groupName.trim()}"` : "";
        const suffix = alreadyLinkedCount > 0 && created === 0
          ? " (all pairs were already linked)"
          : alreadyLinkedCount > 0
            ? ` (${created} new, ${alreadyLinkedCount} already existed)`
            : "";
        toast.success(t(`Family group ${label} ready with ${memberIds.length} members${suffix}.`));
      }
      if (failed.length > 0) {
        const uniqueReasons = Array.from(new Set(failureMessages));
        toast.error(
          t(`${failed.length} link(s) failed. ${uniqueReasons[0] || "Check permissions."}`),
          { duration: 8000 }
        );
      }

      // Focus the newly-created group in the viewer so the user sees the result
      // immediately, instead of "No family groups yet" (my/own view is empty
      // when the SA isn't part of the group they just built).
      if (setAnchorPublicId) setAnchorPublicId(anchorId);

      onCreated();
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="family-group-create-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("Create Family Group")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2 text-sm">
          <div>
            <Label className="text-xs">{t("Family Name (optional)")}</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t("e.g. Limbachiya, Motta")}
              className="mt-1"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {t("Used as a label in the success message only. Individual member surnames are NOT overwritten — Family Management groups members by their existing surnames.")}
            </p>
          </div>

          <div>
            <Label className="text-xs">{t("Members in this family *")}</Label>
            <MemberLinkSelect
              value={memberIds}
              onChange={setMemberIds}
              multi
              placeholder={t("Search Jain / Non-Jain members by name or ID (pick 2 or more)…")}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {t("Search and select at least 2 members. All picked members will be linked to the anchor below.")}
            </p>
          </div>

          {memberIds.length >= 2 && (
            <div>
              <Label className="text-xs">{t("Anchor / Head of Family *")}</Label>
              <SearchableSelect
                value={anchorId}
                onValueChange={setAnchorId}
                options={memberIds.map((pid) => ({ value: pid, label: `${nameOf(pid)} (${pid})` }))}
                placeholder={t("Choose the anchor member")}
                className="mt-1"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {t("Every other member's relationship is stated relative to this person (e.g. Ram's father, Ram's mother, Ram's sister).")}
              </p>
            </div>
          )}

          {/* Per-member relation rows — one dropdown per non-anchor member.
              This is the only way "family group" makes sense: each relative has
              their own role (mother, father, uncle, cousin, etc.), not a single
              blanket "default relation". */}
          {anchorId && memberIds.length >= 2 && (
            <div className="border rounded-lg p-3 bg-slate-50 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t("Relation to")} <span className="text-orange-600">{nameOf(anchorId)}</span>
              </div>
              {memberIds.filter((pid) => pid !== anchorId).map((pid) => (
                <div key={pid} className="grid grid-cols-5 gap-2 items-center">
                  <div className="col-span-2 text-xs">
                    <div className="font-semibold text-slate-800 truncate">{nameOf(pid)}</div>
                    <div className="text-[10px] font-mono text-slate-400">{pid}</div>
                  </div>
                  <div className="col-span-3">
                    <SearchableSelect
                      value={relPerMember[pid] || ""}
                      onValueChange={(v) => setRelPerMember((s) => ({ ...s, [pid]: v }))}
                      options={relTypes.map((r) => ({ value: r.id, label: r.name }))}
                      placeholder={t("Pick their relation…")}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-slate-500 pt-1">
                {t("Each member is linked to the anchor with the relation you pick here. e.g. if anchor is Ram and you pick Mother for Sita, the link stored is 'Sita is Mother of Ram'.")}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>{t("Cancel")}</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {t("Create Family Group")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Family Member Card ────────────────────────────────────────────── */
function FamilyCard({ link, onClick }) {
  const { t } = useLanguage();
  const { isSuperAdmin , activeOrganizationId} = useAuth();
  const m = link.member || {};
  const isActive = m.status === "ACTIVE";
  const mobileDisplay = (() => {
    if (!m.mobile) return "—";
    if (isSuperAdmin) return m.mobile;
    const digits = String(m.mobile).replace(/\D/g, "");
    const head = digits.slice(0, 2);
    const tail = digits.slice(-2);
    const dots = "●".repeat(Math.max(digits.length - 4, 4));
    return `🔒 ${head}${dots}${tail}`;
  })();

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      data-testid={`family-card-${link.id}`}
    >
      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
        {m.photoUrl ? (
          <img src={m.photoUrl} alt={m.fullName} className="object-cover" />
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 text-sm font-bold">
            {initials(m.fullName || "F")}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{m.fullName || "—"}</div>
        <div className="text-xs text-muted-foreground font-mono-num truncate mt-0.5" title={!isSuperAdmin ? t("Mobile number is visible only to Super Admin") : undefined}>{mobileDisplay}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4">
            {m.publicId || "—"}
          </Badge>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
          }`}>
            {m.status || "INACTIVE"}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("Relation")}</div>
        <div className="text-xs font-semibold text-orange-600 mt-0.5">{link.relation || "Family"}</div>
        <IdCard className="h-3.5 w-3.5 text-muted-foreground mt-2 ml-auto group-hover:text-orange-500 transition-colors" />
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function FamilyPage() {
  const { t } = useLanguage();
  const { user, isSuperAdmin , activeOrganizationId} = useAuth();
  const orgId = activeOrganizationId || user?.organizationIds?.[0];
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [targetAnchorId, setTargetAnchorId] = useState(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Super Admin can view/manage any member's family group, not just their own.
  // Empty = "my family" (GET /family/my).
  // Expected API contract: GET /family/member/{publicId} → same shape as /family/my
  const [anchorPublicId, setAnchorPublicId] = useState("");

  // ID card dialog
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);

  // Which family cards are expanded (surname → boolean)
  const [expandedFamilies, setExpandedFamilies] = useState({});

  // Admins with FAMILY:VIEW default to the platform-wide family directory
  // (GET /family → { groups: [{ primaryMember, links[] }] }) so refresh shows
  // every family they've built for members. Non-admins fall back to their
  // own family (/family/my). Picking a specific anchor overrides both.
  const [allGroups, setAllGroups] = useState([]); // for admin default view

  const canSeeAllFamilies = isSuperAdmin || (user?.permissions?.FAMILY || []).includes("VIEW");

  const load = () => {
    setLoading(true);
    if (anchorPublicId) {
      // Specific-member view
      api.get(`/family/member/${anchorPublicId}`)
        .then((res) => { setMembers(res.data?.data || []); setAllGroups([]); })
        .catch(() => { setMembers([]); setAllGroups([]); })
        .finally(() => setLoading(false));
      return;
    }
    if (canSeeAllFamilies) {
      // Admin default — show every family group on the platform
      api.get("/family")
        .then((res) => { setAllGroups(res.data?.data?.groups || []); setMembers([]); })
        .catch(() => { setAllGroups([]); setMembers([]); })
        .finally(() => setLoading(false));
      return;
    }
    // Regular member — their own family
    api.get("/family/my")
      .then((res) => { setMembers(res.data?.data || []); setAllGroups([]); })
      .catch(() => { setMembers([]); setAllGroups([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [anchorPublicId, canSeeAllFamilies]);

  /* Open card — fetch full member detail by publicId */
  const openCard = async (link) => {
    setSelectedLink(link);
    // Use link.member as initial data (has publicId, fullName, mobile, status, photoUrl)
    const m = link.member || {};
    setSelectedMember({ ...m, relation: link.relation, direction: link.direction });
    setCardOpen(true);

    // Fetch full detail if publicId available
    if (m.publicId) {
      try {
        const res = await api.get(`/members/${m.publicId}`, { params: !isSuperAdmin && orgId ? { organizationId: orgId } : {} });
        const detail = res.data?.data;
        if (detail) {
          setSelectedMember({ ...detail, relation: link.relation, direction: link.direction });
        }
      } catch {
        // keep list data
      }
    }
  };

  const closeCard = () => {
    setCardOpen(false);
    setSelectedLink(null);
    setSelectedMember(null);
  };

  const handleSave = async (fields) => {
    if (!selectedMember?.publicId) return;
    await api.patch(`/members/${selectedMember.publicId}`, { ...fields, ...(orgId && !isSuperAdmin && { organizationId: orgId }) });
    load();
  };

  const handlePhotoSave = async (file) => {
    if (!selectedMember?.publicId) return;
    const fd = new FormData();
    fd.append("photo", file);
    await api.post(`/members/${selectedMember.publicId}/photo`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      params: !isSuperAdmin && orgId ? { organizationId: orgId } : {}
    });
    load();
  };

  /* Remove family link */
  const handleRemove = async (linkId) => {
    if (!isSuperAdmin) { toast.error(t("Only Super Admin can remove family links.")); return; }
    if (!window.confirm("Remove this family link?")) return;
    try {
      await api.delete(`/family/${linkId}`);
      toast.success(t("Family link removed."));
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  // Everyone the API returned for this anchor IS one connected family —
  // they're all linked to the same person, transitively. Not grouped by
  // surname (Mehta-A isn't related to Mehta-B just because both are Mehtas).
  //
  // Two data sources feed the render:
  //   1. `allGroups` — admin-wide directory, one card per primary member
  //   2. `members`   — anchor-specific view (either /family/my or a picked X)
  const byFamily = (() => {
    if (allGroups.length > 0) {
      // Admin directory: build one entry per primary member with a synthetic
      // anchor row prepended so the primary shows up in their own card.
      const out = {};
      for (const g of allGroups) {
        const anchor = g.primaryMember;
        const anchorName = anchor?.fullName || anchor?.publicId || "Family";
        const key = `Family of ${anchorName}`;
        const anchorRow = {
          id: `anchor-${anchor?.publicId || anchorName}`,
          relation: "Head of Family",
          direction: "ANCHOR",
          member: anchor,
        };
        out[key] = [anchorRow, ...(g.links || [])];
      }
      return out;
    }
    if (members.length === 0) return {};
    const anchorEntry = members.find((l) => l.direction === "ANCHOR");
    const anchorMember = anchorEntry?.member;
    const anchorName =
      anchorMember?.fullName?.trim()
      || (anchorPublicId ? anchorPublicId : (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "My"));
    return { [`Family of ${anchorName}`]: members };
  })();

  const toggleFamily = (key) => setExpandedFamilies((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div data-testid="family-page">
      <PageHeader
        title={anchorPublicId ? t("Family Group") : t("My Family")}
        subtitle={t("See and manage your family tree. Adding a member sends them a signup invite via SMS.")}
        actions={
          <div className="flex gap-2">
            {canSeeAllFamilies && !anchorPublicId && (
              <Button variant="outline" onClick={() => setCreateGroupOpen(true)} data-testid="family-group-create-btn">
                <Users className="h-4 w-4 mr-2" /> {t("Create Family Group")}
              </Button>
            )}
            {(!canSeeAllFamilies || anchorPublicId) && (
              <Button onClick={() => setAddOpen(true)} data-testid="family-add-btn">
                <UserPlus className="h-4 w-4 mr-2" /> {t("Add Family Member")}
              </Button>
            )}
          </div>
        }
      />

      {/* Admin: pick whose family group to view / link members into */}
      {canSeeAllFamilies && (
        <Card className="p-4 rounded-xl border-border mb-4">
          <Label className="text-xs font-semibold">{t("View Family Group Of")}</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1">
              <MemberLinkSelect
                value={anchorPublicId}
                onChange={setAnchorPublicId}
                placeholder={t("Search Jain / Non-Jain member by name or member ID (e.g. JFJM112)…")}
              />
            </div>
            {anchorPublicId && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setAnchorPublicId("")}>
                {t("My Family")}
              </Button>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {t("Pick any member to see their family group and link relatives under one family.")}
          </p>
        </Card>
      )}

      {/* Your Card */}
      <Card className="p-5 rounded-xl border-border mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-orange-200">
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-400 text-white text-xl font-bold">
              {initials(user?.firstName || user?.fullName || "SA")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-orange-500 font-semibold mb-1">{t("You")}</div>
            <div className="font-heading font-bold text-xl">
              {user?.firstName || user?.fullName || "Super"}{" "}
              {user?.lastName || user?.surname || ""}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] font-mono">
                {user?.publicId || user?.mobile || "—"}
              </Badge>
              <Shield className="h-3 w-3 text-orange-500" />
              <span className="text-[10px] text-orange-600 font-semibold">
                {user?.primaryRoleKey?.replace(/_/g, " ") || "Member"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Family List */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("Loading family…")}
        </div>
      ) : Object.keys(byFamily).length === 0 ? (
        <Card className="p-10 rounded-xl border-dashed text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <div className="font-semibold text-base">{t("No family groups yet")}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {t("Build a family in two ways — link individual relatives one at a time, or pick multiple existing members to form a whole group at once.")}
          </div>
          <div className="mt-4 flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setCreateGroupOpen(true)}>
              <Users className="h-4 w-4 mr-2" /> {t("Create Family Group")}
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> {t("Add Family Member")}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byFamily).map(([familyName, links]) => {
            const expanded = !!expandedFamilies[familyName];
            return (
              <Card key={familyName} className="rounded-xl border-border overflow-hidden">
                {/* Family group header — click to expand */}
                <button
                  type="button"
                  onClick={() => toggleFamily(familyName)}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-colors text-left"
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shrink-0 shadow-md">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading text-base font-bold text-slate-800">{familyName}</div>
                    <div className="text-[11px] text-orange-600 font-semibold mt-0.5">
                      {links.length} {links.length === 1 ? t("member") : t("members")}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {expanded ? t("▲ Collapse") : t("▼ Expand")}
                  </Badge>
                </button>

                {/* Expanded content: all members with relations */}
                {expanded && (
                  <div className="p-4 border-t border-orange-100 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {links.map((link) => (
                        <FamilyCard key={link.id} link={link} onClick={() => openCard(link)} />
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const anchorLink = links.find(l => l.direction === "ANCHOR") || links[0];
                          setTargetAnchorId(anchorLink?.member?.publicId);
                          setAddOpen(true);
                        }}
                        className="text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> {t("Add to")} {familyName}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          <p className="text-xs text-muted-foreground text-center pt-2">
            {t("Click any family group to see its members and their relations")}
          </p>
        </div>
      )}

      {/* Add Dialog */}
      <AddFamilyDialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setTargetAnchorId(null); }}
        onCreated={load}
        anchorPublicId={targetAnchorId || anchorPublicId}
        anchorLabel={targetAnchorId || anchorPublicId || null}
        myPublicId={members.find((l) => l.direction === "ANCHOR")?.member?.publicId}
      />

      {/* Create Family Group Dialog */}
      <CreateFamilyGroupDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={load}
        setAnchorPublicId={setAnchorPublicId}
      />

      {/* ID Card Dialog — with Add Image, Edit, Preview tabs */}
      <MemberIdCardDialog
        open={cardOpen}
        onClose={closeCard}
        member={selectedMember}
        relation={selectedMember?.relation}
        onSave={handleSave}
        onPhotoSave={handlePhotoSave}
        isSuperAdmin={isSuperAdmin}
        linkId={selectedLink?.id}
        onRemoveLink={handleRemove}
      />
    </div>
  );
}
