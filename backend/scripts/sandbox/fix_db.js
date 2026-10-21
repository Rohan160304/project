const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      mobile: {
        not: {
          startsWith: '+'
        }
      }
    }
  });

  for (const user of users) {
    if (user.mobile && !user.mobile.startsWith('+')) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mobile: `+91${user.mobile}` }
      });
      console.log(`Updated user ${user.id} mobile to +91${user.mobile}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
