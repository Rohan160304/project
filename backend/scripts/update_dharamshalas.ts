import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updateDharamshalas = async () => {
  try {
    const digambar = "cmti2gh3f013a1126wzj885aw";
    const digBispanthi = "cmti2gju3013j1126ubtwch1h";
    const digTerapanthi = "cmti2gka3013l1126is5ouupg";
    
    const shwetambar = "cmti2ghso013b1126tad9i4du";
    const shweMurtipujak = "cmti2gi73013d11269a4bvmvn";
    const shweSthanakvasi = "cmti2giz6013f1126gk0fq1af";

    const updates = [
      {
        publicId: "JFD109", // Shikharji
        communityId: digambar,
        subCommunityId: digBispanthi,
        establishedDate: new Date("1950-01-01T00:00:00Z")
      },
      {
        publicId: "JFD110", // Palitana
        communityId: shwetambar,
        subCommunityId: shweMurtipujak,
        establishedDate: new Date("1920-05-10T00:00:00Z")
      },
      {
        publicId: "JFD111", // Girnar
        communityId: shwetambar,
        subCommunityId: shweMurtipujak,
        establishedDate: new Date("1965-08-15T00:00:00Z")
      },
      {
        publicId: "JFD112", // Pavapuri
        communityId: digambar,
        subCommunityId: digTerapanthi,
        establishedDate: new Date("1980-04-20T00:00:00Z")
      },
      {
        publicId: "JFD113", // Ranakpur
        communityId: shwetambar,
        subCommunityId: shweSthanakvasi,
        establishedDate: new Date("1995-10-10T00:00:00Z")
      }
    ];

    for (const data of updates) {
      await prisma.organization.update({
        where: { publicId: data.publicId },
        data: {
          communityId: data.communityId,
          subCommunityId: data.subCommunityId,
          establishedDate: data.establishedDate
        }
      });
      console.log(`Updated ${data.publicId}`);
    }

    console.log("All Dharamshalas updated successfully!");
  } catch (error) {
    console.error("Error updating:", error);
  } finally {
    await prisma.$disconnect();
  }
};

updateDharamshalas();
