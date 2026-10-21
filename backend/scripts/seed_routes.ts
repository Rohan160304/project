import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedRoutes() {
  console.log("Starting Monk Routes seeding...");

  // Get a member to link as contactPerson
  let member = await prisma.member.findFirst({ where: { deletedAt: null } });
  if (!member) {
    throw new Error("No member found in DB. Please seed members first!");
  }

  // Create a Monk if none exists
  let monk = await prisma.monkProfile.findFirst({ where: { dikshaName: "Acharya Shri Mahashraman" } });
  if (!monk) {
    monk = await prisma.monkProfile.create({
      data: {
        publicId: "JFM101",
        dikshaName: "Acharya Shri Mahashraman",
        gender: "SADHU",
        status: "ACTIVE",
        dikshaDate: new Date("1974-05-05T00:00:00Z"),
        dob: new Date("1962-05-13T00:00:00Z"),
        bio: "11th Acharya of Jain Shwetambar Terapanth sect.",
        createdById: member.id,
      }
    });
    console.log(`Created Monk: ${monk.dikshaName}`);
  }

  const routesData = [
    {
      name: "Ahimsa Yatra - Rajasthan to Gujarat",
      journeyDate: new Date("2025-01-10T08:00:00Z"),
      stops: [
        { templeName: "Shwetambar Jain Temple", orgName: "Udaipur Sangh", orgCity: "Udaipur", dateTime: "2025-01-10T08:00:00Z", distance_km: 0, stay_duration_days: 2, note: "Start of Yatra" },
        { templeName: "Adinath Temple", orgName: "Dungarpur Jain Samaj", orgCity: "Dungarpur", dateTime: "2025-01-15T16:00:00Z", distance_km: 105, stay_duration_days: 1, note: "Pravachan at Main Ground" },
        { templeName: "Hutheesing Jain Temple", orgName: "Ahmedabad Mahasangh", orgCity: "Ahmedabad", dateTime: "2025-01-22T09:30:00Z", distance_km: 150, stay_duration_days: 3, note: "Mega Camp" }
      ]
    },
    {
      name: "Chaturmas Route - Malwa Region",
      journeyDate: new Date("2025-05-01T08:00:00Z"),
      stops: [
        { templeName: "Kanch Mandir", orgName: "Indore Digambar Samaj", orgCity: "Indore", dateTime: "2025-05-01T08:00:00Z", distance_km: 0, stay_duration_days: 5, note: "Initial preparations" },
        { templeName: "Shri Mahavir Swami Mandir", orgName: "Ujjain Shwetambar Samaj", orgCity: "Ujjain", dateTime: "2025-05-08T18:00:00Z", distance_km: 55, stay_duration_days: 120, note: "Chaturmas Location" }
      ]
    },
    {
      name: "Saurashtra Vihar",
      journeyDate: new Date("2025-10-15T08:00:00Z"),
      stops: [
        { templeName: "Rajkot Jain Temple", orgName: "Rajkot Sangh", orgCity: "Rajkot", dateTime: "2025-10-15T08:00:00Z", distance_km: 0, stay_duration_days: 2, note: "Welcome ceremony" },
        { templeName: "Girnar Tirth", orgName: "Junagadh Jain Trust", orgCity: "Junagadh", dateTime: "2025-10-22T10:00:00Z", distance_km: 100, stay_duration_days: 3, note: "Girnar Darshan" },
        { templeName: "Palitana Tirth", orgName: "Anandji Kalyanji Trust", orgCity: "Palitana", dateTime: "2025-11-01T07:00:00Z", distance_km: 160, stay_duration_days: 5, note: "Shatrunjaya Yatra" }
      ]
    },
    {
      name: "South India Dharma Prabhavana",
      journeyDate: new Date("2026-01-05T08:00:00Z"),
      stops: [
        { templeName: "Bhagawan Mahaveer Jain Temple", orgName: "Bengaluru Jain Samaj", orgCity: "Bengaluru", dateTime: "2026-01-05T08:00:00Z", distance_km: 0, stay_duration_days: 7, note: "City tour and discourses" },
        { templeName: "Mysuru Jain Basti", orgName: "Mysuru Digambar Trust", orgCity: "Mysuru", dateTime: "2026-01-15T16:00:00Z", distance_km: 145, stay_duration_days: 2, note: "Short stay" },
        { templeName: "Mint Street Jain Temple", orgName: "Chennai Shwetambar Sangh", orgCity: "Chennai", dateTime: "2026-02-01T09:00:00Z", distance_km: 480, stay_duration_days: 5, note: "Major convention" }
      ]
    },
    {
      name: "North India Shanti March",
      journeyDate: new Date("2026-03-10T08:00:00Z"),
      stops: [
        { templeName: "Ahinsa Sthal", orgName: "Delhi Jain Samaj", orgCity: "Delhi", dateTime: "2026-03-10T08:00:00Z", distance_km: 0, stay_duration_days: 3, note: "Red Fort ground gathering" },
        { templeName: "Agra Digambar Jain Temple", orgName: "Agra Sangh", orgCity: "Agra", dateTime: "2026-03-15T15:30:00Z", distance_km: 230, stay_duration_days: 1, note: "Enroute stay" },
        { templeName: "Kanpur Jain Glass Temple", orgName: "Kanpur Jain Sabha", orgCity: "Kanpur", dateTime: "2026-03-22T10:00:00Z", distance_km: 270, stay_duration_days: 4, note: "Dharma Sabha" }
      ]
    }
  ];

  for (const rdata of routesData) {
    const route = await prisma.route.create({
      data: {
        name: rdata.name,
        monkId: monk.id,
        journeyDate: rdata.journeyDate,
        participantMonkIds: [monk.id],
        contactPersonIds: [member.id],
        stops: rdata.stops,
        createdById: member.id,
      }
    });

    // @ts-ignore
    const startLoc = (rdata.stops && rdata.stops.length > 0) ? rdata.stops[0].location : "Unknown Location";

    // Automatically start a Journey for each route to make sure nothing is left blank
    await prisma.journey.create({
      data: {
        routeId: route.id,
        monkId: monk.id,
        status: "PLANNED",
        startedAt: rdata.journeyDate,
        events: {
          create: [
            {
              type: "DEPARTURE",
              note: `Departure planned from ${startLoc}`,
              createdById: member.id,
            }
          ]
        }
      }
    });

    console.log(`Created Route: ${route.name} (${route.id})`);
  }

  console.log("Successfully seeded 5 Monk Routes with full details!");
}

seedRoutes()
  .catch((e) => {
    console.error("Error seeding Monk Routes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
