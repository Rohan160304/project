import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const likes = await prisma.feedPostLike.findMany();
  console.log('Likes:', likes);
  const posts = await prisma.feedPost.findMany({ select: { id: true, likeCount: true, viewCount: true } });
  console.log('Posts:', posts.slice(0, 5));
}
main().catch(console.error).finally(() => prisma.$disconnect());
