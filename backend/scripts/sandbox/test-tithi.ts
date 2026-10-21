import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.tithiCalendarEntry.findMany();
  console.log(all);
}
main();
