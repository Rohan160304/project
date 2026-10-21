const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const run = async () => {
  const user = await prisma.user.findFirst({ where: { firstName: { contains: 'Sanskar', mode: 'insensitive' } } });
  const overrides = await prisma.userPermissionOverride.findMany({ where: { userId: user.id } });
  console.log("Overrides:", overrides.length);
  console.log(overrides.map(o => `${o.module}: ${o.allowed}`));
};
run().then(() => process.exit(0)).catch(console.error);
