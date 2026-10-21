import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

export class EventHallsService {
  async getEventHallsByOrg(orgId: string) {
    return prisma.eventHall.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createEventHall(orgId: string, data: any) {
    return prisma.eventHall.create({
      data: {
        ...data,
        organizationId: orgId
      }
    });
  }

  async updateEventHall(id: string, data: any) {
    const existing = await prisma.eventHall.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Event Hall not found');
    return prisma.eventHall.update({
      where: { id },
      data
    });
  }

  async deleteEventHall(id: string) {
    const existing = await prisma.eventHall.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Event Hall not found');
    return prisma.eventHall.delete({ where: { id } });
  }
}

export const eventHallsService = new EventHallsService();
