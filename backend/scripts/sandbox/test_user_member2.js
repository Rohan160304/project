const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { publicId: 'JFJM108' } });
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, publicId: u.publicId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
