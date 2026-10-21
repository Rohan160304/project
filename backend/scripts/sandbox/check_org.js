const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    console.log(`Org: ${org.id} - ${org.name}`);
    console.log(`type: ${org.type}, hasBhojanshala: ${org.hasBhojanshala}, activeModules:`, org.activeModules);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
