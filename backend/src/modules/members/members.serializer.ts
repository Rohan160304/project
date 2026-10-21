import { Member, MemberPrivacySetting } from '@prisma/client';
import { decryptField } from '@/utils/encryption';

/**
 * Phone-mask helper — keeps first 2 + last 2 digits, dots in between.
 *   "+919834148979" → "91●●●●●●●●79"
 * Non-breaking: still returns a string, so any client expecting `mobile: string`
 * keeps working. Only Super Admin sees the raw number.
 */
export function maskPhone(raw: string | null | undefined): string | null {
  if (raw == null) return raw ?? null;
  const s = String(raw);
  const digits = s.replace(/\D/g, '');
  if (!digits) return s;
  const head = digits.slice(0, 2);
  const tail = digits.slice(-2);
  const dots = '●'.repeat(Math.max(digits.length - 4, 4));
  return `${head}${dots}${tail}`;
}

/** Redact all phone-shaped fields in-place for non-Super-Admin viewers. */
export function redactPhoneFieldsForViewer<T>(row: T, viewerIsSuperAdmin: boolean): T {
  if (viewerIsSuperAdmin || !row || typeof row !== 'object') return row;
  const r = row as any;
  if (r.mobile != null) r.mobile = maskPhone(r.mobile);
  if (r.whatsapp != null) r.whatsapp = maskPhone(r.whatsapp);
  if (r.alternateContact != null) r.alternateContact = maskPhone(r.alternateContact);
  if (r.emergencyContact && typeof r.emergencyContact === 'object' && r.emergencyContact.mobile) {
    r.emergencyContact.mobile = maskPhone(r.emergencyContact.mobile);
  }
  return row;
}

/** §5.2 privacy rule: "Other members can only ever see name + city/state of a member." */
export function serializeMemberPublic(member: Member) {
  const address = member.currentAddress as { city?: string; state?: string } | null;
  return {
    publicId: member.publicId,
    fullName: member.fullName,
    photoUrl: member.photoUrl,
    city: address?.city ?? null,
    state: address?.state ?? null,
  };
}

/** Fuller view for the owning member themselves, or an admin with MEMBERS:VIEW in their org.
 *  `viewerIsSuperAdmin` is optional — when omitted or false, phone fields are masked.
 *  Non-breaking: still returns a string for mobile/whatsapp/alternateContact.
 */
export function serializeMemberFull(
  member: any,
  privacy?: MemberPrivacySetting | null,
  viewerIsSuperAdmin: boolean = false,
) {
  const mask = (v: any) => (viewerIsSuperAdmin ? v : (v == null ? v : maskPhone(v)));
  return {
    publicId: member.publicId,
    category: member.category,
    firstName: member.firstName,
    middleName: member.middleName,
    surname: member.surname,
    fullName: member.fullName,
    photoUrl: member.photoUrl,
    gender: member.gender,
    dob: member.dob,
    nationality: member.nationality,
    preferredLanguage: member.preferredLanguage,
    maritalStatus: member.maritalStatus,
    motherTongue: member.motherTongue,
    communityId: member.communityId,
    community: member.community?.name,
    subCommunityId: member.subCommunityId,
    subCommunity: member.subCommunity?.name,
    gacchaId: member.gacchaId,
    gaccha: member.gaccha?.name,
    tithiCalendarTypeId: member.tithiCalendarTypeId,
    mobile: privacy?.showMobile === false ? undefined : mask(member.mobile),
    whatsapp: mask(member.whatsapp),
    alternateContact: mask(member.alternateContact),
    email: member.email,
    currentAddress: privacy?.showAddress === false ? undefined : member.currentAddress,
    permanentAddress: privacy?.showAddress === false ? undefined : member.permanentAddress,
    nativeVillage: member.nativeVillage,
    bloodGroup: member.bloodGroup,
    disability: member.disability,
    medicalNotes: member.medicalNotes,
    emergencyContact: member.emergencyContact && typeof member.emergencyContact === 'object'
      ? { ...member.emergencyContact, mobile: mask((member.emergencyContact as any).mobile) }
      : member.emergencyContact,
    profession: member.profession,
    isVolunteer: member.isVolunteer,
    status: member.status,
    pan: member.panEncrypted ? decryptField(member.panEncrypted) : null,
    aadhaar: member.aadhaarEncrypted ? decryptField(member.aadhaarEncrypted) : null,
    profileCompletionPct: member.profileCompletionPct,
    currencyCode: member.currencyCode,
    createdAt: member.createdAt,
    familyMembers: member.familyMembers?.map((fm: any) => ({
      id: fm.id,
      fullName: fm.relatedMember?.fullName || fm.relatedMember?.firstName || '',
      relationship: fm.relationshipType?.name || fm.relationshipTypeId,
      mobile: mask(fm.relatedMember?.mobile || ''),
    })) || [],
    // §B10: combine the linked-profile lookup (resolved by the caller via
    // resolveSiblingDisplay, since it needs a DB round-trip) with the
    // relationship into one display-ready entry per sibling.
    siblings: Array.isArray(member.siblings)
      ? member.siblings.map((s: any) => ({
          id: s.id,
          linkProfile: !!s.linkProfile,
          siblingMemberId: s.siblingMemberId || null,
          fullName: (s.linkProfile ? member._resolvedSiblingNames?.[s.siblingMemberId] : s.fullName) || s.fullName || '',
          relationship: s.relationship || '',
        }))
      : [],
  };
}
