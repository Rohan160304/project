import { PrismaClient, OrganizationType, MemberCategory } from "@prisma/client";
import { ID_PREFIXES, IdPrefixKey } from "../src/config/constants";
import { generatePublicId } from "../src/engines/idGenerator/id.service";

const prisma = new PrismaClient();

const PREFIX_BY_TYPE: Record<OrganizationType, keyof typeof ID_PREFIXES> = {
  TEMPLE: 'TEMPLE',
  DHARAMSHALA: 'DHARAMSHALA',
  BHOJANSHALA: 'BHOJANSHALA',
  JAIN_CENTER: 'JAIN_CENTER',
  COMMUNITY_HALL: 'COMMUNITY_HALL',
  TRUST_OFFICE: 'TRUST_OFFICE',
  GAUSHALA: 'GAUSHALA',
  PATHSHALA: 'PATHSHALA',
  STHANAK: 'STHANAK',
};

async function reassignPublicIds() {
  console.log("Resetting id_sequences to start from 107 (so next is 108)...");
  
  // Reset all sequences
  await prisma.$executeRaw`TRUNCATE TABLE "id_sequences" RESTART IDENTITY CASCADE;`;

  console.log("Reassigning publicIds for Organizations...");
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    const prefixKey = PREFIX_BY_TYPE[org.type];
    const newPublicId = await generatePublicId(prefixKey);
    await prisma.organization.update({
      where: { id: org.id },
      data: { publicId: newPublicId }
    });
  }
  console.log(`Updated ${orgs.length} Organizations`);

  console.log("Reassigning publicIds for Monks...");
  const monks = await prisma.monkProfile.findMany();
  for (const monk of monks) {
    const newPublicId = await generatePublicId("MONK");
    await prisma.monkProfile.update({
      where: { id: monk.id },
      data: { publicId: newPublicId }
    });
  }
  console.log(`Updated ${monks.length} Monks`);

  console.log("Reassigning publicIds for Community Pages...");
  const pages = await prisma.communityPage.findMany();
  for (const page of pages) {
    const newPublicId = await generatePublicId("COMMUNITY_PAGE");
    await prisma.communityPage.update({
      where: { id: page.id },
      data: { publicId: newPublicId }
    });
  }
  console.log(`Updated ${pages.length} Community Pages`);

  console.log("Reassigning publicIds for Members...");
  const members = await prisma.member.findMany();
  for (const member of members) {
    const prefixKey = member.category === 'JAIN' ? 'JAIN_MEMBER' : 'NON_JAIN_MEMBER';
    const newPublicId = await generatePublicId(prefixKey);
    await prisma.member.update({
      where: { id: member.id },
      data: { publicId: newPublicId }
    });
  }
  console.log(`Updated ${members.length} Members`);

  console.log("Reassigning publicIds for Events...");
  const events = await prisma.event.findMany();
  for (const event of events) {
    const newPublicId = await generatePublicId("EVENT");
    await prisma.event.update({
      where: { id: event.id },
      data: { publicId: newPublicId }
    });
  }
  console.log(`Updated ${events.length} Events`);

  console.log("Reassigning publicIds for News...");
  const newsItems = await prisma.news.findMany();
  for (const news of newsItems) {
    const newPublicId = await generatePublicId("NEWS");
    await prisma.news.update({
      where: { id: news.id },
      data: { publicId: newPublicId }
    });
  }
  console.log(`Updated ${newsItems.length} News items`);

  console.log("Done updating publicIds!");
}

reassignPublicIds()
  .catch((e) => {
    console.error("Error reassigning publicIds:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
