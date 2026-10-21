const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const menu = await prisma.bhojanshalaMenuItem.findFirst();
  console.log("Menu item:", menu);
}
main().catch(console.error).finally(() => prisma.$disconnect());
