import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generatePublicId(prefix: string) {
  return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
}

async function main() {
  console.log('Starting to seed test data...');

  const types = ['TEMPLE', 'JAIN_CENTER', 'DHARAMSHALA'] as const;

  for (const type of types) {
    for (let i = 1; i <= 3; i++) {
      const publicId = generatePublicId(type === 'TEMPLE' ? 'TMP' : type === 'JAIN_CENTER' ? 'JC' : 'DHR');
      const org = await prisma.organization.create({
        data: {
          publicId,
          type,
          name: `Test ${type} ${i}`,
          city: 'Mumbai',
          state: 'Maharashtra',
          status: 'ACTIVE',
        },
      });
      console.log(`Created Organization: ${org.name}`);

      // Create 2 events
      for (let j = 1; j <= 2; j++) {
        await prisma.event.create({
          data: {
            publicId: generatePublicId('EVT'),
            organizationId: org.id,
            title: `${org.name} - Event ${j}`,
            description: `This is a test event ${j} for ${org.name}`,
            venue: `Venue ${j}, Mumbai`,
            startAt: new Date(new Date().getTime() + j * 86400000), // j days from now
            endAt: new Date(new Date().getTime() + j * 86400000 + 3600000), // 1 hour later
          },
        });
      }
      console.log(`Created 2 events for ${org.name}`);

      // Create 2 feed posts
      for (let k = 1; k <= 2; k++) {
        await prisma.feedPost.create({
          data: {
            organizationId: org.id,
            title: `${org.name} - Post ${k}`,
            description: `This is an announcement post ${k} from ${org.name}`,
            type: 'MANUAL',
            visibilityConfig: { isPublic: true }
          },
        });
      }
      console.log(`Created 2 feed posts for ${org.name}`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
