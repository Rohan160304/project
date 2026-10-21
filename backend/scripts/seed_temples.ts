import { PrismaClient, OrganizationType } from "@prisma/client";

const prisma = new PrismaClient();

const templesData = [
  {
    publicId: "JFJT109",
    name: "Shri Ranakpur Jain Temple",
    shortName: "Ranakpur Temple",
    trustName: "Seth Anandji Kalyanji Trust",
    city: "Ranakpur",
    state: "Rajasthan",
    pincode: "306702",
    addressLine: "Desuri Tehsil, Pali District",
    lat: 25.1158,
    lng: 73.4715,
    contactEmail: "info@ranakpurtemple.com",
    emergencyContact: "+919876543210",
    establishedYear: 1437,
    templeMulNayakName: "Shri Adinath Bhagwan",
    templeOpeningHours: "06:00 AM - 08:00 PM",
    templePakshalStart: "06:30 AM",
    templePoojaStart: "07:00 AM",
    templeAartiEvening: "07:00 PM",
    hasBhojanshala: true,
    hasUpashray: true,
  },
  {
    publicId: "JFJT110",
    name: "Shri Dilwara Jain Temples",
    shortName: "Dilwara Temples",
    trustName: "Shri Dilwara Trust",
    city: "Mount Abu",
    state: "Rajasthan",
    pincode: "307501",
    addressLine: "Delwara, Mount Abu",
    lat: 24.6062,
    lng: 72.7219,
    contactEmail: "contact@dilwaratemples.org",
    emergencyContact: "+919876543211",
    establishedYear: 1031,
    templeMulNayakName: "Shri Vimal Nath Bhagwan",
    templeOpeningHours: "12:00 PM - 05:00 PM",
    templePakshalStart: "06:00 AM",
    templePoojaStart: "07:00 AM",
    templeAartiEvening: "06:30 PM",
    hasBhojanshala: false,
    hasUpashray: true,
  },
  {
    publicId: "JFJT111",
    name: "Shri Palitana Temples",
    shortName: "Palitana",
    trustName: "Shri Anandji Kalyanji Trust",
    city: "Palitana",
    state: "Gujarat",
    pincode: "364270",
    addressLine: "Shatrunjaya Hill, Palitana",
    lat: 21.5174,
    lng: 71.8277,
    contactEmail: "info@palitanatemples.org",
    emergencyContact: "+919876543212",
    establishedYear: 1200,
    templeMulNayakName: "Shri Adinath Bhagwan",
    templeOpeningHours: "06:00 AM - 06:00 PM",
    templePakshalStart: "06:00 AM",
    templePoojaStart: "07:00 AM",
    templeAartiEvening: "06:00 PM",
    hasBhojanshala: true,
    hasUpashray: true,
  },
  {
    publicId: "JFJT112",
    name: "Shri Mahavirji Temple",
    shortName: "Mahavirji",
    trustName: "Shri Mahavirji Trust",
    city: "Karauli",
    state: "Rajasthan",
    pincode: "322220",
    addressLine: "Shri Mahavirji, Chandanpur",
    lat: 26.6022,
    lng: 76.8404,
    contactEmail: "contact@mahavirjitemple.org",
    emergencyContact: "+919876543213",
    establishedYear: 1632,
    templeMulNayakName: "Shri Mahavir Swami Bhagwan",
    templeOpeningHours: "05:00 AM - 09:00 PM",
    templePakshalStart: "05:30 AM",
    templePoojaStart: "06:30 AM",
    templeAartiEvening: "07:30 PM",
    hasBhojanshala: true,
    hasUpashray: true,
  },
  {
    publicId: "JFJT113",
    name: "Shri Girnar Jain Temples",
    shortName: "Girnar Temples",
    trustName: "Girnar Jain Trust",
    city: "Junagadh",
    state: "Gujarat",
    pincode: "362001",
    addressLine: "Girnar Hills, Junagadh",
    lat: 21.5222,
    lng: 70.4579,
    contactEmail: "info@girnartemples.org",
    emergencyContact: "+919876543214",
    establishedYear: 1128,
    templeMulNayakName: "Shri Neminath Bhagwan",
    templeOpeningHours: "06:00 AM - 06:00 PM",
    templePakshalStart: "06:00 AM",
    templePoojaStart: "07:00 AM",
    templeAartiEvening: "06:30 PM",
    hasBhojanshala: true,
    hasUpashray: true,
  }
];

async function seedTemples() {
  console.log("Starting Real Temple seeding...");

  // Get a member to link as contact/volunteer/trustee
  let member = await prisma.member.findFirst({ where: { deletedAt: null } });
  if (!member) {
    throw new Error("No member found in DB. Please seed members first!");
  }

  // Get Community and SubCommunity
  const shwetambar = await prisma.community.findFirst({ where: { name: "Shwetambar" } });
  const murtipujak = await prisma.subCommunity.findFirst({ where: { name: "Murtipujak" } });
  
  // Try to find a Bhagwan for Mul Nayak
  const adinath = await prisma.bhagwanMaster.findFirst({ where: { name: { contains: "Adinath", mode: "insensitive" } } });
  const mahavir = await prisma.bhagwanMaster.findFirst({ where: { name: { contains: "Mahavir", mode: "insensitive" } } });

  for (const tdata of templesData) {
    let bhagwanId = null;
    if (tdata.templeMulNayakName.includes("Adinath") && adinath) bhagwanId = adinath.id;
    if (tdata.templeMulNayakName.includes("Mahavir") && mahavir) bhagwanId = mahavir.id;

    // Create the organization
    const org = await prisma.organization.create({
      data: {
        publicId: tdata.publicId,
        type: OrganizationType.TEMPLE,
        name: tdata.name,
        shortName: tdata.shortName,
        trustName: tdata.trustName,
        trustRegistrationNumber: `E-${Math.floor(1000 + Math.random() * 9000)}/${tdata.city.toUpperCase()}`,
        status: "ACTIVE",
        communityId: shwetambar?.id,
        subCommunityId: murtipujak?.id,
        establishedDate: new Date(`${tdata.establishedYear}-01-01T00:00:00Z`),
        addressLine: tdata.addressLine,
        city: tdata.city,
        state: tdata.state,
        country: "India",
        pincode: tdata.pincode,
        lat: tdata.lat,
        lng: tdata.lng,
        contactEmail: tdata.contactEmail,
        emergencyContact: tdata.emergencyContact,
        primaryContactMemberId: member.id,
        templeMulNayakName: tdata.templeMulNayakName,
        mulNayakBhagwanId: bhagwanId,
        templeOpeningHours: tdata.templeOpeningHours,
        templePakshalStart: tdata.templePakshalStart,
        templePoojaStart: tdata.templePoojaStart,
        templeAartiEvening: tdata.templeAartiEvening,
        hasBhojanshala: tdata.hasBhojanshala,
        bhojanshalaPublished: tdata.hasBhojanshala,
        hasUpashray: tdata.hasUpashray,
        hasTempleInside: false,
        activeModules: ["TEMPLES", "DONATIONS", "EVENTS", "NOTICES", "ANNOUNCEMENTS"],
        is80gEligible: true,
        csrEligible: true,
        createdById: member.id,
        
        // Nested Relations - ALL DETAILS ADDED
        notices: {
          create: [
            {
              title: "Temple Timings Changed",
              body: "Winter timings will be applicable from next week. Pakshal will start 15 mins late.",
              isPinned: true,
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            {
              title: "Donation Request",
              body: "We are collecting funds for the upcoming Dhaja Mohotsav.",
              isPinned: false
            }
          ]
        },
        announcements: {
          create: [
            {
              title: "Dhaja Mohotsav",
              body: "Join us for the annual Dhaja Mohotsav next month."
            }
          ]
        },
        contacts: {
          create: [
            {
              role: "Manager",
              memberId: member.id
            }
          ]
        },
        trustees: {
          create: [
            {
              designation: "President",
              memberId: member.id
            },
            {
              designation: "Secretary",
              memberId: member.id
            }
          ]
        },
        volunteers: {
          create: [
            {
              memberId: member.id,
              area: "Coordinator"
            }
          ]
        },
        dhajaRecords: {
          create: [
            {
              year: 2025,
              dhajaDate: new Date("2025-03-15T00:00:00Z"),
              descriptionEn: "Completed Dhaja for the main sikhar.",
              dhajaOf: "Main Sikhar"
            }
          ]
        },
        gallery: {
          create: [
            {
              imageUrl: "https://example.com/temple-front.jpg",
              order: 1
            },
            {
              imageUrl: "https://example.com/temple-idol.jpg",
              order: 2
            }
          ]
        },
        socialLinks: {
          create: [
            { platform: "YOUTUBE", url: "https://youtube.com/temple" },
            { platform: "FACEBOOK", url: "https://facebook.com/temple" }
          ]
        }
      }
    });

    console.log(`Created Temple: ${org.name} (${org.publicId})`);
  }

  console.log("Successfully seeded 5 Temples with full details!");
}

seedTemples()
  .catch((e) => {
    console.error("Error seeding Temples:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
