const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const monks = await prisma.monkProfile.findMany({});
  console.log('All Monks:', monks.map(m => ({ id: m.id, name: m.dikshaName, deletedAt: m.deletedAt, publicId: m.publicId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
