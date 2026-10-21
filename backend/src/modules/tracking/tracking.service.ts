import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { getIO } from '@/sockets';
import { enqueueNotification } from '@/engines/notification/notification.service';
import { raiseAlert } from '@/modules/alerts/alerts.service';
import { createAutoFeedCard } from '@/modules/feed/feed.service';

const MOVING_THRESHOLD_MINUTES = 5;
const IDLE_THRESHOLD_MINUTES = 30;

// -----------------------------------------------------------------------------
// Location ingestion (GPS devices) — feeds the unified journey timeline (§5.10)
// -----------------------------------------------------------------------------

export async function ingestLocationPing(input: { deviceId: string; lat: number; lng: number; battery?: number; timestamp?: Date }) {
  const device = await prisma.device.findFirst({ where: { OR: [{ id: input.deviceId }, { publicId: input.deviceId }] } });
  if (!device) throw ApiError.notFound('Unknown device');

  const ping = await prisma.locationPing.create({
    data: {
      deviceId: device.id,
      lat: input.lat,
      lng: input.lng,
      battery: input.battery,
      timestamp: input.timestamp ?? new Date(),
    },
  });

  // Realtime marker update for live tracking maps
  try {
    const payload = { deviceId: device.publicId, monkId: device.monkId, lat: ping.lat, lng: ping.lng, battery: ping.battery, timestamp: ping.timestamp };
    const ns = getIO().of('/tracking');
    ns.emit('location:update', payload);
  } catch {
    // Socket server not running in this process
  }

  return ping;
}

// -----------------------------------------------------------------------------
// Routes (§5.10): A→B→C→D multi-stop builder
// -----------------------------------------------------------------------------

export async function createRoute(input: { name: string; monkId?: string; monkGroupId?: string; participantMonkIds?: string[]; contactPersonIds?: string[]; journeyDate: Date; stops: unknown[]; createdById: string }) {
  const stops = (input.stops as any[]).map((s, i) => ({ ...s, order: s.order ?? i, status: 'PENDING' }));
  const created = await prisma.route.create({
    data: {
      name: input.name,
      monkId: input.monkId || null,
      monkGroupId: input.monkGroupId || null,
      participantMonkIds: input.participantMonkIds ? (input.participantMonkIds as Prisma.InputJsonValue) : undefined,
      contactPersonIds: input.contactPersonIds ? (input.contactPersonIds as Prisma.InputJsonValue) : undefined,
      journeyDate: input.journeyDate,
      stops: stops as Prisma.InputJsonValue,
      createdById: input.createdById,
    },
  });

  // Notify organization admins if their organization is a stop
  const templeIds = stops.map((s) => s.templeId).filter(Boolean);
  if (templeIds.length > 0) {
    const admins = await prisma.userOrganization.findMany({
      where: { organizationId: { in: templeIds } },
      select: { userId: true, organizationId: true },
    });

    for (const admin of admins) {
      await enqueueNotification({
        userId: admin.userId,
        templateKey: 'ROUTE_CREATED_FOR_ORG',
        category: 'SERVICE',
        subject: `New Vihar Route: ${created.name}`,
        body: `A new Vihar Route "${created.name}" has been created which includes your organization as a stop. Please review the timeline to make necessary arrangements.`,
        to: { IN_APP: admin.userId, PUSH: admin.userId },
        data: {
          title: `New Vihar Route: ${created.name}`,
          message: `A new Vihar Route "${created.name}" has been created which includes your organization as a stop. Please review the timeline to make necessary arrangements.`,
          actionUrl: `/admin/routes?viewRouteId=${created.id}`,
          actionText: 'View Route',
          organizationId: admin.organizationId
        }
      });
    }
  }

  return created;
}

export async function updateRoute(routeId: string, input: Partial<{ name: string; journeyDate: Date; participantMonkIds?: string[]; contactPersonIds?: string[]; stops: unknown[] }>) {
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route || route.deletedAt) throw ApiError.notFound('Route not found');
  return prisma.route.update({
    where: { id: routeId },
    data: { 
      name: input.name, 
      journeyDate: input.journeyDate, 
      participantMonkIds: input.participantMonkIds ? (input.participantMonkIds as Prisma.InputJsonValue) : undefined,
      contactPersonIds: input.contactPersonIds ? (input.contactPersonIds as Prisma.InputJsonValue) : undefined,
      stops: input.stops as Prisma.InputJsonValue 
    },
  });
}

export async function listRoutes(filters: { monkId?: string; monkGroupId?: string }) {
  const routes = await prisma.route.findMany({
    where: { deletedAt: null, monkId: filters.monkId, monkGroupId: filters.monkGroupId },
    include: { 
      monk: { select: { publicId: true, dikshaName: true, photoUrl: true } },
      monkGroup: { select: { name: true, leaderMonkId: true } },
      journeys: { where: { status: 'IN_PROGRESS' }, select: { id: true } }
    },
    orderBy: { journeyDate: 'desc' },
  });

  const contactIds = Array.from(new Set(
    routes.flatMap(r => (r.contactPersonIds as string[]) || [])
  ));

  let membersMap = new Map();
  if (contactIds.length > 0) {
    const members = await prisma.member.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, publicId: true, fullName: true, firstName: true, surname: true, mobile: true }
    });
    members.forEach(m => membersMap.set(m.id, m));
  }

  // Fetch organization names for stops
  const templeIds = Array.from(new Set(
    routes.flatMap(r => ((r.stops as any[]) || []).map(s => s.templeId).filter(Boolean))
  ));
  
  let orgsMap = new Map();
  if (templeIds.length > 0) {
    const orgs = await prisma.organization.findMany({
      where: { id: { in: templeIds } },
      select: { id: true, name: true, type: true, city: true }
    });
    orgs.forEach(o => orgsMap.set(o.id, o));
  }

  // Fetch participant monks data
  const participantMonkIds = Array.from(new Set(
    routes.flatMap(r => (r.participantMonkIds as string[]) || [])
  ));

  let participantMonksMap = new Map();
  if (participantMonkIds.length > 0) {
    const participantMonks = await prisma.monkProfile.findMany({
      where: { id: { in: participantMonkIds } },
      select: { id: true, publicId: true, dikshaName: true, nameBeforeDiksha: true }
    });
    participantMonks.forEach(m => participantMonksMap.set(m.id, m));
  }

  return routes.map(r => {
    const populatedStops = ((r.stops as any[]) || []).map(stop => {
      const org = stop.templeId ? orgsMap.get(stop.templeId) : null;
      return {
        ...stop,
        orgName: org ? org.name : undefined,
        orgType: org ? org.type : undefined,
        orgCity: org ? org.city : undefined
      };
    });

    return {
      ...r,
      hasActiveJourney: r.journeys && r.journeys.length > 0,
      activeJourneyId: r.journeys?.[0]?.id || null,
      stops: populatedStops,
      contactPersonsData: ((r.contactPersonIds as string[]) || []).map(id => membersMap.get(id)).filter(Boolean),
      participantMonksData: ((r.participantMonkIds as string[]) || []).map(id => participantMonksMap.get(id)).filter(Boolean)
    };
  });
}

// -----------------------------------------------------------------------------
// Journeys (§5.10): manual tracking by temple admins + device pings, one timeline
// -----------------------------------------------------------------------------

export async function startJourney(routeId: string) {
  const route = await prisma.route.findUnique({ where: { id: routeId }, include: { monk: true, monkGroup: true } });
  if (!route || route.deletedAt) throw ApiError.notFound('Route not found');

  const existing = await prisma.journey.findFirst({ where: { routeId, status: 'IN_PROGRESS' } });
  if (existing) throw ApiError.conflict('A journey for this route is already in progress');

  const journey = await prisma.journey.create({ data: { routeId, monkId: route.monkId, monkGroupId: route.monkGroupId } });

  const entityName = route.monk ? route.monk.dikshaName : (route.monkGroup ? route.monkGroup.name : 'Unknown');
  if (route.monkId) {
    await notifyMonkFollowers(route.monkId, `Journey started on route "${route.name}".`);
  }
  
  const stops = (route.stops as any[]) ?? [];
  if (stops[0]?.templeId) {
    await createAutoFeedCard({
      sourceModule: 'TRACKING_DEPARTURE',
      sourceId: journey.id,
      organizationId: stops[0].templeId,
      title: `Vihar Started: ${entityName}`,
      description: `A Vihar journey has started from ${stops[0].templeName}.`
    }).catch(err => console.error('Failed to post departure feed card:', err));
  }

  return journey;
}

export async function recordJourneyEvent(journeyId: string, input: { type: 'DEPARTURE' | 'ARRIVAL' | 'DELAY' | 'MANUAL_UPDATE'; templeId?: string; note?: string; createdById: string; timestamp?: string }) {
  const journey = await prisma.journey.findUnique({ where: { id: journeyId }, include: { route: true, monk: true, monkGroup: true } });
  if (!journey) throw ApiError.notFound('Journey not found');

  const event = await prisma.journeyEvent.create({
    data: { 
      journeyId, 
      type: input.type, 
      templeId: input.templeId, 
      note: input.note, 
      createdById: input.createdById,
      timestamp: input.timestamp ? new Date(input.timestamp) : undefined,
    },
  });

  const stops = (journey.route.stops as any[]) ?? [];

  if (input.type === 'ARRIVAL') {
    // Advance the current stop pointer + mark stop completed
    const idx = journey.currentStopIndex;
    if (stops[idx]) stops[idx] = { ...stops[idx], status: 'COMPLETED', actualArrival: new Date().toISOString() };
    const isLastStop = idx >= stops.length - 1;

    await prisma.route.update({ where: { id: journey.routeId }, data: { stops: stops as Prisma.InputJsonValue } });
    await prisma.journey.update({
      where: { id: journeyId },
      data: isLastStop
        ? { status: 'COMPLETED', completedAt: new Date(), currentStopIndex: idx }
        : { currentStopIndex: idx + 1 },
    });

    const entityName = journey.monk ? journey.monk.dikshaName : (journey.monkGroup ? journey.monkGroup.name : 'Unknown');

    // Notify upcoming temples + "Join Monk" followers (§5.10)
    if (journey.monkId) {
      await notifyMonkFollowers(journey.monkId, `${entityName} arrived at ${stops[idx]?.templeName ?? 'a stop'} on route "${journey.route.name}".`);
    }

    if (stops[idx]?.templeId) {
      await createAutoFeedCard({
        sourceModule: 'TRACKING_ARRIVAL',
        sourceId: event.id,
        organizationId: stops[idx].templeId,
        title: `Vihar Arrival: ${entityName}`,
        description: `${entityName} has arrived at ${stops[idx].templeName}.`
      }).catch(err => console.error('Failed to post arrival feed card:', err));
    }
  }

  if (input.type === 'DELAY') {
    const idx = journey.currentStopIndex;
    if (stops[idx]) stops[idx] = { ...stops[idx], status: 'DELAYED' };
    await prisma.route.update({ where: { id: journey.routeId }, data: { stops: stops as Prisma.InputJsonValue } });
    await raiseAlert({
      type: 'ROUTE_DELAY',
      severity: 'WARNING',
      monkId: journey.monkId ?? undefined,
      message: `Route "${journey.route.name}" delayed at stop ${stops[idx]?.templeName ?? journey.currentStopIndex}${input.note ? `: ${input.note}` : ''}`,
      dedupeKey: `delay-${journeyId}-${journey.currentStopIndex}`,
    });
  }

  try {
    getIO().of('/tracking').to(`route:${journey.routeId}`).emit('journey:event', { journeyId, event });
  } catch {
    // no socket server in this process
  }

  return event;
}

export async function listJourneys(status?: string | string[]) {
  const where: any = {};
  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }
  return prisma.journey.findMany({
    where,
    include: {
      monk: { select: { publicId: true, dikshaName: true, photoUrl: true } },
      monkGroup: { select: { id: true, name: true, leaderMonkId: true } },
      route: { select: { name: true, journeyDate: true, stops: true } },
    },
    orderBy: { startedAt: 'desc' },
  });
}

export async function getJourneyTimeline(journeyId: string) {
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    include: {
      route: true,
      monk: { select: { publicId: true, dikshaName: true, photoUrl: true } },
      events: { orderBy: { timestamp: 'asc' } },
    },
  });
  if (!journey) throw ApiError.notFound('Journey not found');
  return journey;
}

// -----------------------------------------------------------------------------
// Live map (§5.10): markers with Moving/Idle/Offline heuristics
// -----------------------------------------------------------------------------

export async function getLiveMap(filters: { templeId?: string; routeId?: string; status?: 'MOVING' | 'IDLE' | 'OFFLINE' }) {
  const devices = await prisma.device.findMany({
    where: { status: 'ACTIVE', monkId: { not: null } },
    include: {
      monk: { select: { id: true, publicId: true, dikshaName: true, photoUrl: true, currentTempleId: true } },
      locationPings: { orderBy: { timestamp: 'desc' }, take: 2 },
    },
  });

  const now = Date.now();
  const markers = devices
    .filter((d) => d.locationPings.length > 0)
    .map((d) => {
      const latest = d.locationPings[0]!;
      const previous = d.locationPings[1];
      const minutesSince = (now - latest.timestamp.getTime()) / 60000;

      let status: 'MOVING' | 'IDLE' | 'OFFLINE';
      if (minutesSince > IDLE_THRESHOLD_MINUTES) status = 'OFFLINE';
      else if (previous && minutesSince <= MOVING_THRESHOLD_MINUTES && (previous.lat !== latest.lat || previous.lng !== latest.lng)) status = 'MOVING';
      else status = 'IDLE';

      return {
        deviceId: d.publicId,
        monk: d.monk,
        lat: latest.lat,
        lng: latest.lng,
        battery: latest.battery,
        lastUpdate: latest.timestamp,
        status,
      };
    })
    .filter((m) => !filters.status || m.status === filters.status)
    .filter((m) => !filters.templeId || m.monk?.currentTempleId === filters.templeId);

  return markers;
}

// -----------------------------------------------------------------------------
// Member-side: monk map/list + privacy rules (§5.10)
// -----------------------------------------------------------------------------

export async function getMemberMonkView(monkId: string) {
  const monk = await prisma.monkProfile.findFirst({
    where: { OR: [{ id: monkId }, { publicId: monkId }], deletedAt: null },
    select: {
      publicId: true,
      dikshaName: true,
      photoUrl: true,
      gender: true,
      bio: true,
      dikshaDate: true,
      dikshaPlace: true,
      dikshaGuru: { select: { dikshaName: true } },
      community: { select: { name: true } },
      subCommunity: { select: { name: true } },
      currentTemple: { select: { name: true, city: true, publicId: true } },
      // Privacy: no emergency contacts, no device internals for members
    },
  });
  if (!monk) throw ApiError.notFound('Monk not found');
  return monk;
}

async function notifyMonkFollowers(monkId: string, body: string) {
  const followers = await prisma.monkFollow.findMany({
    where: { monkId },
    include: { member: { select: { userId: true } } },
  });
  await Promise.all(
    followers.map((f) =>
      enqueueNotification({
        userId: f.member.userId,
        templateKey: 'MONK_JOURNEY_UPDATE',
        category: 'SERVICE',
        to: { PUSH: f.member.userId, IN_APP: f.member.userId },
        body,
      }),
    ),
  );
}

export async function raiseSosAlert(monkId: string, message: string) {
  return raiseAlert({ type: 'SOS', severity: 'CRITICAL', monkId, message });
}
