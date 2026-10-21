const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orgId = 'cmsta16wo0003nosd3akppmef';
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, type: true, hasBhojanshala: true, hasDharamshala: true, activeModules: true }
  });
  console.log(org);
}
main().catch(console.error).finally(() => prisma.$disconnect());
