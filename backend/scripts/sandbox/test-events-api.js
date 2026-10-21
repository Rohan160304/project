const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const events = await prisma.event.findMany({
    where: { deletedAt: null, status: { in: ['PUBLISHED', 'RSVP_SALES_OPEN', 'LIVE'] }, endAt: { gte: new Date() } },
    orderBy: { startAt: 'asc' },
  });
  console.log(events.map(e => e.publicId));
}
main();
