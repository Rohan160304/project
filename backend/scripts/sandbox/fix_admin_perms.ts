import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const overrides = await prisma.userPermissionOverride.findMany({
    where: { user: { primaryRoleKey: 'TEMPLE_ADMIN' } }
  });
  console.log('Overrides count:', overrides.length);
  if (overrides.length > 0) {
    const eventsOverride = overrides.filter(o => o.module === 'EVENTS');
    console.log('EVENTS overrides:', eventsOverride.map(o => ({ action: o.action, allowed: o.allowed })));
    
    // Just delete all overrides for TEMPLE_ADMIN to let RolePermission take over, 
    // and see if that fixes it.
    await prisma.userPermissionOverride.deleteMany({
      where: { user: { primaryRoleKey: 'TEMPLE_ADMIN' } }
    });
    console.log('Deleted all overrides for TEMPLE_ADMIN. They will now use RolePermission defaults.');
  }
}
main().catch(console.error);
