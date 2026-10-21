import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { nextPublicId } from '@/engines/idGenerator/id.service';
import { enqueueNotification } from '@/engines/notification/notification.service';

/**
 * Monk / MS profiles (§5.4). Shared-profile rule: editable by ALL temple
 * admins (collaborative), delete by Super Admin only, every edit audit-logged.
 * The audit call lives in the controller so it captures actor/IP context.
 */

/** Fire-and-forget: enqueue IN_APP + PUSH notifications to all followers of a monk. */
async function notifyMonkFollowers(
  monkId: string,
  templateKey: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const follows = await prisma.monkFollow.findMany({
      where: { monkId },
      include: { member: { select: { userId: true } } },
    });
    const jobs = follows.map((f) =>
      enqueueNotification({
        userId: f.member.userId,
        templateKey,
        category: 'SERVICE',
        channels: ['IN_APP', 'PUSH'],
        to: { IN_APP: f.member.userId, PUSH: f.member.userId },
        subject: title,
        body,
        data,
      }),
    );
    await Promise.allSettled(jobs);
  } catch (err) {
    console.error(`[monks.service] Failed to notify followers for monk ${monkId}:`, err);
  }
}

export async function createMonk(input: Record<string, unknown> & { createdById: string }) {
  const { createdById, emergencyContact, ...rest } = input as any;
  const monk = await prisma.$transaction(async (tx) => {
    const publicId = await nextPublicId('MONK', tx);
    return tx.monkProfile.create({
      data: {
        publicId,
        ...rest,
        emergencyContact: emergencyContact as Prisma.InputJsonValue,
        createdById,
        updatedById: createdById,
      },
    });
  });

  try {
    const { createAutoFeedCard } = await import('@/modules/feed/feed.service');
    const categoryRow = await prisma.feedCategory.findUnique({ where: { name: 'Monk Updates' } });

    const visibilityConfig = {
      isPublic: false,
      community: {
        communityIds: monk.communityId ? [monk.communityId] : [],
        subCommunityIds: monk.subCommunityId ? [monk.subCommunityId] : [],
        gacchaIds: monk.gacchaId ? [monk.gacchaId] : []
      }
    };

    await createAutoFeedCard({
      sourceModule: 'MONKS',
      sourceId: monk.id,
      title: `Maharaj Saheb Profile Added`,
      description: `${monk.dikshaName} has joined the JiNANAM platform. Follow profile for spiritual updates, vihaar tracking, and routine maryadas.`,
      coverUrl: monk.photoUrl || undefined,
      visibilityConfig,
      categoryId: categoryRow?.id,
    });
  } catch (err) {
    console.error('Failed to create auto feed card for monk creation:', err);
  }

  return monk;
}

export async function updateMonk(monkId: string, input: Record<string, unknown>, updatedById: string) {
  const existing = await prisma.monkProfile.findUnique({ where: { id: monkId } });
  if (!existing || existing.deletedAt) throw ApiError.notFound('Monk profile not found');
  const { emergencyContact, ...rest } = input as any;
  const monk = await prisma.monkProfile.update({
    where: { id: monkId },
    data: { ...rest, emergencyContact: emergencyContact as Prisma.InputJsonValue, updatedById },
  });

  // §C2: each Timeline milestone becomes its own feed post (instead of a
  // private Json blob nothing ever surfaced) — only for entries that weren't
  // already present before this save, so unrelated profile edits don't
  // re-post the same milestones every time.
  if (Array.isArray(rest.timeline)) {
    try {
      const { createAutoFeedCard } = await import('@/modules/feed/feed.service');
      const existingTimeline = Array.isArray(existing.timeline) ? (existing.timeline as any[]) : [];
      const existingKeys = new Set(existingTimeline.map((e) => JSON.stringify(e)));
      const newEntries = (rest.timeline as any[]).filter((e) => e?.eventName && !existingKeys.has(JSON.stringify(e)));

      if (newEntries.length > 0) {
        const categoryRow = await prisma.feedCategory.findUnique({ where: { name: 'Monk Updates' } });
        const visibilityConfig = {
          isPublic: false,
          community: {
            communityIds: monk.communityId ? [monk.communityId] : [],
            subCommunityIds: monk.subCommunityId ? [monk.subCommunityId] : [],
            gacchaIds: monk.gacchaId ? [monk.gacchaId] : [],
          },
        };
        for (const entry of newEntries) {
          await createAutoFeedCard({
            sourceModule: 'MONK_TIMELINE',
            sourceId: monk.id,
            title: entry.eventName,
            description: [entry.place, entry.description].filter(Boolean).join(' — ') || undefined,
            coverUrl: monk.photoUrl || undefined,
            visibilityConfig,
            categoryId: categoryRow?.id,
          });
        }
      }
    } catch (err) {
      console.error('Failed to create timeline feed posts for monk update:', err);
    }
  }

  // Notify all followers about the profile update (fire-and-forget)
  void notifyMonkFollowers(
    monk.id,
    'monk.profile_updated',
    `${monk.dikshaName} — Profile Updated`,
    `The profile of ${monk.dikshaName} has been updated on JiNANAM. Tap to view the latest details.`,
    { monkId: monk.id, monkPublicId: monk.publicId, dikshaName: monk.dikshaName },
  );

  return monk;
}


export async function getMonk(monkId: string) {
  const monk = await prisma.monkProfile.findFirst({
    where: { OR: [{ id: monkId }, { publicId: monkId }], deletedAt: null },
    include: {
      dikshaGuru: { select: { id: true, publicId: true, dikshaName: true, photoUrl: true } },
      discipleOf: { select: { id: true, publicId: true, dikshaName: true, photoUrl: true } },
      currentTemple: { select: { id: true, publicId: true, name: true, city: true } },
      nirvanaTemple: { select: { id: true, publicId: true, name: true, city: true } },
      group: {
        include: {
          members: { select: { id: true, publicId: true, dikshaName: true, photoUrl: true } },
        },
      },
      community: true,
      subCommunity: true,
      gaccha: true,
      _count: { select: { follows: true } },
    },
  });
  if (!monk) throw ApiError.notFound('Monk profile not found');

  const enrichLinkedMember = async (jsonObj: any) => {
    if (jsonObj && typeof jsonObj === 'object' && jsonObj.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: jsonObj.memberId },
        select: { fullName: true, publicId: true, mobile: true },
      });
      if (member) {
        return {
          ...jsonObj,
          name: `${member.fullName} (${member.publicId})`,
          mobile: member.mobile,
        };
      }
    }
    return jsonObj;
  };

  monk.preDikshaFather = await enrichLinkedMember(monk.preDikshaFather) as any;
  monk.preDikshaMother = await enrichLinkedMember(monk.preDikshaMother) as any;
  
  if (Array.isArray(monk.siblings)) {
    monk.siblings = await Promise.all(monk.siblings.map(enrichLinkedMember)) as any;
  }

  if (monk.sanghContacts && typeof monk.sanghContacts === 'object') {
    const sc = monk.sanghContacts as any;
    if (Array.isArray(sc.jainContacts)) {
      sc.jainContacts = await Promise.all(sc.jainContacts.map(enrichLinkedMember));
    }
    if (Array.isArray(sc.nonJainContacts)) {
      sc.nonJainContacts = await Promise.all(sc.nonJainContacts.map(enrichLinkedMember));
    }
  }

  // Fetch active journey (if monk is currently Moving on a route)
  const activeJourney = await prisma.journey.findFirst({
    where: { monkId: monk.id, status: 'IN_PROGRESS' },
    include: {
      route: { select: { name: true, stops: true, journeyDate: true } },
    },
    orderBy: { startedAt: 'desc' },
  });

  // Fetch active/current Chaturmas plan (started, not yet ended)
  const now = new Date();
  const activeChaturmas = await prisma.chaturmasPlan.findFirst({
    where: {
      deletedAt: null,
      AND: [
        { startDate: { lte: now } },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        { OR: [{ monkId: monk.id }, { monkIds: { array_contains: monk.id } }] },
      ],
    },
    include: {
      organization: { select: { id: true, name: true, city: true, state: true, publicId: true } },
    },
    orderBy: { startDate: 'desc' },
  });

  return {
    ...monk,
    activeJourney: activeJourney
      ? {
          id: activeJourney.id,
          routeName: activeJourney.route.name,
          stops: activeJourney.route.stops,
          journeyDate: activeJourney.route.journeyDate,
          currentStopIndex: activeJourney.currentStopIndex,
        }
      : null,
    activeChaturmas: activeChaturmas
      ? {
          id: activeChaturmas.id,
          year: activeChaturmas.year,
          startDate: activeChaturmas.startDate,
          endDate: activeChaturmas.endDate,
          orgName: activeChaturmas.organization?.name ?? null,
          city: activeChaturmas.organization?.city ?? null,
          state: activeChaturmas.organization?.state ?? null,
        }
      : null,
  };
}



export async function listMonks(filters: { templeId?: string; groupId?: string; gender?: 'SADHU' | 'SADHVI'; search?: string }) {
  return prisma.monkProfile.findMany({
    where: {
      deletedAt: null,
      currentTempleId: filters.templeId,
      groupId: filters.groupId,
      gender: filters.gender,
      // §C3: search matches the monk's own name/id OR their current temple's
      // id/name, so an admin who only knows a temple's ID can find every monk
      // stationed there from the same search box.
      ...(filters.search
        ? {
            OR: [
              { dikshaName: { contains: filters.search, mode: 'insensitive' as const } },
              { publicId: { contains: filters.search, mode: 'insensitive' as const } },
              { currentTemple: { publicId: { contains: filters.search, mode: 'insensitive' as const } } },
              { currentTemple: { name: { contains: filters.search, mode: 'insensitive' as const } } },
              { nirvanaTemple: { name: { contains: filters.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    },
    include: { 
      currentTemple: { select: { id: true, publicId: true, name: true, city: true } },
      nirvanaTemple: { select: { id: true, publicId: true, name: true, city: true } },
      community: { select: { name: true } },
      _count: { select: { follows: true } },
    },
    orderBy: { dikshaName: 'asc' },
  });
}

export async function softDeleteMonk(monkId: string, deletedById: string) {
  return prisma.monkProfile.update({ where: { id: monkId }, data: { deletedAt: new Date(), deletedById } });
}

// --- Monk groups ---

export async function createMonkGroup(input: {
  name: string;
  leaderMonkId?: string;
  memberMonkIds?: string[];
  jainMembers?: any;
  nonJainMembers?: any;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const groupNumber = await nextPublicId('MONK_GROUP', tx);
    const group = await tx.monkGroup.create({
      data: {
        name: input.name,
        leaderMonkId: input.leaderMonkId,
        groupNumber,
        jainMembers: input.jainMembers || undefined,
        nonJainMembers: input.nonJainMembers || undefined,
        notes: input.notes || undefined,
      },
    });
    if (input.memberMonkIds?.length) {
      await tx.monkProfile.updateMany({
        where: { id: { in: input.memberMonkIds } },
        data: { groupId: group.id },
      });
    }
    return tx.monkGroup.findUnique({ where: { id: group.id }, include: { members: true } });
  });
}

export async function listMonkGroups() {
  return prisma.monkGroup.findMany({
    where: { deletedAt: null },
    include: {
      members: { select: { id: true, dikshaName: true, publicId: true, photoUrl: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function updateMonkGroup(groupId: string, input: {
  name?: string;
  leaderMonkId?: string;
  memberMonkIds?: string[];
  jainMembers?: any;
  nonJainMembers?: any;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.monkGroup.findUnique({ where: { id: groupId } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('Monk group not found');

    const group = await tx.monkGroup.update({
      where: { id: groupId },
      data: {
        name: input.name,
        leaderMonkId: input.leaderMonkId,
        jainMembers: input.jainMembers !== undefined ? input.jainMembers : undefined,
        nonJainMembers: input.nonJainMembers !== undefined ? input.nonJainMembers : undefined,
        notes: input.notes !== undefined ? input.notes : undefined,
      },
    });

    if (input.memberMonkIds !== undefined) {
      // Unlink previous members that are not in the new list
      await tx.monkProfile.updateMany({
        where: { groupId: group.id, id: { notIn: input.memberMonkIds } },
        data: { groupId: null },
      });
      
      if (input.memberMonkIds.length > 0) {
        // Link new members
        await tx.monkProfile.updateMany({
          where: { id: { in: input.memberMonkIds } },
          data: { groupId: group.id },
        });
      }
    }

    return tx.monkGroup.findUnique({ where: { id: group.id }, include: { members: true } });
  });
}

export async function deleteMonkGroup(groupId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.monkGroup.findUnique({ where: { id: groupId } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('Monk group not found');

    // Unlink all members
    await tx.monkProfile.updateMany({
      where: { groupId },
      data: { groupId: null },
    });

    return tx.monkGroup.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });
  });
}

// --- Join Monk (follow) ---

export async function followMonk(monkId: string, memberId: string) {
  return prisma.monkFollow.upsert({
    where: { monkId_memberId: { monkId, memberId } },
    update: {},
    create: { monkId, memberId },
  });
}

export async function unfollowMonk(monkId: string, memberId: string) {
  await prisma.monkFollow.deleteMany({ where: { monkId, memberId } });
}
