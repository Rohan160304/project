import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const comms = await prisma.community.findMany({
    include: { subCommunities: true }
  });
  console.log(JSON.stringify(comms, null, 2));
  await prisma.$disconnect();
}
main();
