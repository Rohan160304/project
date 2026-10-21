import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { primaryRoleKey: 'TEMPLE_ADMIN' }, take: 1 });
  if (users.length === 0) return console.log('no user');
  const role = await prisma.role.findUnique({ where: { key: users[0].primaryRoleKey } });
  if (!role) return console.log('no role');
  const rp = await prisma.rolePermission.findMany({ where: { roleId: role.id, module: 'EVENTS' } });
  console.log('Role permissions for EVENTS:', rp);
}
main().catch(console.error);
