import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateMulNayak() {
  const bhagwan = await prisma.bhagwanMaster.findFirst({
    where: { name: { contains: "Shankeshver Parshvanath", mode: "insensitive" } }
  });

  if (bhagwan) {
    await prisma.organization.update({
      where: { publicId: "JFJT108" },
      data: {
        mulNayakBhagwanId: bhagwan.id,
        templeMulNayakName: "Shri Shankheshwar Parshwanath Bhagwan"
      }
    });
    console.log("Updated Mul Nayak successfully!");
  } else {
    console.log("Bhagwan not found in master.");
  }

  await prisma.$disconnect();
}

updateMulNayak().catch(console.error);
