import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';

/**
 * Dharamshala multi-building structure (§5.6):
 * Dharamshala -> Buildings (named) -> Wings/Floors -> Rooms & Halls.
 * The org profile itself reuses the shared organization service (temples module).
 */

export async function createBuilding(organizationId: string, name: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org || org.type !== 'DHARAMSHALA') throw ApiError.notFound('Dharamshala not found');
  return prisma.building.create({ data: { organizationId, name } });
}

export async function createWing(buildingId: string, name: string, floor?: string) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building || building.deletedAt) throw ApiError.notFound('Building not found');
  return prisma.wing.create({ data: { buildingId, name, floor } });
}

export async function createRoom(wingId: string, input: {
  name: string;
  type: 'ROOM' | 'HALL' | 'DORMITORY';
  category?: string;
  capacity: number;
  pricePerUnit?: number;
  currency?: string;
  roomNumber?: string;
  viewType?: string;
  bathroomType?: string;
  bedType?: string;
  extraMattressCount?: number;
  extraMattressCharge?: number;
  amenities?: string[];
  images?: string[];
  status?: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
}) {
  const wing = await prisma.wing.findUnique({ where: { id: wingId } });
  if (!wing || wing.deletedAt) throw ApiError.notFound('Wing not found');
  
  // If user inputs "101, 102, 103" we split it to create multiple physical room records.
  const roomNumbers = input.roomNumber 
    ? input.roomNumber.split(',').map(n => n.trim()).filter(Boolean) 
    : [''];

  const createdRooms = await Promise.all(roomNumbers.map(rn => {
    return prisma.roomOrHall.create({
      data: {
        wingId,
        name: input.name,
        type: input.type,
        category: input.category,
        capacity: input.capacity,
        pricePerUnit: input.pricePerUnit ?? 0,
        currency: input.currency ?? 'INR',
        roomNumber: rn || null,
        roomCount: 1, // hardcode to 1 as it's a physical room now
        viewType: input.viewType,
        bathroomType: input.bathroomType,
        bedType: input.bedType,
        extraMattressCount: input.extraMattressCount,
        extraMattressCharge: input.extraMattressCharge,
        amenities: input.amenities as Prisma.InputJsonValue,
        images: input.images as Prisma.InputJsonValue,
        status: input.status ?? 'AVAILABLE',
      },
    });
  }));
  
  return createdRooms[0];
}

export async function updateRoom(
  roomId: string,
  input: Partial<{
    name: string;
    type: any;
    capacity: number;
    pricePerUnit: number;
    currency: string;
    roomNumber: string;
    viewType: string;
    bathroomType: string;
    bedType: string;
    extraMattressCount: number;
    extraMattressCharge: number;
    amenities: string[];
    images: string[];
    status: any;
  }>
) {
  return prisma.roomOrHall.update({
    where: { id: roomId },
    data: {
      ...input,
      amenities: input.amenities as Prisma.InputJsonValue,
      images: input.images as Prisma.InputJsonValue,
    },
  });
}

/** Members browse dharamshala -> building -> room availability (§5.6). */
export async function getStructure(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      buildings: {
        where: { deletedAt: null },
        include: {
          wings: {
            where: { deletedAt: null },
            include: { rooms: { where: { deletedAt: null } } },
          },
        },
      },
    },
  });
  if (!org || org.type !== 'DHARAMSHALA') throw ApiError.notFound('Dharamshala not found');
  return org;
}

export async function softDeleteBuilding(buildingId: string, _deletedById: string) {
  return prisma.building.update({ where: { id: buildingId }, data: { deletedAt: new Date() } });
}
