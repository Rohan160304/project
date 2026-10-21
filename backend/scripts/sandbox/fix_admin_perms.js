const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const overrides = await prisma.userPermissionOverride.findMany({
    where: { user: { primaryRoleKey: 'TEMPLE_ADMIN' } }
  });
  console.log('Overrides count:', overrides.length);
  if (overrides.length > 0) {
    const eventsOverride = overrides.filter(o => o.module === 'EVENTS');
    console.log('EVENTS overrides:', eventsOverride.map(o => ({ action: o.action, allowed: o.allowed })));
    
    await prisma.userPermissionOverride.deleteMany({
      where: { user: { primaryRoleKey: 'TEMPLE_ADMIN' } }
    });
    console.log('Deleted all overrides for TEMPLE_ADMIN. They will now use RolePermission defaults.');
  }

  // Also check RolePermissions just to be safe
  const roles = await prisma.role.findMany({ where: { key: 'TEMPLE_ADMIN' } });
  if (roles.length > 0) {
      const rp = await prisma.rolePermission.findMany({
          where: { roleId: roles[0].id, module: 'EVENTS' }
      });
      console.log('RolePermissions for EVENTS:', rp.map(r => r.action));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
