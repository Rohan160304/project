import { PrismaClient, MonkGender } from "@prisma/client";

const prisma = new PrismaClient();

async function seedAnandRishiji() {
  console.log("Starting Anand Rishiji seeding...");

  const shwetambar = await prisma.community.findFirst({ where: { name: 'Shwetambar' } });

  await prisma.monkProfile.upsert({
    where: { publicId: "JFMNK416" },
    update: {},
    create: {
      publicId: "JFMNK416",
      dikshaName: "Acharya Anand Rishiji Maharaj",
      shortName: "Anand Rishiji",
      gender: MonkGender.SADHU,
      status: "NIRVANA",
      communityId: shwetambar?.id || null,
      
      // Languages
      languages: ["Hindi", "Gujarati"],
      
      // Routine (Pravachan / Darshan timings)
      routine: {
        pravachan: {
          morning: "",
          afternoon: "",
          evening: ""
        },
        darshan: {
          morning: "",
          afternoon: "",
          evening: ""
        }
      },

      // Contact info
      sanghContacts: {
        representatives: "No Sangh representatives linked.",
        helpers: "No helpers linked.",
        directCall: "Not Available",
        whatsapp: "Not Available"
      },

      socialLinks: {
        official: "No links available."
      },

      // Diksha Details
      dikshaDate: null,
      dikshaPlace: null,
      dikshaGuruId: null,

      // Vihaar Logs
      tracking: {
        vihaarLogs: "No vihaar history logs recorded."
      },

      // Tapasya
      tapasya: [],

      // Family
      preDikshaFather: { name: "-" },
      preDikshaMother: { name: "-" },
      preDikshaLocation: { address: "Address not defined." },
      
      chaturmasHistory: {},
    }
  });

  console.log("Successfully seeded Anand Rishiji!");
}

seedAnandRishiji()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
