import { Member, MemberCategory, Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { nextPublicId } from '@/engines/idGenerator/id.service';
import { encryptField, hashForLookup } from '@/utils/encryption';
import { calculateAge, isSeniorCitizen } from '@/utils/dateUtils';
import { currencyForCountry } from '@/engines/currency/currency.service';
import { enqueueNotification } from '@/engines/notification/notification.service';

const NOTIFICATION_CHANNELS = ['PUSH', 'WHATSAPP', 'SMS', 'EMAIL', 'IN_APP'] as const;

async function seedDefaultPreferences(memberId: string) {
  await prisma.memberPrivacySetting.create({ data: { memberId } });
  const rows: Prisma.MemberNotificationPreferenceCreateManyInput[] = [];
  for (const channel of NOTIFICATION_CHANNELS) {
    rows.push({ memberId, channel, category: 'SERVICE', enabled: true });
    rows.push({ memberId, channel, category: 'MARKETING', enabled: false });
  }
  await prisma.memberNotificationPreference.createMany({ data: rows });
  await prisma.memberActivityAggregate.create({ data: { memberId } });
}

/** Simple weighted completion score over the fields the registration form exposes (§5.2). */
export function computeProfileCompletionPct(member: Partial<Member>): number {
  const trackedFields: (keyof Member)[] = [
    'photoUrl', 'gender', 'dob', 'nationality', 'maritalStatus', 'motherTongue', 'communityId',
    'whatsapp', 'email', 'currentAddress', 'permanentAddress', 'nativeVillage', 'bloodGroup',
    'emergencyContact', 'profession',
  ];
  const filled = trackedFields.filter((f) => member[f] !== null && member[f] !== undefined).length;
  return Math.round((filled / trackedFields.length) * 100);
}

async function applyBadgesAndCurrency(memberId: string, dob: Date | null | undefined, country: string | null | undefined) {
  if (dob && isSeniorCitizen(dob)) {
    await prisma.memberBadge.upsert({
      where: { memberId_badge: { memberId, badge: 'SENIOR_CITIZEN' } },
      update: {},
      create: { memberId, badge: 'SENIOR_CITIZEN' },
    });
  }
  return currencyForCountry(country);
}

interface RegisterMemberInput {
  category: MemberCategory;
  firstName: string;
  middleName?: string;
  surname?: string;
  gender?: string;
  dob?: Date;
  nationality?: string;
  preferredLanguage?: string;
  pan?: string;
  aadhaar?: string;
  maritalStatus?: string;
  motherTongue?: string;
  communityId?: string;
  subCommunityId?: string;
  gacchaId?: string;
  tithiCalendarTypeId?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  preferredCommunicationMethod?: string;
  alternateContact?: string;
  currentAddress?: Record<string, unknown>;
  permanentAddress?: Record<string, unknown>;
  sameAsPermanent?: boolean;
  nativeVillage?: string;
  currentLat?: number;
  currentLng?: number;
  bloodGroup?: string;
  disability?: string;
  medicalNotes?: string;
  emergencyContact?: Record<string, unknown>;
  profession?: string;
  isVolunteer?: boolean;
  volunteerAreas?: string[];
  volunteerAvailability?: string;
  favouriteTempleId?: string;
  favouriteDharamshalaId?: string;
  favouriteBhojanshalaId?: string;
  preferredTempleIds?: string[];
  additionalLinks?: { targetType: 'TEMPLE' | 'MONK'; targetId: string }[];
  consents?: { consentType: string; guardianName?: string }[];
  govtDocuments?: { docType: string; docNumber: string; imageUrl?: string }[];
  interests?: string[];
  familyMembers?: { fullName?: string; name?: string; relationship: string; mobile: string }[];
  siblings?: { linkProfile?: boolean; siblingMemberId?: string; fullName?: string; relationship?: string }[];
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'TEMPLE_ADMIN', 'DHARAMSHALA_ADMIN', 'JAIN_CENTER_ADMIN', 'MONK_ADMIN'];

export async function registerMember(input: RegisterMemberInput) {
  // Ensure the mobile number isn't already registered to an existing profile.
  const existingUser = await prisma.user.findUnique({ where: { mobile: input.mobile } });

  if (existingUser) {
    if (existingUser.publicId) throw ApiError.conflict('Profile already exists for this account');
    // Self-registration must never overwrite an admin account's role
    if (ADMIN_ROLES.includes(existingUser.primaryRoleKey)) {
      throw ApiError.conflict('Admin accounts cannot self-register as members — use the admin member-creation flow');
    }
  }

  if (input.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: input.email } });
    if (emailExists) throw ApiError.conflict('This email address is already associated with another account. Please use a different email or leave it blank.');
  }

  if (input.category === 'JAIN' && !input.communityId) {
    throw ApiError.validation({ communityId: ['Community is required for Jain members'] });
  }

  let aadhaarHash: string | null = null;
  if (input.aadhaar) {
    aadhaarHash = hashForLookup(input.aadhaar);
    const dup = await prisma.member.findUnique({ where: { aadhaarHash } });
    if (dup) throw ApiError.conflict('A member with this Aadhaar number already exists');
  }

  const prefix = input.category === 'JAIN' ? 'JAIN_MEMBER' : 'NON_JAIN_MEMBER';
  const fullName = [input.firstName, input.middleName, input.surname].filter(Boolean).join(' ');
  const country = (input.currentAddress?.country as string | undefined) ?? input.nationality;

  const member = await prisma.$transaction(async (tx) => {
    let userId = existingUser?.id;

    const publicId = await nextPublicId(prefix, tx);

    if (userId) {
      await tx.user.update({
        where: { id: userId },
        data: { publicId, status: 'ACTIVE', primaryRoleKey: input.category === 'JAIN' ? 'MEMBER' : 'NON_JAIN_MEMBER' },
      });
    } else {
      const user = await tx.user.create({
        data: {
          mobile: input.mobile,
          email: input.email || undefined,
          publicId,
          status: 'ACTIVE',
          primaryRoleKey: input.category === 'JAIN' ? 'MEMBER' : 'NON_JAIN_MEMBER',
        },
      });
      userId = user.id;
    }

    const created = await tx.member.create({
      data: {
        userId,
        publicId,
        category: input.category,
        firstName: input.firstName,
        middleName: input.middleName,
        surname: input.surname,
        fullName,
        gender: input.gender,
        dob: input.dob,
        nationality: input.nationality,
        preferredLanguage: input.preferredLanguage ?? 'English',
        panEncrypted: input.pan ? encryptField(input.pan) : null,
        aadhaarEncrypted: input.aadhaar ? encryptField(input.aadhaar) : null,
        aadhaarHash,
        maritalStatus: input.maritalStatus,
        motherTongue: input.motherTongue,
        communityId: input.communityId,
        subCommunityId: input.subCommunityId,
        gacchaId: input.gacchaId,
        tithiCalendarTypeId: input.tithiCalendarTypeId,
        mobile: input.mobile,
        mobileVerifiedAt: new Date(),
        whatsapp: input.whatsapp,
        email: input.email,
        preferredCommunicationMethod: input.preferredCommunicationMethod,
        alternateContact: input.alternateContact,
        currentAddress: (input.currentAddress ?? undefined) as Prisma.InputJsonValue,
        permanentAddress: (input.permanentAddress ?? undefined) as Prisma.InputJsonValue,
        sameAsPermanent: input.sameAsPermanent ?? false,
        nativeVillage: input.nativeVillage,
        currentLat: input.currentLat,
        currentLng: input.currentLng,
        bloodGroup: input.bloodGroup,
        disability: input.disability,
        medicalNotes: input.medicalNotes,
        emergencyContact: (input.emergencyContact ?? undefined) as Prisma.InputJsonValue,
        profession: input.profession,
        isVolunteer: input.isVolunteer ?? false,
        volunteerAreas: (input.volunteerAreas ?? undefined) as Prisma.InputJsonValue,
        volunteerAvailability: input.volunteerAvailability,
        favouriteTempleId: input.favouriteTempleId,
        favouriteDharamshalaId: input.favouriteDharamshalaId,
        favouriteBhojanshalaId: input.favouriteBhojanshalaId,
        siblings: (input.siblings ?? undefined) as Prisma.InputJsonValue,
        currencyCode: currencyForCountry(country),
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    });



    if (input.preferredTempleIds?.length) {
      await tx.memberPreferredTemple.createMany({
        data: input.preferredTempleIds.slice(0, 5).map((organizationId, idx) => ({
          memberId: created.id,
          organizationId,
          isFavourite: idx === 0,
        })),
      });
    }

    if (input.additionalLinks?.length) {
      await tx.memberAdditionalLink.createMany({
        data: input.additionalLinks.slice(0, 10).map((l) => ({ memberId: created.id, targetType: l.targetType, targetId: l.targetId })),
      });
    }

    if (input.consents?.length) {
      await tx.memberConsent.createMany({
        data: input.consents.map((c) => ({ memberId: created.id, consentType: c.consentType, guardianName: c.guardianName })),
      });
    }

    if (input.govtDocuments?.length) {
      await tx.memberGovtDocument.createMany({
        data: input.govtDocuments.slice(0, 2).map((d) => ({
          memberId: created.id,
          docType: d.docType,
          docNumberEncrypted: encryptField(d.docNumber),
          imageUrl: d.imageUrl,
        })),
      });
    }

    if (input.interests?.length) {
      await tx.memberInterest.createMany({
        data: input.interests.map((interest) => ({ memberId: created.id, interest })),
        skipDuplicates: true,
      });
    }

    // Return created member with its nested user object for token generation
    return await tx.member.findUniqueOrThrow({
      where: { id: created.id },
      include: { user: true },
    });
  });

  await seedDefaultPreferences(member.id);
  await applyBadgesAndCurrency(member.id, input.dob, country);

  const completion = computeProfileCompletionPct(member);
  await prisma.member.update({ where: { id: member.id }, data: { profileCompletionPct: completion } });

  return { ...member, profileCompletionPct: completion };
}

export async function getMemberByUserId(userId: string) {
  return prisma.member.findUnique({
    where: { userId },
    include: {
      privacySetting: true,
      familyAsPrimary: {
        include: {
          relatedMember: true,
          relationshipType: true,
        },
      },
      community: true,
      subCommunity: true,
      gaccha: true,
    },
  });
}

export async function getMemberByPublicId(publicId: string) {
  const member = await prisma.member.findUnique({
    where: { publicId },
    include: {
      privacySetting: true,
      familyAsPrimary: {
        include: {
          relatedMember: true,
          relationshipType: true,
        },
      },
      community: true,
      subCommunity: true,
      gaccha: true,
    },
  });

  if (!member) {
    return prisma.member.findUnique({
      where: { id: publicId },
      include: {
        privacySetting: true,
        familyAsPrimary: {
          include: {
            relatedMember: true,
            relationshipType: true,
          },
        },
        community: true,
        subCommunity: true,
        gaccha: true,
      },
    });
  }

  return member;
}

export async function getAdminMemberDetails(publicId: string) {
  const includeAll = {
    privacySetting: true,
    familyAsPrimary: {
      include: {
        relatedMember: true,
        relationshipType: true,
      },
    },
    community: true,
    subCommunity: true,
    gaccha: true,
    activityAggregate: true,
    monkFollows: { include: { monk: true } },
    organizationFollows: { include: { organization: true } },
    donations: true,
    bookings: true,
    bhojanshalaPasses: true,
    dharamshalaBookings: true,
    pathshalaBookings: true,
    eventHallBookings: true,
    eventRsvps: { include: { event: true } },
    feedLikes: true,
    govtDocuments: true,
    interests: true,
    consents: true,
    badges: true,
    user: {
      select: {
        id: true,
        primaryRoleKey: true,
        userOrganizations: { select: { id: true } }
      }
    }
  };

  const member = await prisma.member.findUnique({
    where: { publicId },
    include: includeAll,
  });

  if (!member) {
    return prisma.member.findUnique({
      where: { id: publicId },
      include: includeAll,
    });
  }

  return member;
}

/** §B10: resolve linked sibling profile ids to their current display name, for combining with `relationship` at render time. */
export async function resolveSiblingNames(siblings: unknown): Promise<Record<string, string>> {
  if (!Array.isArray(siblings)) return {};
  const ids = siblings
    .filter((s): s is { linkProfile?: boolean; siblingMemberId?: string } => !!s && typeof s === 'object')
    .filter((s) => s.linkProfile && s.siblingMemberId)
    .map((s) => s.siblingMemberId as string);
  if (ids.length === 0) return {};

  const members = await prisma.member.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true } });
  return Object.fromEntries(members.map((m) => [m.id, m.fullName]));
}

export async function updateMemberProfile(memberId: string, input: Partial<RegisterMemberInput>) {
  const existing = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });



  const fullName = input.firstName || input.middleName || input.surname
    ? [input.firstName ?? existing.firstName, input.middleName ?? existing.middleName, input.surname ?? existing.surname].filter(Boolean).join(' ')
    : existing.fullName;

  let aadhaarHash: string | undefined = undefined;
  if (input.aadhaar) {
    const hash = hashForLookup(input.aadhaar);
    const dup = await prisma.member.findFirst({ where: { aadhaarHash: hash, NOT: { id: memberId } } });
    if (dup) throw ApiError.conflict('A member with this Aadhaar number already exists');
    aadhaarHash = hash;
  }

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: {
      panEncrypted: input.pan ? encryptField(input.pan) : undefined,
      aadhaarEncrypted: input.aadhaar ? encryptField(input.aadhaar) : undefined,
      aadhaarHash,
      firstName: input.firstName,
      middleName: input.middleName,
      surname: input.surname,
      fullName,
      gender: input.gender,
      dob: input.dob,
      nationality: input.nationality,
      preferredLanguage: input.preferredLanguage,
      maritalStatus: input.maritalStatus,
      motherTongue: input.motherTongue,
      subCommunityId: input.subCommunityId,
      gacchaId: input.gacchaId,
      tithiCalendarTypeId: input.tithiCalendarTypeId,
      whatsapp: input.whatsapp,
      email: input.email,
      preferredCommunicationMethod: input.preferredCommunicationMethod,
      alternateContact: input.alternateContact,
      currentAddress: input.currentAddress as Prisma.InputJsonValue,
      permanentAddress: input.permanentAddress as Prisma.InputJsonValue,
      sameAsPermanent: input.sameAsPermanent,
      nativeVillage: input.nativeVillage,
      currentLat: input.currentLat,
      currentLng: input.currentLng,
      bloodGroup: input.bloodGroup,
      disability: input.disability,
      medicalNotes: input.medicalNotes,
      emergencyContact: input.emergencyContact as Prisma.InputJsonValue,
      profession: input.profession,
      isVolunteer: input.isVolunteer,
      volunteerAreas: input.volunteerAreas as Prisma.InputJsonValue,
      volunteerAvailability: input.volunteerAvailability,
      favouriteTempleId: input.favouriteTempleId,
      favouriteDharamshalaId: input.favouriteDharamshalaId,
      favouriteBhojanshalaId: input.favouriteBhojanshalaId,
      siblings: input.siblings as Prisma.InputJsonValue,
      updatedById: memberId,
    },
  });

  const completion = computeProfileCompletionPct(updated);
  const finalUpdated = await prisma.member.update({
    where: { id: memberId },
    data: { profileCompletionPct: completion },
    include: {
      privacySetting: true,
      familyAsPrimary: {
        include: {
          relatedMember: true,
          relationshipType: true,
        },
      },
    },
  });

  if (input.familyMembers) {
    await syncFamilyMembers(memberId, input.familyMembers);
    // Reload updated to have the newly synced family members
    return prisma.member.findUniqueOrThrow({
      where: { id: memberId },
      include: {
        privacySetting: true,
        familyAsPrimary: {
          include: {
            relatedMember: true,
            relationshipType: true,
          },
        },
      },
    });
  }

  return finalUpdated;
}

export async function syncFamilyMembers(primaryMemberId: string, familyMembersInput: any[]) {
  if (!familyMembersInput) return;
  const primary = await prisma.member.findUniqueOrThrow({ where: { id: primaryMemberId } });

  // Delete all existing family links for this member to start fresh
  await prisma.familyMember.deleteMany({
    where: { primaryMemberId },
  });

  const { enqueueNotification } = await import('@/engines/notification/notification.service');

  for (const item of familyMembersInput) {
    const mobile = item.mobile;
    const name = item.fullName || item.name;
    const relName = item.relationship || item.relation;
    if (!mobile || !name || !relName) continue;

    // 1. Find or create relationship type
    let relType = await prisma.relationshipType.findFirst({
      where: { name: { equals: relName, mode: 'insensitive' } },
    });
    if (!relType) {
      relType = await prisma.relationshipType.create({
        data: { name: relName },
      });
    }

    // 2. Find or create related user/member
    let relatedUser = await prisma.user.findUnique({
      where: { mobile },
      include: { member: true },
    });

    let relatedMemberId: string;
    let relatedUserId: string;
    let isNewAccount = false;

    if (relatedUser?.member) {
      relatedMemberId = relatedUser.member.id;
      relatedUserId = relatedUser.id;
    } else if (relatedUser && !relatedUser.member) {
      // Continue or skip if user exists without member profile
      continue;
    } else {
      const prefix = primary.category === 'JAIN' ? 'JAIN_MEMBER' : 'NON_JAIN_MEMBER';
      const created = await prisma.$transaction(async (tx) => {
        const publicId = await nextPublicId(prefix, tx);
        const user = await tx.user.create({
          data: {
            mobile,
            publicId,
            status: 'PENDING_OTP',
            primaryRoleKey: primary.category === 'NON_JAIN' ? 'NON_JAIN_MEMBER' : 'MEMBER',
            createdByAdmin: true,
          },
        });
        const member = await tx.member.create({
          data: {
            userId: user.id,
            publicId,
            category: primary.category,
            firstName: name,
            fullName: name,
            mobile,
            communityId: primary.communityId,
            status: 'INACTIVE',
            isAutoCreated: true,
          },
        });
        return { member, userId: user.id };
      });
      await seedDefaultPreferences(created.member.id);
      relatedMemberId = created.member.id;
      relatedUserId = created.userId;
      isNewAccount = true;
    }

    // 3. Create link
    await prisma.familyMember.create({
      data: {
        primaryMemberId,
        relatedMemberId,
        relationshipTypeId: relType.id,
      },
    });

    if (isNewAccount) {
      try {
        await enqueueNotification({
          userId: relatedUserId,
          templateKey: 'FAMILY_MEMBER_ADDED',
          category: 'SERVICE',
          to: { WHATSAPP: mobile, SMS: mobile },
          body: `${primary.fullName} added you as a family member on JiNANAM. Download the app to activate your account: https://jinanam.app/download`,
        });
      } catch (err) {
        console.error('Failed to enqueue family notification:', err);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Family members (§5.2)
// -----------------------------------------------------------------------------

export async function addFamilyMember(primaryMemberId: string, input: { name: string; relationshipTypeId: string; mobile: string; category: MemberCategory }) {
  const primary = await prisma.member.findUniqueOrThrow({ where: { id: primaryMemberId } });

  const existingUser = await prisma.user.findUnique({ where: { mobile: input.mobile }, include: { member: true } });

  let relatedMemberId: string;
  let relatedUserId: string;
  let isNewAccount = false;

  if (existingUser?.member) {
    relatedMemberId = existingUser.member.id;
    relatedUserId = existingUser.id;
  } else if (existingUser && !existingUser.member) {
    throw ApiError.conflict('This mobile number is already registered to a non-member account');
  } else {
    const prefix = input.category === 'JAIN' ? 'JAIN_MEMBER' : 'NON_JAIN_MEMBER';
    const created = await prisma.$transaction(async (tx) => {
      const publicId = await nextPublicId(prefix, tx);
      const user = await tx.user.create({
        data: { mobile: input.mobile, publicId, status: 'PENDING_OTP', primaryRoleKey: input.category === 'JAIN' ? 'MEMBER' : 'NON_JAIN_MEMBER', createdByAdmin: false },
      });
      const member = await tx.member.create({
        data: {
          userId: user.id,
          publicId,
          category: input.category,
          firstName: input.name,
          fullName: input.name,
          mobile: input.mobile,
          communityId: input.category === 'JAIN' ? primary.communityId : null,
          status: 'INACTIVE',
          isAutoCreated: true,
        },
      });
      return { member, userId: user.id };
    });
    await seedDefaultPreferences(created.member.id);
    relatedMemberId = created.member.id;
    relatedUserId = created.userId;
    isNewAccount = true;
  }

  const existingLink = await prisma.familyMember.findUnique({
    where: { primaryMemberId_relatedMemberId: { primaryMemberId, relatedMemberId } },
  });
  if (existingLink) throw ApiError.conflict('This family member is already linked');

  const link = await prisma.familyMember.create({
    data: { primaryMemberId, relatedMemberId, relationshipTypeId: input.relationshipTypeId },
  });

  if (isNewAccount) {
    await enqueueNotification({
      userId: relatedUserId,
      templateKey: 'FAMILY_MEMBER_ADDED',
      category: 'SERVICE',
      to: { WHATSAPP: input.mobile, SMS: input.mobile },
      body: `${primary.fullName} added you as a family member on JiNANAM. Download the app to activate your account: https://jinanam.app/download`,
    });
  }

  return link;
}

/**
 * Admin-driven link between two ALREADY-EXISTING members (as opposed to
 * addFamilyMember above, which is a member's own self-service "add someone by
 * mobile number, creating them if needed" flow, and always links to the
 * *caller's own* profile). This lets an Admin/Super Admin decide that two
 * unrelated existing member records are actually family and link them
 * directly by public ID, without creating anything new.
 */
export async function linkExistingFamilyMembers(input: {
  primaryMemberPublicId: string;
  relatedMemberPublicId: string;
  relationshipTypeId: string;
}) {
  if (input.primaryMemberPublicId === input.relatedMemberPublicId) {
    throw ApiError.validation({ relatedMemberPublicId: ['Cannot link a member to themselves'] });
  }

  const [primary, related] = await Promise.all([
    prisma.member.findUnique({ where: { publicId: input.primaryMemberPublicId } }),
    prisma.member.findUnique({ where: { publicId: input.relatedMemberPublicId } }),
  ]);
  if (!primary) throw ApiError.notFound(`No member found for ID ${input.primaryMemberPublicId}`);
  if (!related) throw ApiError.notFound(`No member found for ID ${input.relatedMemberPublicId}`);

  const existingLink = await prisma.familyMember.findFirst({
    where: {
      OR: [
        { primaryMemberId: primary.id, relatedMemberId: related.id },
        { primaryMemberId: related.id, relatedMemberId: primary.id },
      ],
    },
  });
  if (existingLink) throw ApiError.conflict('These two members are already linked as family');

  const link = await prisma.familyMember.create({
    data: { primaryMemberId: primary.id, relatedMemberId: related.id, relationshipTypeId: input.relationshipTypeId },
    include: {
      primaryMember: { select: { publicId: true, fullName: true, mobile: true, photoUrl: true } },
      relatedMember: { select: { publicId: true, fullName: true, mobile: true, photoUrl: true } },
      relationshipType: { select: { name: true } },
    },
  });

  await enqueueNotification({
    userId: related.userId,
    templateKey: 'FAMILY_MEMBER_ADDED',
    category: 'SERVICE',
    to: { PUSH: related.userId, IN_APP: related.userId },
    body: `${primary.fullName} was linked to you as family on JiNANAM by the administration.`,
  });

  return link;
}

/**
 * Admin-wide directory of every family link across every member — the admin
 * Family Management page previously only had access to GET /family/my (the
 * logged-in caller's own links), which meant an admin had no way to see or
 * search family groups that members had added themselves. Grouped by the
 * primary member so the UI can render one card per family unit.
 */
export async function listAllFamilyLinks(params: { q?: string; page?: number; pageSize?: number }) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 200) : 50;

  const memberWhere: Prisma.MemberWhereInput | undefined = params.q
    ? {
        OR: [
          { fullName: { contains: params.q, mode: 'insensitive' } },
          { mobile: { contains: params.q } },
          { publicId: { contains: params.q, mode: 'insensitive' } },
        ],
      }
    : undefined;

  const where: Prisma.FamilyMemberWhereInput = memberWhere
    ? { OR: [{ primaryMember: memberWhere }, { relatedMember: memberWhere }] }
    : {};

  const [total, links] = await Promise.all([
    prisma.familyMember.count({ where }),
    prisma.familyMember.findMany({
      where,
      include: {
        primaryMember: { select: { publicId: true, fullName: true, mobile: true, photoUrl: true, status: true } },
        relatedMember: { select: { publicId: true, fullName: true, mobile: true, photoUrl: true, status: true } },
        relationshipType: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Group by primary member so the admin UI can render one family unit per card.
  const groups = new Map<string, { primaryMember: unknown; links: unknown[] }>();
  for (const link of links) {
    const key = link.primaryMember.publicId;
    if (!groups.has(key)) groups.set(key, { primaryMember: link.primaryMember, links: [] });
    groups.get(key)!.links.push({
      id: link.id,
      relation: link.relationshipType.name,
      member: link.relatedMember,
      createdAt: link.createdAt,
    });
  }

  return {
    total,
    page,
    pageSize,
    groups: Array.from(groups.values()),
  };
}

/** Called on a family member's first successful OTP login to complete activation (§5.2). */
export async function activateAutoCreatedMemberIfNeeded(memberId: string) {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (member && member.isAutoCreated && member.status === 'INACTIVE') {
    await prisma.member.update({ where: { id: memberId }, data: { status: 'ACTIVE', activatedAt: new Date() } });
  }
}

// -----------------------------------------------------------------------------
// Bulk import (§5.2)
// -----------------------------------------------------------------------------

export async function bulkImportMembers(rows: { name: string; mobile: string; city?: string; state?: string; community?: string; address?: string }[], uploadedById: string) {
  const batch = await prisma.bulkImportBatch.create({
    data: { uploadedById, fileUrl: 'inline-upload', totalRows: rows.length, status: 'PROCESSING' },
  });

  const results: { row: number; success: boolean; publicId?: string; error?: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    try {
      const existingMobile = await prisma.user.findUnique({ where: { mobile: row.mobile } });
      if (existingMobile) throw new Error('Mobile number already registered');

      let communityId: string | undefined;
      if (row.community) {
        const community = await prisma.community.findUnique({ where: { name: row.community } });
        communityId = community?.id;
      }

      const member = await prisma.$transaction(async (tx) => {
        const publicId = await nextPublicId('JAIN_MEMBER', tx);
        const user = await tx.user.create({
          data: { mobile: row.mobile, publicId, status: 'PENDING_OTP', primaryRoleKey: 'MEMBER', createdByAdmin: true },
        });
        return tx.member.create({
          data: {
            userId: user.id,
            publicId,
            category: 'JAIN',
            firstName: row.name,
            fullName: row.name,
            mobile: row.mobile,
            communityId,
            currentAddress: row.city || row.state || row.address ? ({ city: row.city, state: row.state, line1: row.address } as Prisma.InputJsonValue) : undefined,
            status: 'INACTIVE',
            isAutoCreated: true,
          },
        });
      });
      await seedDefaultPreferences(member.id);

      results.push({ row: i + 1, success: true, publicId: member.publicId });
      successCount += 1;
    } catch (err) {
      results.push({ row: i + 1, success: false, error: (err as Error).message });
    }
  }

  await prisma.bulkImportBatch.update({
    where: { id: batch.id },
    data: {
      status: 'COMPLETED',
      successCount,
      failureCount: rows.length - successCount,
      resultJson: results as unknown as Prisma.InputJsonValue,
      completedAt: new Date(),
    },
  });

  return { batchId: batch.id, successCount, failureCount: rows.length - successCount, results };
}

export { calculateAge };
