const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const staff = await prisma.user.findUnique({
    where: { id: 'cmsw5jh7f00oh6afoible7jij' },
    include: { userOrganizations: true, permissionOverrides: true }
  });
  console.dir(staff, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
