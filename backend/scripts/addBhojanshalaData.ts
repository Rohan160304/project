import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const organizations = await prisma.organization.findMany();

  for (const org of organizations) {
    // Add default timings if they don't exist
    if (!org.bhojanshalaBreakfastCharge) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          bhojanshalaBreakfastCharge: '50',
          bhojanshalaBreakfastTiming: '08:00 AM - 10:00 AM',
          bhojanshalaLunchCharge: '100',
          bhojanshalaLunchTiming: '12:00 PM - 02:00 PM',
          bhojanshalaDinnerCharge: '100',
          bhojanshalaDinnerTiming: '05:30 PM - 07:30 PM',
        }
      });
    }

    // Add 1 menu item for Monday
    const existingMenu = await prisma.bhojanshalaMenuItem.findFirst({
      where: {
        organizationId: org.id,
        mealType: 'LUNCH',
        dayOfWeek: 'Monday'
      }
    });

    if (!existingMenu) {
      await prisma.bhojanshalaMenuItem.create({
        data: {
          organizationId: org.id,
          mealType: 'LUNCH',
          dayOfWeek: 'Monday',
          itemName: `Special Lunch Thali (${org.name})`,
          price: 150,
          isAvailable: true,
        }
      });
    }
  }

  console.log(`Added default bhojanshala data to ${organizations.length} organizations.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
