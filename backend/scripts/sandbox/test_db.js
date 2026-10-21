const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const posts = await prisma.feedPost.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(posts, null, 2));
}
main().finally(() => prisma.$disconnect());
