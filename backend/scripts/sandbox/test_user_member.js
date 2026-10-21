const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { firstName: 'Sanskar' } });
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, firstName: u.firstName })));
  
  if (users.length > 0) {
    const members = await prisma.member.findMany({ where: { userId: users[0].id } });
    console.log("Members for User 0:", members.map(m => ({ id: m.id, firstName: m.firstName, middleName: m.middleName, lastName: m.lastName, publicId: m.publicId })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
