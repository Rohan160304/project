const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { primaryRoleKey: 'SUPER_ADMIN' } });
  console.log(user.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());
