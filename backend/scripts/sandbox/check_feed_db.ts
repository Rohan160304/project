import { prisma } from './src/config/prisma';
async function run() {
  const posts = await prisma.feedPost.findMany({ where: { sourceModule: 'EVENTS' } });
  for (const p of posts) {
    const cfg = (p.visibilityConfig || {}) as any;
    cfg.isPublic = true;
    await prisma.feedPost.update({
      where: { id: p.id },
      data: { visibilityConfig: cfg }
    });
  }
}
run().then(() => console.log('Done')).catch(console.error);
