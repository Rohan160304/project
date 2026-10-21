const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const staff = await prisma.user.findFirst({ where: { mobile: '+916263584176' }, include: { userOrganizations: true, permissionOverrides: true } });
  console.dir(staff, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
