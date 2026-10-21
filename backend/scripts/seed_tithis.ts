import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let gujarati = await prisma.tithiCalendarType.findFirst({
    where: { name: 'Gujarati' }
  });

  if (!gujarati) {
    gujarati = await prisma.tithiCalendarType.create({
      data: { name: 'Gujarati' }
    });
    console.log('Created Gujarati calendar type');
  } else {
    console.log('Found Gujarati calendar type');
  }

  const entries = [
    { gregorianDate: new Date('2026-09-02T00:00:00Z'), tithiName: 'Bhadrapada Krishna Dwitiya', description: 'Dwitiya' },
    { gregorianDate: new Date('2026-09-03T00:00:00Z'), tithiName: 'Bhadrapada Krishna Tritiya', description: 'Tritiya' },
    { gregorianDate: new Date('2026-09-04T00:00:00Z'), tithiName: 'Bhadrapada Krishna Chaturthi', description: 'Chaturthi' },
    { gregorianDate: new Date('2026-09-05T00:00:00Z'), tithiName: 'Bhadrapada Krishna Panchami', description: 'Panchami' },
    { gregorianDate: new Date('2026-09-06T00:00:00Z'), tithiName: 'Bhadrapada Krishna Shashthi', description: 'Shashthi' },
  ];

  for (const entry of entries) {
    const year = entry.gregorianDate.getFullYear();
    await prisma.tithiCalendarEntry.upsert({
      where: {
        calendarTypeId_gregorianDate: {
          calendarTypeId: gujarati.id,
          gregorianDate: entry.gregorianDate
        }
      },
      update: {
        tithiName: entry.tithiName,
        description: entry.description,
        year
      },
      create: {
        calendarTypeId: gujarati.id,
        year,
        gregorianDate: entry.gregorianDate,
        tithiName: entry.tithiName,
        description: entry.description
      }
    });
  }

  console.log('Successfully seeded tithi entries for Sept 2-6, 2026');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
