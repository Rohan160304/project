import { prisma } from '@/config/prisma';
import { getIO } from '@/sockets';
import { logger } from '@/config/logger';

export async function getDashboardStats(organizationId: string) {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [totalMonks, activeJourneys, todaysArrivals, donationAgg, todaysVisitors, activeVolunteers, occupiedRooms, allRooms, bhojanshalaPassesAgg] = await Promise.all([
    // Total monks currently located at the organization
    prisma.monkProfile.count({ where: { currentTempleId: organizationId, deletedAt: null } }),
    // Active monk journeys in progress (global)
    prisma.journey.count({ where: { status: 'IN_PROGRESS' } }),
    // Monk arrivals at this organization today
    prisma.journeyEvent.count({ where: { type: 'ARRIVAL', templeId: organizationId, timestamp: { gte: dayStart } } }),
    // Donations aggregated
    prisma.donation.aggregate({ where: { organizationId, status: 'VERIFIED' }, _sum: { totalAmount: true }, _count: true }),
    // Actual checked-in visitors count today
    prisma.visitorEntry.aggregate({ where: { organizationId, checkInAt: { gte: dayStart } }, _sum: { numberOfVisitors: true } }),
    // Registered active volunteers
    prisma.organizationVolunteer.count({ where: { organizationId } }),
    // Active occupied rooms today
    prisma.booking.count({
      where: {
        organizationId,
        status: { in: ['CONFIRMED', 'APPROVED'] },
        dateFrom: { lte: new Date() },
        OR: [
          { dateTo: null },
          { dateTo: { gte: new Date() } }
        ]
      }
    }),
    // Fetch all active rooms for organization building wing hierarchy
    prisma.roomOrHall.findMany({
      where: { wing: { building: { organizationId } }, deletedAt: null },
      select: { status: true, wing: { select: { floor: true } } }
    }),
    // Fetch bhojanshala passes for today grouped by meal type
    prisma.bhojanshalaPass.groupBy({
      by: ['mealType'],
      where: {
        organizationId,
        date: { gte: dayStart },
        status: { not: 'CANCELLED' }
      },
      _sum: {
        numberOfPersons: true
      }
    })
  ]);

  const visitorSum = todaysVisitors._sum.numberOfVisitors ?? 0;

  // Process bhojanshala passes
  let navkarsiCount = 0;
  let lunchCount = 0;
  let choviyarCount = 0;
  let passesIssued = 0;

  for (const agg of bhojanshalaPassesAgg) {
    const count = agg._sum.numberOfPersons ?? 0;
    passesIssued += count;
    if (agg.mealType === 'BREAKFAST') navkarsiCount += count;
    else if (agg.mealType === 'LUNCH') lunchCount += count;
    else if (agg.mealType === 'CHOUVIHAR' || agg.mealType === 'DINNER') choviyarCount += count;
  }

  // Compute room details dynamically
  let availableRooms = 0;
  let occupiedRoomsCount = 0;
  let cleaningRooms = 0;
  const floorsMap = new Map<string, { occupied: number; total: number; cleaning: number }>();

  for (const r of allRooms) {
    if (r.status === 'AVAILABLE') availableRooms++;
    else if (r.status === 'UNAVAILABLE') occupiedRoomsCount++;
    else if (r.status === 'MAINTENANCE') cleaningRooms++;

    const floorName = r.wing.floor || 'Ground Floor';
    if (!floorsMap.has(floorName)) {
      floorsMap.set(floorName, { occupied: 0, total: 0, cleaning: 0 });
    }
    const metrics = floorsMap.get(floorName)!;
    metrics.total += 1;
    if (r.status === 'UNAVAILABLE') metrics.occupied += 1;
    else if (r.status === 'MAINTENANCE') metrics.cleaning += 1;
  }

  const roomFloorsList = Array.from(floorsMap.entries()).map(([name, metrics]) => ({
    name,
    ...metrics
  }));

  return {
    todaysArrivals,
    todaysVisitors: visitorSum,
    activeVolunteers,
    occupiedRooms,
    bhojanshalaMeals: passesIssued,
    navkarsiCount,
    lunchCount,
    choviyarCount,
    passesIssued,
    totalDonations: donationAgg._sum.totalAmount ?? 0,
    donationCount: donationAgg._count,
    totalMonks,
    activeJourneys,
    roomStats: {
      available: availableRooms,
      occupied: occupiedRoomsCount,
      cleaning: cleaningRooms,
      total: allRooms.length,
      floors: roomFloorsList
    }
  };
}

export async function broadcastDashboardUpdate(organizationId: string) {
  try {
    const stats = await getDashboardStats(organizationId);
    const io = getIO();
    if (io) {
      io.of('/dashboards').to(`org:${organizationId}`).emit('stats:update', {
        organizationId,
        statCards: stats,
      });
      io.of('/dashboards').to('platform').emit('stats:update', {
        organizationId,
        statCards: stats,
      });
      logger.debug({ organizationId }, 'Broadcasted dashboard realtime stats update');
    }
  } catch (err) {
    logger.error({ err, organizationId }, 'Error broadcasting dashboard stats update');
  }
}
