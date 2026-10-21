const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const passes = await prisma.bhojanshalaPass.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(passes.map(p => ({ id: p.id, status: p.status, memberId: p.memberId, createdAt: p.createdAt })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
