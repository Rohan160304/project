const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.admin.findMany({
    where: { role: 'STAFF' },
    select: { id: true, firstName: true, role: true, modules: true }
  });
  console.dir(staff, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
