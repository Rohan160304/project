import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { z } from 'zod';
import { validate } from '@/middlewares/validate';
import * as pathshalaController from './pathshala.controller';

export const pathshalaRoutes = Router();

const pathshalaBookingSchema = z.object({
  body: z.object({
    date: z.coerce.date(),
    numberOfPersons: z.number().min(1)
  })
});

pathshalaRoutes.post(
  '/:organizationId/bookings',
  requireAuth,
  validate(pathshalaBookingSchema),
  asyncHandler(pathshalaController.createBooking)
);

pathshalaRoutes.get(
  '/bookings/my',
  requireAuth,
  asyncHandler(pathshalaController.getMyBookings)
);
