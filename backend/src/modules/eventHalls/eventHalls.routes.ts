import { Router } from 'express';
import { getEventHallsByOrg, createEventHall, updateEventHall, deleteEventHall, bookEventHall, getMyEventHallBookings, getEventHallBookingsByOrg, updateEventHallBookingStatus } from './eventHalls.controller';
import { requireAuth } from '@/middlewares/auth';

const router = Router();

// Public route to get event halls for an org
router.get('/orgs/:orgId', getEventHallsByOrg);

// Admin routes for event halls
router.post('/orgs/:orgId', requireAuth, createEventHall);
router.get('/orgs/:orgId/bookings', requireAuth, getEventHallBookingsByOrg);
router.put('/bookings/:bookingId/status', requireAuth, updateEventHallBookingStatus);
router.put('/:id', requireAuth, updateEventHall);
router.delete('/:id', requireAuth, deleteEventHall);

// Member route for booking
router.post('/book', requireAuth, bookEventHall);
router.get('/my-bookings', requireAuth, getMyEventHallBookings);

export default router;
