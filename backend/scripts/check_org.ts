import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const checkJfjt108 = async () => {
  const org = await prisma.organization.findUnique({
    where: { publicId: "JFJT108" },
    select: { id: true, name: true, establishedDate: true }
  });
  console.log(org);
  await prisma.$disconnect();
};

checkJfjt108();
