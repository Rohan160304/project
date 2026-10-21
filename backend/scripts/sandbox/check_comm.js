const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const comms = await prisma.community.findMany();
  console.log("Communities:", comms);
}
main().catch(console.error).finally(() => prisma.$disconnect());
