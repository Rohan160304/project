import { OrganizationType, Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { nextPublicId } from '@/engines/idGenerator/id.service';
import { encryptField } from '@/utils/encryption';
import { MAX_TRUSTEES, MAX_DHAJA_YEARS, MAX_TEMPLE_GALLERY_IMAGES, MAX_DHARAMSHALA_GALLERY_IMAGES, ID_PREFIXES } from '@/config/constants';

const PREFIX_BY_TYPE: Record<OrganizationType, keyof typeof ID_PREFIXES> = {
  TEMPLE: 'TEMPLE',
  JAIN_CENTER: 'JAIN_CENTER',
  DHARAMSHALA: 'DHARAMSHALA',
  BHOJANSHALA: 'BHOJANSHALA',
  COMMUNITY_HALL: 'COMMUNITY_HALL',
  TRUST_OFFICE: 'TRUST_OFFICE',
  STHANAK: 'STHANAK',
  PATHSHALA: 'PATHSHALA',
  GAUSHALA: 'GAUSHALA',
};

/** Only Super Admin creates Temples/JCs/Dharamshalas (§5.5, §5.6) — enforced at the route layer via requireRole. */
export async function createOrganization(input: Record<string, unknown> & { type: OrganizationType; createdById: string }) {
  // §57/#58: buildings has no matching column on Organization — it must be
  // pulled out before the Prisma create() call (previously it wasn't, so
  // submitting building/room data during initial creation crashed with an
  // "unknown argument" error) and synced separately afterward instead.
  const { type, createdById, bankAccount, buildings, childOrganizationIds, ...rest } = input as any;

  const publicId = await prisma.$transaction((tx) => nextPublicId(PREFIX_BY_TYPE[type as OrganizationType], tx));

  const FK_RELATION_FIELDS = [
    'mulNayakBhagwanId', 'communityId', 'subCommunityId', 'gacchaId',
    'parentOrganizationId', 'tithiCalendarTypeId', 'createdById', 'updatedById',
  ];
  const cleanedRest = { ...rest };
  console.log("UPDATE ORG CALLED WITH REST:", rest);
  for (const field of FK_RELATION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(cleanedRest, field) && cleanedRest[field] === '') {
      cleanedRest[field] = null;
    }
  }

  const org = await prisma.organization.create({
    data: {
      publicId,
      type,
      ...cleanedRest,
      facilities: cleanedRest.facilities as Prisma.InputJsonValue,
      bankAccountEncrypted: bankAccount ? encryptField(bankAccount) : null,
      createdById,
      updatedById: createdById,
      ...(childOrganizationIds && Array.isArray(childOrganizationIds) ? {
        childOrganizations: { connect: childOrganizationIds.map((id: string) => ({ id })) }
      } : {})
    },
  });

  if (buildings && Array.isArray(buildings)) {
    await syncOrgBuildings(org.id, buildings, cleanedRest.preferredCurrency);
  }

  try {
    const { createAutoFeedCard } = await import('@/modules/feed/feed.service');
    const catName = org.type === 'TEMPLE' ? 'Temple Updates' : org.type === 'JAIN_CENTER' ? 'Jain Centre Updates' : 'Dharamshala Updates';
    const categoryRow = await prisma.feedCategory.findUnique({ where: { name: catName } });

    const visibilityConfig = {
      isPublic: false,
      community: {
        communityIds: org.communityId ? [org.communityId] : [],
        subCommunityIds: org.subCommunityId ? [org.subCommunityId] : [],
        gacchaId: org.gacchaId ? [org.gacchaId] : []
      },
      geo: {
        city: org.city || undefined,
        state: org.state || undefined,
        country: org.country || undefined
      }
    };

    await createAutoFeedCard({
      sourceModule: org.type === 'TEMPLE' ? 'TEMPLES' : org.type === 'JAIN_CENTER' ? 'JAIN_CENTERS' : 'DHARAMSHALAS',
      sourceId: org.id,
      organizationId: org.id,
      title: `${org.name} Registered`,
      description: `${org.name} is now registered on JiNANAM. View details for timings, facilities, and contact details.`,
      coverUrl: org.logoUrl || undefined,
      visibilityConfig,
      categoryId: categoryRow?.id,
    });
  } catch (err) {
    console.error('Failed to create auto feed card for organization registration:', err);
  }

  return org;
}

/**
 * §57/#58: shared building/room sync used by both create and update — buildings
 * previously could only ever be synced from updateOrganization, so submitting
 * building/room data during initial creation would crash (buildings has no
 * matching column on Organization, so it was never stripped before the
 * Prisma create() call). Extracted so createOrganization can use it too.
 */
async function syncOrgBuildings(organizationId: string, buildings: any[], preferredCurrency?: string) {
  const isDbId = (id: string) => id && id.length > 10 && isNaN(Number(id));

  // Get all existing buildings for this organization to handle deletions
  const existingBuildings = await prisma.building.findMany({
      where: { organizationId, deletedAt: null },
      include: { wings: { where: { deletedAt: null }, include: { rooms: { where: { deletedAt: null } } } } }
    });

    // Soft delete buildings not present in incoming payload
    const incomingBuildingIds = new Set(buildings.map(b => b.id).filter(id => isDbId(id)));
    for (const eb of existingBuildings) {
      if (!incomingBuildingIds.has(eb.id)) {
        await prisma.building.update({
          where: { id: eb.id },
          data: { deletedAt: new Date() }
        });
        // Soft delete all wings and rooms in this building
        for (const wing of eb.wings) {
          await prisma.wing.update({
            where: { id: wing.id },
            data: { deletedAt: new Date() }
          });
          for (const room of wing.rooms) {
            await prisma.roomOrHall.update({
              where: { id: room.id },
              data: { deletedAt: new Date() }
            });
          }
        }
      }
    }

    // Process each incoming building
    for (const b of buildings) {
      let buildingId = b.id;
      let dbBuilding;

      if (isDbId(buildingId)) {
        dbBuilding = await prisma.building.update({
          where: { id: buildingId },
          data: { name: b.name, imageUrl: b.imageUrl || null, roomNumbers: (b.roomNumbers ?? undefined) as Prisma.InputJsonValue }
        });
      } else {
        dbBuilding = await prisma.building.create({
          data: {
            organizationId,
            name: b.name,
            imageUrl: b.imageUrl || null,
            roomNumbers: (b.roomNumbers ?? undefined) as Prisma.InputJsonValue
          }
        });
        buildingId = dbBuilding.id;
      }

      // Ensure we have a default Main Wing for this building
      let wing = await prisma.wing.findFirst({
        where: { buildingId, deletedAt: null }
      });
      if (!wing) {
        wing = await prisma.wing.create({
          data: {
            buildingId,
            name: 'Main Wing'
          }
        });
      }
      const wingId = wing.id;

      // Handle rooms under this wing
      const incomingRoomIds = new Set((b.roomTypes || []).map((r: any) => r.id).filter((id: string) => isDbId(id)));
      const existingRooms = await prisma.roomOrHall.findMany({
        where: { wingId, deletedAt: null }
      });

      // Soft delete rooms not in incoming payload
      for (const er of existingRooms) {
        if (!incomingRoomIds.has(er.id)) {
          await prisma.roomOrHall.update({
            where: { id: er.id },
            data: { deletedAt: new Date() }
          });
        }
      }

      // Process each incoming room
      for (const r of b.roomTypes || []) {
        const capacity = Number(r.bedCapacity) || 2;
        const pricePerUnit = Number(r.charges) || 0;
        const roomCount = Number(r.roomCount) || 1;
        const deposit = Number(r.deposit) || 0;
        const extraMattressCount = Number(r.extraMattressCount) || 0;
        const extraMattressCharge = Number(r.extraMattressCharge) || 0;

        let type: 'ROOM' | 'DORMITORY' | 'HALL' = 'ROOM';
        if (r.type === 'Dormitory') {
          type = 'DORMITORY';
        } else if (r.type === 'Hall') {
          type = 'HALL';
        }

        // §58: room charges previously always stored a hardcoded 'INR' code
        // regardless of the org's actual preferred currency (e.g. "USD ($)")
        // — extract the real code so charges display in the right currency.
        const currencyCode = typeof preferredCurrency === 'string' && preferredCurrency
          ? preferredCurrency.split(' ')[0]
          : 'INR';

        const roomData = {
          name: r.name,
          type,
          capacity,
          pricePerUnit,
          currency: currencyCode,
          roomNumber: r.roomNumber || null,
          viewType: r.viewType || null,
          bathroomType: r.bathroomType || null,
          bedType: r.bedType || null,
          extraMattressCount,
          extraMattressCharge,
          category: r.category || null,
          roomCount,
          chargesType: r.chargesType || null,
          deposit,
          attachedBathroom: r.attachedBathroom || null,
          amenities: Array.isArray(r.amenities) ? r.amenities : [],
          images: (Array.isArray(r.images) ? r.images : []) as Prisma.InputJsonValue,
          status: 'AVAILABLE' as const
        };

        if (isDbId(r.id)) {
          await prisma.roomOrHall.update({
            where: { id: r.id },
            data: roomData
          });
        } else {
          await prisma.roomOrHall.create({
            data: {
              wingId,
              ...roomData
            }
          });
        }
      }
    }
  }
/** Sync buildings/rooms, then persist the rest of the org's fields. */
export async function updateOrganization(organizationId: string, input: Record<string, unknown>, updatedById: string) {
  const { bankAccount, buildings, childOrganizationIds, ...rest } = input as any;

  // B3 Fix: Convert empty-string FK relation IDs to null/undefined to prevent
  // Prisma FK constraint violations (e.g., mulNayakBhagwanId: "" → undefined).
  const FK_RELATION_FIELDS = [
    'mulNayakBhagwanId', 'communityId', 'subCommunityId', 'gacchaId',
    'parentOrganizationId', 'tithiCalendarTypeId', 'createdById', 'updatedById',
  ];
  const cleanedRest = { ...rest };
  console.log("UPDATE ORG CALLED WITH REST:", rest);
  for (const field of FK_RELATION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(cleanedRest, field) && cleanedRest[field] === '') {
      cleanedRest[field] = null; // null disconnects the relation safely
    }
  }

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...cleanedRest,
      facilities: cleanedRest.facilities as Prisma.InputJsonValue,
      ...(bankAccount ? { bankAccountEncrypted: encryptField(bankAccount) } : {}),
      updatedById,
      updatedAt: new Date(),
      ...(childOrganizationIds && Array.isArray(childOrganizationIds) ? {
        childOrganizations: { set: childOrganizationIds.map((id: string) => ({ id })) }
      } : {})
    },
  });

  // Sync buildings and rooms if they are provided
  if (buildings && Array.isArray(buildings)) {
    await syncOrgBuildings(organizationId, buildings, cleanedRest.preferredCurrency);
  }

  return org;
}

export async function getOrganization(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      community: true,
      subCommunity: true,
      mulNayakBhagwan: true,
      parentOrganization: true,
      childOrganizations: true,
      gallery: { orderBy: { order: 'asc' } },
      trustees: { include: { member: true } },
      volunteers: { include: { member: true } },
      contacts: { include: { member: true } },
      reviews: { where: { deletedAt: null }, include: { member: true }, orderBy: { createdAt: 'desc' } },
      historyEvents: true,
      dhajaRecords: { orderBy: { year: 'desc' } },
      notices: {
        where: {
          deletedAt: null
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
      },
      announcements: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' }
      },
      socialLinks: true,
      _count: {
        select: { follows: true }
      }
    },
  });
  if (!org) throw ApiError.notFound('Organization not found');

  const followerCount = org._count?.follows || 0;
  const sect = org.community?.name || undefined;
  const subSect = org.subCommunity?.name || undefined;
  const establishedYear = org.establishedDate ? org.establishedDate.getFullYear() : undefined;
  
  // Populate Dhaja member details
  if (org.dhajaRecords && org.dhajaRecords.length > 0) {
    for (const record of org.dhajaRecords) {
      if (record.linkedMemberIds && Array.isArray(record.linkedMemberIds)) {
        for (const item of record.linkedMemberIds as any[]) {
          if (item.memberIds && Array.isArray(item.memberIds) && item.memberIds.length > 0) {
            const members = await prisma.member.findMany({
              where: {
                OR: [
                  { id: { in: item.memberIds } },
                  { publicId: { in: item.memberIds } }
                ]
              },
              select: { id: true, publicId: true, firstName: true, middleName: true, surname: true }
            });
            item.members = members.map(m => ({
              ...m,
              fullName: [m.firstName, m.middleName, m.surname].filter(Boolean).join(' ')
            }));
          }
        }
      }
    }
  }

  // If this is a Dharamshala, populate and map its buildings/rooms
  if (org.type === 'DHARAMSHALA') {
    const dbBuildings = await prisma.building.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        wings: {
          where: { deletedAt: null },
          include: {
            rooms: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    const mappedBuildings = dbBuildings.map((b) => {
      const allRooms = b.wings.flatMap((w: any) => w.rooms);
      const grouped = new Map<string, any>();
      for (const r of allRooms) {
        const key = `${r.name}|${r.category}|${r.type}|${r.pricePerUnit}|${r.capacity}`;
        if (!grouped.has(key)) {
          grouped.set(key, { ...r, _actualCount: 1 });
        } else {
          grouped.get(key)._actualCount += 1;
        }
      }

      const roomTypes = Array.from(grouped.values()).map((r: any) => ({
        id: r.id,
        name: r.name,
        category: r.category || (r.type === 'ROOM' ? 'AC' : 'Non-AC'),
        type: r.type === 'DORMITORY' ? 'Dormitory' : r.type === 'HALL' ? 'Hall' : 'Private',
        roomCount: String(r._actualCount),
        bedCapacity: String(r.capacity),
        charges: r.pricePerUnit ? String(r.pricePerUnit) : '0',
        chargesType: r.chargesType || 'Per Room',
        deposit: r.deposit ? String(r.deposit) : '0',
        attachedBathroom: r.attachedBathroom || 'Yes',
        amenities: Array.isArray(r.amenities) ? r.amenities : [],
        roomNumber: r.roomNumber || '',
        viewType: r.viewType || 'Garden',
        bathroomType: r.bathroomType || 'Western',
        bedType: r.bedType || 'Double Occupancy',
        extraMattressCount: r.extraMattressCount || 0,
        extraMattressCharge: r.extraMattressCharge ? Number(r.extraMattressCharge) : 0,
      }));

      return {
        id: b.id,
        name: b.name,
        imageUrl: b.imageUrl || '',
        roomNumbers: Array.isArray(b.roomNumbers) ? b.roomNumbers : [],
        roomTypes
      };
    });

    return {
      ...org,
      sect,
      subSect,
      establishedYear,
      followerCount,
      buildings: mappedBuildings
    };
  }

  return {
    ...org,
    sect,
    subSect,
    establishedYear,
    followerCount
  };
}

export async function listOrganizations(type: OrganizationType, filters: { city?: string; state?: string; hasBhojanshala?: boolean; q?: string }, actor?: any) {
  const whereClause: any = {
    deletedAt: null,
    city: filters.city,
    state: filters.state,
  };

  if (filters.hasBhojanshala !== undefined) {
    whereClause.hasBhojanshala = filters.hasBhojanshala;
  }

  if (filters.q) {
    whereClause.AND = [
      {
        OR: [
          { name: { contains: filters.q, mode: 'insensitive' } },
          { trustRegistrationNumber: { contains: filters.q, mode: 'insensitive' } }
        ]
      }
    ];
  }

  if (type === 'DHARAMSHALA') {
    whereClause.type = 'DHARAMSHALA';
    if (!actor?.isSuperAdmin) {
      if (actor?.organizationIds && actor.organizationIds.length > 0) {
        whereClause.OR = [
          { dharamshalaPublished: true },
          { id: { in: actor.organizationIds } }
        ];
      } else {
        whereClause.dharamshalaPublished = true;
      }
    }
  } else if (type === 'BHOJANSHALA') {
    whereClause.type = 'BHOJANSHALA';
    if (!actor?.isSuperAdmin) {
      if (actor?.organizationIds && actor.organizationIds.length > 0) {
        whereClause.OR = [
          { bhojanshalaPublished: true },
          { id: { in: actor.organizationIds } }
        ];
      } else {
        whereClause.bhojanshalaPublished = true;
      }
    }
  } else if (type === 'PATHSHALA') {
    if (actor?.isSuperAdmin) {
      whereClause.OR = [
        { type: 'PATHSHALA' },
        { hasPathshala: true }
      ];
    } else if (actor?.organizationIds && actor.organizationIds.length > 0) {
      whereClause.OR = [
        { pathshalaPublished: true },
        { id: { in: actor.organizationIds }, type: 'PATHSHALA' },
        { id: { in: actor.organizationIds }, hasPathshala: true }
      ];
    } else {
      whereClause.OR = [
        { type: 'PATHSHALA', pathshalaPublished: true },
        { hasPathshala: true, pathshalaPublished: true }
      ];
    }
  } else {
    whereClause.type = type;
  }

  return prisma.organization.findMany({
    where: whereClause,
    include: {
      parentOrganization: true,
      childOrganizations: true,
      userOrganizations: {
        where: {
          user: {
            deletedAt: null
          }
        },
        include: {
          user: {
            include: {
              member: {
                select: {
                  publicId: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' },
  });
}

/** Bhojanalay directory — view-only listing of temples with bhojanshala = yes (§5.5). */
export async function listBhojanalayDirectory() {
  return prisma.organization.findMany({ where: { bhojanshalaPublished: true, deletedAt: null }, orderBy: { name: 'asc' } });
}

export async function addGalleryImage(organizationId: string, imageUrl: string, order: number, orgType: OrganizationType) {
  const count = await prisma.organizationGalleryImage.count({ where: { organizationId } });
  const max = orgType === 'DHARAMSHALA' ? MAX_DHARAMSHALA_GALLERY_IMAGES : MAX_TEMPLE_GALLERY_IMAGES;
  if (count >= max) throw ApiError.validation({ gallery: [`Maximum ${max} images allowed`] });

  const galleryImage = await prisma.organizationGalleryImage.create({ data: { organizationId, imageUrl, order } });

  try {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (org) {
      const { createAutoFeedCard } = await import('@/modules/feed/feed.service');
      const categoryRow = await prisma.feedCategory.findUnique({ where: { name: 'Photos' } });

      const visibilityConfig = {
        isPublic: false,
        community: {
          communityIds: org.communityId ? [org.communityId] : [],
          subCommunityIds: org.subCommunityId ? [org.subCommunityId] : [],
          gacchaId: org.gacchaId ? [org.gacchaId] : []
        },
        geo: {
          city: org.city || undefined,
          state: org.state || undefined,
          country: org.country || undefined
        }
      };

      await createAutoFeedCard({
        sourceModule: 'GALLERY',
        sourceId: galleryImage.id,
        organizationId,
        title: `New Photo added to ${org.name}`,
        description: `A new exterior/interior photo has been uploaded to the ${org.name} gallery.`,
        coverUrl: imageUrl,
        visibilityConfig,
        categoryId: categoryRow?.id,
      });
    }
  } catch (err) {
    console.error('Failed to create auto feed card for gallery image:', err);
  }

  return galleryImage;
}

export async function addTrustee(organizationId: string, memberId: string, designation: string) {
  const count = await prisma.organizationTrustee.count({ where: { organizationId } });
  if (count >= MAX_TRUSTEES) throw ApiError.validation({ trustees: [`Maximum ${MAX_TRUSTEES} trustees allowed`] });
  return prisma.organizationTrustee.create({ data: { organizationId, memberId, designation } });
}

export async function addVolunteer(organizationId: string, memberId: string, area?: string) {
  const volunteer = await prisma.organizationVolunteer.create({ data: { organizationId, memberId, area } });
  await prisma.member.update({ where: { id: memberId }, data: { isVolunteer: true } });
  await prisma.memberBadge.upsert({
    where: { memberId_badge: { memberId, badge: 'VOLUNTEER' } },
    update: {},
    create: { memberId, badge: 'VOLUNTEER' },
  });
  // Trigger realtime stats broadcast
  try {
    const { broadcastDashboardUpdate } = require('../dashboard/dashboard.service');
    broadcastDashboardUpdate(organizationId);
  } catch (err) {
    // ignore
  }

  return volunteer;
}

export async function addContact(organizationId: string, memberId: string, role?: string) {
  return prisma.organizationContact.create({ data: { organizationId, memberId, role } });
}

export async function verifyContact(contactId: string) {
  return prisma.organizationContact.update({ where: { id: contactId }, data: { otpVerifiedAt: new Date() } });
}

/**
 * Dhaja Management (§5.5) — multiple entries per year are allowed (one per
 * Mandir/Shikhar), so this is a plain create, not an upsert keyed by year.
 * Capped at MAX_DHAJA_YEARS total entries per organization.
 */
export async function addDhajaRecord(organizationId: string, input: { year: number; dhajaOf?: string; dhajaDate?: Date; descriptionEn?: string; descriptionHi?: string; linkedMemberIds?: string[]; items?: any[]; status?: any }) {
  const totalRecords = await prisma.dhajaRecord.count({ where: { organizationId } });
  if (totalRecords >= MAX_DHAJA_YEARS) {
    throw ApiError.validation({ year: [`Maximum ${MAX_DHAJA_YEARS} Dhaja records allowed`] });
  }
  // If items are provided, use them as the JSON content for linkedMemberIds to store the complex array
  const jsonContent = input.items && input.items.length > 0 ? input.items : input.linkedMemberIds;

  return prisma.dhajaRecord.create({
    data: {
      organizationId,
      year: input.year,
      dhajaOf: input.dhajaOf,
      dhajaDate: input.dhajaDate,
      descriptionEn: input.descriptionEn,
      descriptionHi: input.descriptionHi,
      linkedMemberIds: jsonContent as Prisma.InputJsonValue,
      status: input.status ?? 'NOT_YET_FINALIZED',
    },
  });
}

export async function updateDhajaRecord(dhajaRecordId: string, input: { dhajaOf?: string; dhajaDate?: Date; descriptionEn?: string; descriptionHi?: string; linkedMemberIds?: string[]; items?: any[]; status?: any }) {
  // If items are provided, use them as the JSON content for linkedMemberIds to store the complex array
  const jsonContent = input.items && input.items.length > 0 ? input.items : input.linkedMemberIds;

  return prisma.dhajaRecord.update({
    where: { id: dhajaRecordId },
    data: {
      dhajaOf: input.dhajaOf,
      dhajaDate: input.dhajaDate,
      descriptionEn: input.descriptionEn,
      descriptionHi: input.descriptionHi,
      linkedMemberIds: jsonContent !== undefined ? (jsonContent as Prisma.InputJsonValue) : undefined,
      status: input.status,
    },
  });
}

/** Reviews: members rate 1-5 + comment; admin can reply but NOT delete; only Super Admin edits/hides/deletes (§5.5). */
export async function addReview(organizationId: string, memberId: string, rating: number, comment?: string) {
  const review = await prisma.organizationReview.upsert({
    where: { organizationId_memberId: { organizationId, memberId } },
    update: { rating, comment },
    create: { organizationId, memberId, rating, comment },
  });
  await recomputeAvgRating(organizationId);
  return review;
}

export async function replyToReview(reviewId: string, adminReply: string) {
  return prisma.organizationReview.update({ where: { id: reviewId }, data: { adminReply } });
}

export async function publishReview(reviewId: string, isPublished: boolean) {
  const review = await prisma.organizationReview.update({ where: { id: reviewId }, data: { isPublished } });
  await recomputeAvgRating(review.organizationId);
  return review;
}

export async function hideReview(reviewId: string, hiddenById: string) {
  const review = await prisma.organizationReview.update({ where: { id: reviewId }, data: { isHidden: true, deletedById: hiddenById } });
  await recomputeAvgRating(review.organizationId);
  return review;
}

async function recomputeAvgRating(organizationId: string) {
  const agg = await prisma.organizationReview.aggregate({
    where: { organizationId, isHidden: false, isPublished: true, deletedAt: null },
    _avg: { rating: true },
  });
  await prisma.organization.update({ where: { id: organizationId }, data: { avgRating: agg._avg.rating ?? 0 } });
}

export async function addNotice(organizationId: string, input: { title: string; body: string; isPinned?: boolean; startDate?: Date; endDate?: Date }, createdById: string) {
  const notice = await prisma.organizationNotice.create({ data: { organizationId, ...input, createdById } });

  // Auto feed-card (§5.13)
  const { createAutoFeedCard } = await import('@/modules/feed/feed.service');
  await createAutoFeedCard({
    sourceModule: 'NOTICES',
    sourceId: notice.id,
    organizationId,
    title: input.title,
    description: input.body,
  });

  return notice;
}

export async function addTempleAnnouncement(organizationId: string, input: { title: string; body: string; visibilityConfig?: Record<string, unknown> }, createdById: string) {
  const announcement = await prisma.announcement.create({ data: { organizationId, title: input.title, body: input.body, visibilityConfig: input.visibilityConfig as Prisma.InputJsonValue, createdById } });

  // Auto feed-card (§5.13)
  const { createAutoFeedCard } = await import('@/modules/feed/feed.service');
  await createAutoFeedCard({
    sourceModule: 'ANNOUNCEMENTS',
    sourceId: announcement.id,
    organizationId,
    title: input.title,
    description: input.body,
    visibilityConfig: input.visibilityConfig,
  });

  return announcement;
}

export async function followOrganization(organizationId: string, memberId: string) {
  const existing = await prisma.organizationFollow.findUnique({ where: { organizationId_memberId: { organizationId, memberId } } });
  if (!existing) {
    const follow = await prisma.organizationFollow.create({ data: { organizationId, memberId } });
    await prisma.organization.update({ where: { id: organizationId }, data: { followersCount: { increment: 1 } } });
    return follow;
  }
  return existing;
}

export async function unfollowOrganization(organizationId: string, memberId: string) {
  const deleted = await prisma.organizationFollow.deleteMany({ where: { organizationId, memberId } });
  if (deleted.count > 0) {
    await prisma.organization.update({ where: { id: organizationId }, data: { followersCount: { decrement: 1 } } });
  }
}

/** "Report Incorrect Information" auto-creates a support ticket (§5.5). */
export async function reportIncorrectInfo(organizationId: string, description: string, raisedByUserId: string) {
  const publicId = await prisma.$transaction((tx) => nextPublicId('SUPPORT_TICKET', tx));
  return prisma.supportTicket.create({
    data: {
      publicId,
      type: 'INCORRECT_INFO',
      raisedByUserId,
      organizationId,
      subject: 'Incorrect information reported',
      description,
      relatedEntityType: 'Organization',
      relatedEntityId: organizationId,
    },
  });
}
