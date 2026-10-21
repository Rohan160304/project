import { PrismaClient, MonkGender } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching communities...");
  const digambar = await prisma.community.findFirst({ where: { name: 'Digambar' } });
  const shwetambar = await prisma.community.findFirst({ where: { name: 'Shwetambar' } });

  const murtipujak = await prisma.subCommunity.findFirst({ where: { name: 'Murtipujak' } });
  const sthanakvasi = await prisma.subCommunity.findFirst({ where: { name: 'Sthanakvasi' } });
  const terapanthiS = await prisma.subCommunity.findFirst({ where: { name: 'Terapanthi (Shwetambar)' } });
  const terapanthiD = await prisma.subCommunity.findFirst({ where: { name: 'Terapanthi (Digambar)' } });

  console.log("Communities fetched.");

  const allMonks = await prisma.monkProfile.findMany();
  const getMonk = (nameStr: string) => allMonks.find(m => m.dikshaName.includes(nameStr) || m.shortName?.includes(nameStr));

  // Helper to create or get Guru
  async function getOrCreateGuru(name: string, gender: MonkGender = MonkGender.SADHU) {
    let guru = getMonk(name);
    if (!guru) {
      guru = await prisma.monkProfile.create({
        data: {
          dikshaName: name,
          publicId: "GURU_" + Math.random().toString(36).substring(7),
          gender: gender,
          status: "NIRVANA"
        }
      });
      allMonks.push(guru);
    }
    return guru;
  }

  // Define updates
  const updates = [
    { name: "Vidyasagar", communityId: digambar?.id, subCommunityId: terapanthiD?.id || null, guruName: "Acharya Gyan Sagar Ji" },
    { name: "Mahashraman", communityId: shwetambar?.id, subCommunityId: terapanthiS?.id, guruName: "Acharya Shri Mahapragya Ji" },
    { name: "Tulsi", communityId: shwetambar?.id, subCommunityId: terapanthiS?.id, guruName: "Acharya Kalugani" },
    { name: "Mahapragya", communityId: shwetambar?.id, subCommunityId: terapanthiS?.id, guruName: "Acharya Shri Tulsi" },
    { name: "Namramuni", communityId: shwetambar?.id, subCommunityId: sthanakvasi?.id, guruName: "Gurudev Shri Sushil Muni" },
    { name: "Ratnasundersuri", communityId: shwetambar?.id, subCommunityId: murtipujak?.id, guruName: "Acharya Bhuvanbhanu Surishwarji" },
    { name: "Yugbhushan", communityId: shwetambar?.id, subCommunityId: murtipujak?.id, guruName: "Acharya Ramchandrasuri" },
    { name: "Pramansagar", communityId: digambar?.id, subCommunityId: terapanthiD?.id || null, guruName: "Acharya Shri Vidyasagar Ji Maharaj" },
    { name: "Tarunsagar", communityId: digambar?.id, subCommunityId: terapanthiD?.id || null, guruName: "Acharya Pushpadant Sagar" },
    { name: "Chandana", communityId: shwetambar?.id, subCommunityId: sthanakvasi?.id, guruName: "Upadhyay Shri Amar Muni" },
    { name: "Kanakprabha", communityId: shwetambar?.id, subCommunityId: terapanthiS?.id, guruName: "Acharya Shri Tulsi" },
    { name: "Shivmuni", communityId: shwetambar?.id, subCommunityId: sthanakvasi?.id, guruName: "Acharya Anand Rishiji" },
    { name: "Sudhasagar", communityId: digambar?.id, subCommunityId: terapanthiD?.id || null, guruName: "Acharya Shri Vidyasagar Ji Maharaj" },
    { name: "Ramlal", communityId: shwetambar?.id, subCommunityId: sthanakvasi?.id, guruName: "Acharya Nanesh" },
    { name: "Vallabh", communityId: shwetambar?.id, subCommunityId: murtipujak?.id, guruName: "Acharya Vijayanand Suri" }
  ];

  for (const update of updates) {
    const monk = getMonk(update.name);
    if (monk) {
      const guru = await getOrCreateGuru(update.guruName);
      await prisma.monkProfile.update({
        where: { id: monk.id },
        data: {
          communityId: update.communityId,
          subCommunityId: update.subCommunityId,
          dikshaGuruId: guru.id
        }
      });
      console.log(`Updated ${monk.dikshaName}`);
    }
  }

  console.log("Done updating relations.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
