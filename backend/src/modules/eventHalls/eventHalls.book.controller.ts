import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';

export const bookEventHall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventHallId } = req.body;
    const { dateFrom, dateTo, peopleCount, specialRequests } = req.body;
    const memberId = req.actor?.userId;

    if (!memberId) {
      throw ApiError.unauthorized();
    }

    const hall = await prisma.eventHall.findUnique({ where: { id: eventHallId } });
    if (!hall) {
      throw ApiError.notFound('Event Hall not found');
    }

    const booking = await prisma.eventHallBooking.create({
      data: {
        eventHallId,
        memberId,
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
