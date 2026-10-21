const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const passes = await prisma.bhojanshalaPass.findMany({
    include: {
      member: {
        select: { id: true, userId: true, publicId: true }
      }
    }
  });
  console.log(JSON.stringify(passes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
