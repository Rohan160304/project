import { prisma } from './src/config/prisma';

async function run() {
  const posts = await prisma.feedPost.findMany({ where: { sourceModule: 'EVENTS' } });
  for (const post of posts) {
    if (post.visibilityConfig) {
      const cfg = post.visibilityConfig as any;
      if (cfg.geo?.country === 'Entire India' && cfg.sect === 'All Jain Members') {
        cfg.isPublic = true;
        await prisma.feedPost.update({ where: { id: post.id }, data: { visibilityConfig: cfg } });
        console.log('Updated post', post.id);
      }
    }
  }
}
run().then(() => console.log('Done')).catch(console.error);
