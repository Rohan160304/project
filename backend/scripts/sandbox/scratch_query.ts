import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const sa = await prisma.user.findFirst({ where: { primaryRoleKey: 'SUPER_ADMIN' } });
  console.log(JSON.stringify(sa, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
