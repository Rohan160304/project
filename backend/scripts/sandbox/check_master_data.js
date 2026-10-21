const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const comms = await prisma.community.findMany();
  const subComms = await prisma.subCommunity.findMany();
  const gacchas = await prisma.gaccha.findMany();
  console.log({ comms, subComms, gacchas });
}
main().catch(console.error).finally(() => prisma.$disconnect());
