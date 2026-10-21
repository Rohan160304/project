const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const temples = await prisma.temple.findMany();
  for (const t of temples) {
    console.log(`Temple: ${t.id} - ${t.name}`);
    console.log(`hasBhojanshala: ${t.hasBhojanshala}, activeModules:`, t.activeModules);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
