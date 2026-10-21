const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ev = await prisma.event.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log(ev);
}
main();
