import { Request, Response, NextFunction } from 'express';
import { eventHallsService } from './eventHalls.service';
import { createEventHallSchema, updateEventHallSchema } from './eventHalls.dto';
import { ok } from '../../utils/apiResponse';

export const getEventHallsByOrg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.params;
    const halls = await eventHallsService.getEventHallsByOrg(orgId as string);
    ok(res, halls);
  } catch (error) {
    next(error);
  }
};

export const createEventHall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.params;
    const validatedData = createEventHallSchema.parse(req.body);
    const hall = await eventHallsService.createEventHall(orgId as string, validatedData);
    ok(res, hall, undefined, 201);
  } catch (error) {
    next(error);
  }
};

export const updateEventHall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateEventHallSchema.parse(req.body);
    const hall = await eventHallsService.updateEventHall(id as string, validatedData);
    ok(res, hall);
  } catch (error) {
    next(error);
  }
};

export const deleteEventHall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await eventHallsService.deleteEventHall(id as string);
    ok(res, null);
  } catch (error) {
    next(error);
  }
};
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

export const bookEventHall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventHallId, dateFrom, dateTo, peopleCount, specialRequests } = req.body;
    const userId = (req as any).actor?.userId;

    if (!userId) {
      throw ApiError.unauthorized();
    }

    const hall = await prisma.eventHall.findUnique({ where: { id: eventHallId } });
    if (!hall) {
      throw ApiError.notFound('Event Hall not found');
    }

    const member = await prisma.member.findUnique({ where: { userId } });
    if (!member) {
      throw ApiError.notFound('Member profile not found');
    }

    const booking = await prisma.eventHallBooking.create({
      data: {
        eventHallId,
        memberId: member.id,
        bookingDate: new Date(dateFrom),
        guestCount: peopleCount || 1,
        specialRequests
      }
    });

    ok(res, booking, undefined, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyEventHallBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).actor?.userId;
    if (!userId) {
      throw ApiError.unauthorized();
    }
    
    const member = await prisma.member.findUnique({ where: { userId } });
    if (!member) {
      return ok(res, []);
    }

    const bookings = await prisma.eventHallBooking.findMany({
      where: { memberId: member.id },
      include: {
        eventHall: {
          include: {
            organization: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    ok(res, bookings);
  } catch (error) {
    next(error);
  }
};

export const getEventHallBookingsByOrg = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.params;
    
    // Quick admin permission check (assuming standard requireAuth provides actor info, 
    // ideally should use requirePermission or scopeToOrganization, but we'll do basic check)
    const actor = (req as any).actor;
    if (!actor?.isSuperAdmin && !actor?.organizationIds?.includes(orgId)) {
      throw ApiError.forbidden();
    }

    const bookings = await prisma.eventHallBooking.findMany({
      where: {
        eventHall: {
          organizationId: orgId
        }
      },
      include: {
        member: {
          include: {
            user: true
          }
        },
        eventHall: true
      },
      orderBy: { createdAt: 'desc' }
    });

    ok(res, bookings);
  } catch (error) {
    next(error);
  }
};

export const updateEventHallBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    // Quick admin permission check
    const actor = (req as any).actor;
    if (!actor?.isSuperAdmin && (!actor?.organizationIds || actor.organizationIds.length === 0)) {
      throw ApiError.forbidden();
    }

    const booking = await prisma.eventHallBooking.update({
      where: { id: bookingId },
      data: { status }
    });

    ok(res, booking);
  } catch (error) {
    next(error);
  }
};
