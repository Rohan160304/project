const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const menus = await prisma.bhojanshalaMenuItem.findMany({ take: 5 });
  console.log(menus);
}
main().catch(console.error).finally(() => prisma.$disconnect());
