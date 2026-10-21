import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const monks = await prisma.monkProfile.findMany();
  for (const monk of monks) {
    if (monk.photoUrl && monk.photoUrl.includes('ui-avatars.com')) {
      await prisma.monkProfile.update({
        where: { id: monk.id },
        data: { photoUrl: null }
      });
      console.log(`Removed photoUrl for ${monk.dikshaName}`);
    }
  }
}
main().finally(() => prisma.$disconnect());
