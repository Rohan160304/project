import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clearDharamshalas = async () => {
  try {
    const orgs = await prisma.organization.findMany({
      where: {
        publicId: { startsWith: "DHRM-" }
      },
      select: { id: true }
    });

    const orgIds = orgs.map(o => o.id);

    if (orgIds.length === 0) {
      console.log("No DHRM- orgs found.");
      return;
    }

    console.log(`Deleting ${orgIds.length} Dharamshalas...`);

    await prisma.roomOrHall.deleteMany({
      where: { wing: { building: { organizationId: { in: orgIds } } } }
    });
    
    await prisma.wing.deleteMany({
      where: { building: { organizationId: { in: orgIds } } }
    });

    await prisma.building.deleteMany({
      where: { organizationId: { in: orgIds } }
    });

    await prisma.announcement.deleteMany({
      where: { organizationId: { in: orgIds } }
    });

    await prisma.organizationNotice.deleteMany({
      where: { organizationId: { in: orgIds } }
    });

    await prisma.accommodationRule.deleteMany({
      where: { organizationId: { in: orgIds } }
    });

    await prisma.dharamshalaSettings.deleteMany({
      where: { organizationId: { in: orgIds } }
    });

    await prisma.organization.deleteMany({
      where: { id: { in: orgIds } }
    });

    console.log("Deleted successfully.");

  } catch (error) {
    console.error("Error clearing:", error);
  } finally {
    await prisma.$disconnect();
  }
};

clearDharamshalas();
