import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { nextPublicId } from '@/engines/idGenerator/id.service';
import { getQueue, QUEUE_NAMES } from '@/jobs/queues';
import { enqueueNotification } from '@/engines/notification/notification.service';
import { generateReceiptPdf } from '@/engines/export/receipt.service';
import { storage } from '@/utils/storage';
import { addHours } from '@/utils/dateUtils';

// -----------------------------------------------------------------------------
// Booking items (org admin configuration)
// -----------------------------------------------------------------------------

export async function createBookingItem(input: Record<string, unknown> & { organizationId: string; createdById: string }) {
  const { createdById, images, availabilityConfig, bankDetails, ...rest } = input as any;
  return prisma.bookingItem.create({
    data: {
      ...rest,
      images: images as Prisma.InputJsonValue,
      availabilityConfig: availabilityConfig as Prisma.InputJsonValue,
      bankDetails: bankDetails as Prisma.InputJsonValue,
      createdById,
      updatedById: createdById,
    },
  });
}

export async function listBookingItems(organizationId: string) {
  return prisma.bookingItem.findMany({
    where: { organizationId, deletedAt: null },
    include: { category: true },
    orderBy: { name: 'asc' },
  });
}

export async function listPublicBookingItems(organizationId: string) {
  // Fetch active booking items for the organization
  const bookingItems = await prisma.bookingItem.findMany({
    where: { organizationId, status: 'ACTIVE', deletedAt: null },
    include: { category: true },
    orderBy: { name: 'asc' },
  });

  // Fetch all rooms for this org to calculate availability and extract amenities
  const allRooms = await prisma.roomOrHall.findMany({
    where: { wing: { building: { organizationId } }, deletedAt: null },
  });

  return bookingItems.map((item) => {
    const matchingRooms = allRooms.filter(r => r.name === item.name);
    const availableRoomsCount = matchingRooms.filter(r => r.status === 'AVAILABLE').length;
    // Extract unique amenities from matching rooms
    const amenitiesSet = new Set<string>();
    for (const r of matchingRooms) {
      if (Array.isArray(r.amenities)) {
        for (const a of r.amenities) amenitiesSet.add(String(a));
      }
    }
    const amenities = Array.from(amenitiesSet);

    // Check attached bathroom
    const attachedBathroom = matchingRooms.some(r => r.attachedBathroom?.toLowerCase() === 'yes' || r.attachedBathroom?.toLowerCase() === 'true');

    return {
      ...item,
      availableRoomsCount,
      totalRoomsCount: matchingRooms.length,
      amenities,
      attachedBathroom
    };
  });
}

export async function updateBookingItem(bookingItemId: string, input: Record<string, unknown>, updatedById: string) {
  const { images, availabilityConfig, bankDetails, ...rest } = input as any;
  return prisma.bookingItem.update({
    where: { id: bookingItemId },
    data: {
      ...rest,
      images: images as Prisma.InputJsonValue,
      availabilityConfig: availabilityConfig as Prisma.InputJsonValue,
      bankDetails: bankDetails as Prisma.InputJsonValue,
      updatedById,
    },
  });
}

export async function addBlackoutDate(bookingItemId: string, date: Date, reason?: string) {
  return prisma.bookingBlackoutDate.create({ data: { bookingItemId, date, reason } });
}

/** Admin internal reservations instantly block slots; members see only "Unavailable" (§5.7). */
export async function addInternalReservation(bookingItemId: string, input: { date: Date; slot?: string; reason: string }, createdById: string) {
  return prisma.bookingInternalReservation.create({ data: { bookingItemId, ...input, createdById } });
}

export async function removeInternalReservation(reservationId: string) {
  return prisma.bookingInternalReservation.delete({ where: { id: reservationId } });
}

// -----------------------------------------------------------------------------
// Availability calendar (§5.7)
// -----------------------------------------------------------------------------

type DayAvailability = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'UNAVAILABLE' | 'MAINTENANCE';

export async function getAvailabilityCalendar(bookingItemId: string, from: Date, to: Date, options: { isAdmin: boolean }) {
  const item = await prisma.bookingItem.findUnique({ where: { id: bookingItemId } });
  if (!item || item.deletedAt) throw ApiError.notFound('Booking item not found');

  const [blackouts, internalReservations, bookings, physicalRoomsCount] = await Promise.all([
    prisma.bookingBlackoutDate.findMany({ where: { bookingItemId, date: { gte: from, lte: to } } }),
    prisma.bookingInternalReservation.findMany({ where: { bookingItemId, date: { gte: from, lte: to } } }),
    prisma.booking.findMany({
      where: {
        bookingItemId,
        deletedAt: null,
        status: { in: ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PENDING', 'PAYMENT_VERIFICATION', 'CONFIRMED', 'CHECKED_IN'] },
        dateFrom: { lte: to },
        OR: [{ dateTo: { gte: from } }, { dateTo: null, dateFrom: { gte: from } }],
      },
    }),
    prisma.roomOrHall.count({
      where: { wing: { building: { organizationId: item.organizationId } }, name: item.name, status: 'AVAILABLE', deletedAt: null }
    })
  ]);

  const maxCapacity = physicalRoomsCount > 0 ? physicalRoomsCount : (item.capacityMaxBookings || 999);

  const days: { date: string; status: DayAvailability; availableCount: number; internalDetails?: string }[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const dayKey = cursor.toISOString().slice(0, 10);
    const isBlackout = blackouts.some((b) => b.date.toISOString().slice(0, 10) === dayKey);
    const internal = internalReservations.find((r) => r.date.toISOString().slice(0, 10) === dayKey);

    // Sum up the quantity of rooms booked for this day
    const dayBookingsCount = bookings.filter((b) => {
      const bookFrom = b.dateFrom.toISOString().slice(0, 10);
      const bookTo = (b.dateTo ?? b.dateFrom).toISOString().slice(0, 10);
      return dayKey >= bookFrom && dayKey <= bookTo;
    }).reduce((sum, b) => sum + (b.quantity || 1), 0);

    const availableCount = Math.max(0, maxCapacity - dayBookingsCount);

    let status: DayAvailability = 'AVAILABLE';
    if (isBlackout) status = 'MAINTENANCE';
    else if (internal) status = options.isAdmin ? 'RESERVED' : 'UNAVAILABLE';
    else if (availableCount <= 0) status = 'BOOKED';

    days.push({
      date: dayKey,
      status,
      availableCount,
      ...(options.isAdmin && internal ? { internalDetails: internal.reason } : {}),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return { item: { id: item.id, name: item.name, type: item.type }, days };
}

// -----------------------------------------------------------------------------
// Member booking flow (§5.7)
// -----------------------------------------------------------------------------

async function pushStatus(bookingId: string, status: BookingStatus, changedById?: string, note?: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  await tx.bookingStatusHistory.create({ data: { bookingId, status, changedById, note } });

  // Non-blocking dashboard stats update broadcast
  tx.booking.findUnique({ where: { id: bookingId }, select: { organizationId: true } })
    .then((booking) => {
      if (booking) {
        const { broadcastDashboardUpdate } = require('../dashboard/dashboard.service');
        broadcastDashboardUpdate(booking.organizationId);
      }
    })
    .catch(() => { });
}

export async function submitBooking(memberId: string, input: { organizationId?: string; bookingItemId: string; dateFrom: Date; dateTo?: Date; slot?: string; peopleCount: number; quantity?: number }) {
  let item = await prisma.bookingItem.findUnique({ where: { id: input.bookingItemId } });
  
  if (!item && input.organizationId) {
    item = await prisma.bookingItem.findFirst({
      where: { organizationId: input.organizationId, name: input.bookingItemId, deletedAt: null }
    });
    
    if (!item) {
      let category = await prisma.bookingCategory.findFirst();
      if (!category) {
        category = await prisma.bookingCategory.create({ data: { name: 'Rooms' } });
      }
      
      // Attempt to find actual price from physical rooms
      const room = await prisma.roomOrHall.findFirst({
        where: { name: input.bookingItemId, wing: { building: { organizationId: input.organizationId } }, deletedAt: null },
      });
      const chargeAmount = room?.pricePerUnit ? Number(room.pricePerUnit) : 0;
      
      item = await prisma.bookingItem.create({
        data: {
          organizationId: input.organizationId,
          name: input.bookingItemId,
          categoryId: category.id,
          type: chargeAmount > 0 ? 'PAID' : 'FREE',
          chargeAmount,
          status: 'ACTIVE',
          durationType: 'MULTI_DAY'
        }
      });
    }
  }

  if (!item || item.deletedAt || item.status !== 'ACTIVE') throw ApiError.notFound('Booking item not available');

  if (item.capacityMaxPeople && input.peopleCount > item.capacityMaxPeople) {
    throw ApiError.validation({ peopleCount: [`Maximum ${item.capacityMaxPeople} people allowed`] });
  }

  // Slot conflict check: blackouts + internal reservations + capacity
  const calendar = await getAvailabilityCalendar(item.id, input.dateFrom, input.dateTo ?? input.dateFrom, { isAdmin: false });
  const unavailable = calendar.days.find((d) => d.status !== 'AVAILABLE');
  if (unavailable) throw ApiError.conflict(`Selected date ${unavailable.date} is not available (${unavailable.status})`);

  const qty = input.quantity || 1;

  // Check physical available rooms count if it's tied to RoomOrHall
  const availableRooms = await prisma.roomOrHall.count({
    where: { wing: { building: { organizationId: item.organizationId } }, name: item.name, status: 'AVAILABLE', deletedAt: null },
  });
  // Fallback to item.capacityMaxBookings if no matching physical rooms found (maybe it's a generic item)
  if (availableRooms > 0 && qty > availableRooms) {
    throw ApiError.validation({ quantity: [`Only ${availableRooms} rooms available`] });
  } else if (item.capacityMaxBookings && qty > item.capacityMaxBookings) {
    throw ApiError.validation({ quantity: [`Only ${item.capacityMaxBookings} bookings available`] });
  }
  const baseAmount = item.type === 'PAID' ? Number(item.chargeAmount) : 0;

  let days = 1;
  if (input.dateTo) {
    const fromDate = new Date(input.dateFrom);
    const toDate = new Date(input.dateTo);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      days = diffDays;
    }
  }

  const totalAmount = baseAmount * qty * days;

  const booking = await prisma.$transaction(async (tx) => {
    const publicId = await nextPublicId('BOOKING', tx);
    const created = await tx.booking.create({
      data: {
        publicId,
        bookingItemId: item.id,
        organizationId: item.organizationId,
        memberId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        slot: input.slot,
        peopleCount: input.peopleCount,
        quantity: qty,
        amount: totalAmount,
        currency: item.currency,
        status: 'PENDING_APPROVAL',
      },
    });
    await pushStatus(created.id, 'SUBMITTED', memberId, undefined, tx);
    await pushStatus(created.id, 'PENDING_APPROVAL', memberId, undefined, tx);
    return created;
  });

  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });
  await enqueueNotification({
    userId: member.userId,
    templateKey: 'BOOKING_SUBMITTED',
    category: 'SERVICE',
    to: { PUSH: member.userId, IN_APP: member.userId },
    body: `Your booking ${booking.publicId} for ${item.name} has been submitted and is pending approval.`,
  });

  return booking;
}

export async function decideBooking(bookingId: string, decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO', actorUserId: string, reason?: string, allocatedRoomId?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { bookingItem: true, member: true } });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'PENDING_APPROVAL') throw ApiError.conflict(`Cannot decide a booking in status ${booking.status}`);

  if (decision === 'REJECT') {
    const updated = await prisma.booking.update({ where: { id: bookingId }, data: { status: 'REJECTED', rejectionReason: reason, updatedById: actorUserId } });
    await pushStatus(bookingId, 'REJECTED', actorUserId, reason);
    await enqueueNotification({
      userId: booking.member.userId,
      templateKey: 'BOOKING_REJECTED',
      category: 'SERVICE',
      to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
      body: `Your booking ${booking.publicId} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
    });
    return updated;
  }

  if (decision === 'REQUEST_INFO') {
    await pushStatus(bookingId, 'PENDING_APPROVAL', actorUserId, `INFO_REQUESTED: ${reason ?? ''}`);
    await enqueueNotification({
      userId: booking.member.userId,
      templateKey: 'BOOKING_INFO_REQUESTED',
      category: 'SERVICE',
      to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
      body: `More information is needed for booking ${booking.publicId}: ${reason ?? 'Please contact the organization.'}`,
    });
    return booking;
  }

  // APPROVE
  if (booking.bookingItem.type === 'PAID') {
    const expiresAt = addHours(new Date(), booking.bookingItem.paymentWindowHours);
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PAYMENT_PENDING', paymentWindowExpiresAt: expiresAt, updatedById: actorUserId, allocatedRoomId },
    });
    await pushStatus(bookingId, 'APPROVED', actorUserId);
    await pushStatus(bookingId, 'PAYMENT_PENDING', actorUserId);

    // BullMQ delayed job for the payment-window countdown (§5.7)
    await getQueue(QUEUE_NAMES.BOOKING_PAYMENT_WINDOW).add(
      'expire',
      { bookingId },
      { delay: booking.bookingItem.paymentWindowHours * 60 * 60 * 1000, jobId: `booking-expiry-${bookingId}` },
    );

    await enqueueNotification({
      userId: booking.member.userId,
      templateKey: 'BOOKING_PAYMENT_WINDOW_STARTED',
      category: 'SERVICE',
      to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
      body: `Your booking ${booking.publicId} is approved. Complete payment within ${booking.bookingItem.paymentWindowHours} hours to confirm.`,
    });
    return updated;
  }

  const updated = await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED', updatedById: actorUserId, allocatedRoomId } });
  await pushStatus(bookingId, 'APPROVED', actorUserId);
  await pushStatus(bookingId, 'CONFIRMED', actorUserId);
  await issueBookingReceipt(bookingId);
  await enqueueNotification({
    userId: booking.member.userId,
    templateKey: 'BOOKING_CONFIRMED',
    category: 'SERVICE',
    to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
    body: `Your booking ${booking.publicId} is confirmed.`,
  });
  return updated;
}

/** Member uploads offline-payment proof; idempotency key prevents double submission (§7). */
export async function submitPaymentProof(bookingId: string, memberId: string, input: { paymentReference: string; paymentProofUrl: string; paymentNotes?: string; idempotencyKey: string }) {
  const existing = await prisma.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing; // idempotent replay

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { member: true } });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.memberId !== memberId) throw ApiError.forbidden('Not your booking');
  if (booking.status !== 'PAYMENT_PENDING') throw ApiError.conflict(`Cannot submit payment for a booking in status ${booking.status}`);
  if (booking.paymentWindowExpiresAt && booking.paymentWindowExpiresAt < new Date()) {
    throw new ApiError('PAYMENT_WINDOW_EXPIRED', 'The payment window for this booking has expired');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'PAYMENT_VERIFICATION',
      paymentReference: input.paymentReference,
      paymentProofUrl: input.paymentProofUrl,
      paymentNotes: input.paymentNotes,
      idempotencyKey: input.idempotencyKey,
    },
  });
  await pushStatus(bookingId, 'PAYMENT_VERIFICATION', memberId);
  return updated;
}

export async function verifyPayment(bookingId: string, decision: 'APPROVE' | 'REJECT', actorUserId: string, reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { member: true } });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'PAYMENT_VERIFICATION') throw ApiError.conflict(`Cannot verify payment for a booking in status ${booking.status}`);

  if (decision === 'REJECT') {
    // Re-upload flow: back to PAYMENT_PENDING while the window is still open
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PAYMENT_PENDING', rejectionReason: reason, idempotencyKey: null },
    });
    await pushStatus(bookingId, 'PAYMENT_PENDING', actorUserId, `PAYMENT_REJECTED: ${reason ?? ''}`);
    await enqueueNotification({
      userId: booking.member.userId,
      templateKey: 'BOOKING_PAYMENT_REJECTED',
      category: 'SERVICE',
      to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
      body: `Payment proof for booking ${booking.publicId} was rejected. Please re-upload before the window expires.${reason ? ` Reason: ${reason}` : ''}`,
    });
    return updated;
  }

  const updated = await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED', updatedById: actorUserId } });
  await pushStatus(bookingId, 'CONFIRMED', actorUserId);

  // Auto-occupy the assigned room if any
  if (booking.allocatedRoomId) {
    const roomIds = booking.allocatedRoomId.split(',').filter(Boolean);
    if (roomIds.length > 0) {
      await prisma.roomOrHall.updateMany({
        where: { id: { in: roomIds } },
        data: { status: 'OCCUPIED' }
      });
    }
  }

  // Cancel the pending expiry job — payment completed in time
  const job = await getQueue(QUEUE_NAMES.BOOKING_PAYMENT_WINDOW).getJob(`booking-expiry-${bookingId}`);
  if (job) await job.remove().catch(() => undefined);

  await issueBookingReceipt(bookingId);
  await enqueueNotification({
    userId: booking.member.userId,
    templateKey: 'BOOKING_CONFIRMED',
    category: 'SERVICE',
    to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
    body: `Payment verified — your booking ${booking.publicId} is confirmed. Receipt available in My Bookings.`,
  });
  return updated;
}

/** Fired by the BullMQ delayed job when the payment window lapses (§5.7): auto-cancel, release slot, notify. */
export async function expireBookingPaymentWindow(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { member: true } });
  if (!booking) return;
  if (!['PAYMENT_PENDING', 'PAYMENT_VERIFICATION'].includes(booking.status)) return; // already resolved

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'EXPIRED' } });
  await pushStatus(bookingId, 'EXPIRED', undefined, 'Payment window timed out');

  await enqueueNotification({
    userId: booking.member.userId,
    templateKey: 'BOOKING_AUTO_CANCELLED',
    category: 'SERVICE',
    to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
    body: `Booking ${booking.publicId} was auto-cancelled because payment was not completed within the payment window. The slot has been released.`,
  });
}

// -----------------------------------------------------------------------------
// Receipts (§5.7)
// -----------------------------------------------------------------------------

async function issueBookingReceipt(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { member: true, organization: true, bookingItem: true },
  });

  const receiptPublicId = await prisma.$transaction((tx) => nextPublicId('RECEIPT', tx));

  const pdf = await generateReceiptPdf({
    receiptNumber: receiptPublicId,
    type: 'BOOKING',
    organizationName: booking.organization.name,
    trustRegistrationNumber: booking.organization.trustRegistrationNumber ?? undefined,
    is80gEligible: booking.organization.is80gEligible,
    memberName: booking.member.fullName,
    memberPublicId: booking.member.publicId,
    amount: booking.amount.toString(),
    currency: booking.currency,
    issuedAt: new Date(),
    lineItems: [
      { label: 'Booking ID', value: booking.publicId },
      { label: 'Item', value: booking.bookingItem.name },
      { label: 'Date(s)', value: `${booking.dateFrom.toISOString().slice(0, 10)}${booking.dateTo ? ` to ${booking.dateTo.toISOString().slice(0, 10)}` : ''}` },
      ...(booking.paymentReference ? [{ label: 'Payment Reference', value: booking.paymentReference }] : []),
    ],
  });

  const stored = await storage.save(pdf, `${receiptPublicId}.pdf`, 'application/pdf', 'receipts');

  return prisma.receipt.create({
    data: {
      publicId: receiptPublicId,
      type: 'BOOKING',
      organizationId: booking.organizationId,
      memberId: booking.memberId,
      bookingId: booking.id,
      amount: booking.amount,
      currency: booking.currency,
      pdfUrl: stored.url,
    },
  });
}

// -----------------------------------------------------------------------------
// My Bookings (§5.7): unified across orgs/categories, past auto-scoped, never deleted
// -----------------------------------------------------------------------------

export async function listMyBookings(memberId: string, query: { scope: 'upcoming' | 'active' | 'past' | 'all'; month?: number; year?: number; categoryId?: string; organizationId?: string; page: number; pageSize: number }) {
  const where: Prisma.BookingWhereInput = {
    memberId,
    deletedAt: null,
    organizationId: query.organizationId,
    bookingItem: query.categoryId ? { categoryId: query.categoryId } : undefined,
  };

  const passesWhere: Prisma.BhojanshalaPassWhereInput = {
    memberId,
    organizationId: query.organizationId,
  };

  if (query.scope === 'upcoming') {
    where.status = { notIn: ['CHECKED_IN', 'CHECKED_OUT', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'] };
    passesWhere.status = { notIn: ['SCANNED', 'CANCELLED', 'EXPIRED'] };
  } else if (query.scope === 'active') {
    where.status = { in: ['CHECKED_IN'] };
    passesWhere.status = { in: ['PENDING', 'BOOKED'] };
  } else if (query.scope === 'past') {
    where.status = { in: ['CHECKED_OUT', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'] };
    passesWhere.status = { in: ['SCANNED', 'CANCELLED', 'EXPIRED'] };
  }

  if (query.month && query.year) {
    where.dateFrom = { gte: new Date(query.year, query.month - 1, 1), lt: new Date(query.year, query.month, 1) };
    passesWhere.date = { gte: new Date(query.year, query.month - 1, 1), lt: new Date(query.year, query.month, 1) };
  } else if (query.year) {
    where.dateFrom = { gte: new Date(query.year, 0, 1), lt: new Date(query.year + 1, 0, 1) };
    passesWhere.date = { gte: new Date(query.year, 0, 1), lt: new Date(query.year + 1, 0, 1) };
  }

  const includePasses = !query.categoryId;

  const [bookings, passes] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        bookingItem: { select: { name: true, categoryId: true, type: true } },
        organization: { select: { name: true, publicId: true } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        receipt: { select: { publicId: true, pdfUrl: true } },
      },
      orderBy: { dateFrom: 'desc' },
    }),
    includePasses
      ? prisma.bhojanshalaPass.findMany({
          where: passesWhere,
          include: { organization: { select: { name: true, publicId: true } } },
          orderBy: { date: 'desc' },
        })
      : Promise.resolve([]),
  ]);

  const allItems = [
    ...bookings,
    ...passes.map((p) => ({
      ...p,
      isBhojanshala: true,
      dateFrom: p.date, // Alias for sorting
    })),
  ].sort((a, b) => (b.dateFrom?.getTime() || 0) - (a.dateFrom?.getTime() || 0));

  const total = allItems.length;
  const rows = allItems.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);

  return { total, rows };
}

export async function getBookingWithTimeline(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      bookingItem: true,
      organization: { select: { name: true, publicId: true } },
      member: { select: { fullName: true, publicId: true, userId: true } },
      statusHistory: { orderBy: { changedAt: 'asc' } },
      receipt: true,
    },
  });
  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
}

/** Org admin occupancy view (§5.7). */
export async function listOrgBookings(organizationId: string, query: { status?: BookingStatus; page: number; pageSize: number }) {
  const where: Prisma.BookingWhereInput = { organizationId, deletedAt: null, status: query.status };
  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: { bookingItem: { select: { name: true } }, member: { select: { fullName: true, publicId: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return { total, rows };
}

// -----------------------------------------------------------------------------
// Stay Operations (Front Desk Daily Operations — Pillar 3)
// -----------------------------------------------------------------------------

export async function checkInBooking(bookingId: string, input: {
  roomId?: string;
  vehicleNumber?: string;
  idProofType?: string;
  idProofNumber?: string;
  additionalGuests?: number;
  stayNotes?: string;
}, actorUserId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { member: true } });
  if (!booking) throw ApiError.notFound('Booking not found');

  const roomId = input.roomId || booking.allocatedRoomId;

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CHECKED_IN',
      checkInTime: new Date(),
      allocatedRoomId: roomId ?? undefined,
      vehicleNumber: input.vehicleNumber,
      idProofType: input.idProofType,
      idProofNumber: input.idProofNumber,
      additionalGuests: input.additionalGuests ?? 0,
      stayNotes: input.stayNotes,
      updatedById: actorUserId,
    },
  });

  if (roomId) {
    await prisma.roomOrHall.update({ where: { id: roomId }, data: { status: 'OCCUPIED' } }).catch(() => { });
  }

  await pushStatus(bookingId, 'CHECKED_IN', actorUserId, `Checked in at front desk`);

  await enqueueNotification({
    userId: booking.member.userId,
    templateKey: 'STAY_CHECKED_IN',
    category: 'SERVICE',
    to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
    body: `Check-in complete for ${booking.publicId}. Welcome to your stay!`,
  });

  return updated;
}

export async function checkOutBooking(bookingId: string, input: {
  additionalCharges?: number;
  splitPayments?: { mode: string; amount: number }[];
  notes?: string;
}, actorUserId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { member: true } });
  if (!booking) throw ApiError.notFound('Booking not found');

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CHECKED_OUT',
      checkOutTime: new Date(),
      additionalCharges: input.additionalCharges ?? 0,
      splitPayments: (input.splitPayments ?? []) as Prisma.InputJsonValue,
      updatedById: actorUserId,
    },
  });

  if (booking.allocatedRoomId) {
    const ids = booking.allocatedRoomId.split(',').map(id => id.trim()).filter(Boolean);
    if (ids.length > 0) {
      await prisma.roomOrHall.updateMany({ where: { id: { in: ids } }, data: { status: 'DIRTY' } }).catch(() => { });
    }
  }

  await pushStatus(bookingId, 'CHECKED_OUT', actorUserId, `Checked out at front desk`);

  await enqueueNotification({
    userId: booking.member.userId,
    templateKey: 'STAY_CHECKED_OUT',
    category: 'SERVICE',
    to: { PUSH: booking.member.userId, IN_APP: booking.member.userId },
    body: `Check-out complete for ${booking.publicId}. Thank you for staying with us! Your final receipt is available.`,
  });

  return updated;
}

export async function transferRoom(bookingId: string, newRoomId: string, reason: string, actorUserId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw ApiError.notFound('Booking not found');

  const oldRoomId = booking.allocatedRoomId;

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      allocatedRoomId: newRoomId,
      transferredFromRoomId: oldRoomId ?? undefined,
      updatedById: actorUserId,
    },
  });

  if (oldRoomId) {
    await prisma.roomOrHall.update({ where: { id: oldRoomId }, data: { status: 'DIRTY' } }).catch(() => { });
  }
  await prisma.roomOrHall.update({ where: { id: newRoomId }, data: { status: 'OCCUPIED' } }).catch(() => { });

  await pushStatus(bookingId, 'CHECKED_IN', actorUserId, `Room transferred from ${oldRoomId || 'N/A'} to ${newRoomId}. Reason: ${reason}`);
  return updated;
}

export async function extendStay(bookingId: string, additionalDays: number, actorUserId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { bookingItem: true } });
  if (!booking) throw ApiError.notFound('Booking not found');

  const currentEndDate = booking.dateTo ? new Date(booking.dateTo) : new Date(booking.dateFrom);
  const newEndDate = new Date(currentEndDate.getTime() + additionalDays * 24 * 3600_000);

  const extraAmount = Number(booking.bookingItem.chargeAmount || 0) * additionalDays;
  const newTotalAmount = Number(booking.amount) + extraAmount;

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      dateTo: newEndDate,
      amount: newTotalAmount,
      updatedById: actorUserId,
    },
  });

  await pushStatus(bookingId, booking.status, actorUserId, `Stay extended by ${additionalDays} days. New total amount: INR ${newTotalAmount}`);
  return updated;
}

export async function updateHousekeepingStatus(roomId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'UNDER_CLEANING' | 'READY' | 'MAINTENANCE') {
  return prisma.roomOrHall.update({ where: { id: roomId }, data: { status } });
}

export async function listOrgRooms(organizationId: string, category?: string, status?: any) {
  return await prisma.roomOrHall.findMany({
    where: {
      wing: { building: { organizationId } },
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      deletedAt: null
    },
    orderBy: { name: 'asc' },
    include: { wing: true }
  });
}

export async function updateRoomStatus(organizationId: string, roomId: string, status: any) {
  return await prisma.roomOrHall.update({
    where: { id: roomId },
    data: { status }
  });
}
