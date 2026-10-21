import { Request, Response } from 'express';
import { prisma } from '@/config/prisma';
import { nextPublicId } from '@/engines/idGenerator/id.service';

export const createBooking = async (req: Request, res: Response) => {
  const organizationId = req.params.organizationId as string;
  const { fromDate, toDate, numberOfRooms, numberOfPersons } = req.body;
  const userId = req.actor?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const member = await prisma.member.findUnique({ where: { userId } });
  if (!member) {
    return res.status(400).json({ error: 'Member not found' });
  }
  const memberId = member.id;

  const publicId = await prisma.$transaction((tx) => nextPublicId('DHARAMSHALA_BOOKING', tx));

  const booking = await prisma.dharamshalaBooking.create({
    data: {
      publicId,
      organizationId,
      memberId,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      numberOfRooms,
      numberOfPersons,
      status: 'PENDING'
    }
  });

  res.status(201).json({ success: true, booking });
};

export const getMyBookings = async (req: Request, res: Response) => {
  const userId = req.actor?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const member = await prisma.member.findUnique({ where: { userId } });
  if (!member) return res.status(400).json({ error: 'Member not found' });
  
  const memberId = member.id;

  const bookings = await prisma.dharamshalaBooking.findMany({
    where: { memberId },
    include: {
      organization: { select: { id: true, name: true, city: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, bookings });
};
