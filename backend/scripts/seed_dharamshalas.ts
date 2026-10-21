import { PrismaClient, OrganizationType } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const generateAmenities = (type: string) => {
  if (type === "AC_ROOM") {
    return ["WIFI", "AC", "GEYSER", "TV", "ROOM_SERVICE", "LAUNDRY", "PARKING"];
  }
  return ["WIFI", "GEYSER", "PARKING"];
};

const dharamshalasData = [
  {
    publicId: "JFD109",
    name: "Shri Sammed Shikharji Digambar Jain Dharamshala",
    shortName: "Shikharji Dharamshala",
    trustName: "Shri Sammed Shikharji Trust",
    city: "Madhuban",
    state: "Jharkhand",
    pincode: "828108",
    addressLine: "Near Taleti, Shikharji Road",
    lat: 23.9576,
    lng: 86.0319,
    dharamshalaPhone: "+919000100011",
    contactEmail: "booking@shikharji-dharamshala.org",
    cancellationPolicy: "Cancellation allowed 3 days prior with 10% deduction.",
    buildings: [
      {
        name: "Main Building",
        wings: [
          { name: "Ground Floor", rooms: 10, start: 101, isAc: false, price: 500, cap: 2 },
          { name: "First Floor", rooms: 10, start: 201, isAc: true, price: 1200, cap: 3 }
        ]
      },
      {
        name: "Yatri Niwas",
        wings: [
          { name: "A Wing", rooms: 5, start: 101, isAc: false, price: 600, cap: 4 }
        ]
      }
    ]
  },
  {
    publicId: "JFD110",
    name: "Shri Palitana Shwetambar Jain Dharamshala",
    shortName: "Palitana Dharamshala",
    trustName: "Shri Anandji Kalyanji Trust",
    city: "Palitana",
    state: "Gujarat",
    pincode: "364270",
    addressLine: "Taleti Road, Palitana",
    lat: 21.5174,
    lng: 71.8277,
    dharamshalaPhone: "+919000200022",
    contactEmail: "info@palitanadharamshala.org",
    cancellationPolicy: "Strict no refund on cancellation.",
    buildings: [
      {
        name: "Sethani Bhawan",
        wings: [
          { name: "East Wing", rooms: 12, start: 101, isAc: true, price: 1500, cap: 2 },
          { name: "West Wing", rooms: 12, start: 201, isAc: true, price: 1800, cap: 4 }
        ]
      }
    ]
  },
  {
    publicId: "JFD111",
    name: "Shri Girnarji Jain Yatri Niwas",
    shortName: "Girnar Yatri Niwas",
    trustName: "Girnar Jain Trust",
    city: "Junagadh",
    state: "Gujarat",
    pincode: "362001",
    addressLine: "Bhavnath Taleti, Girnar",
    lat: 21.5222,
    lng: 70.4579,
    dharamshalaPhone: "+919000300033",
    contactEmail: "contact@girnaryatriniwas.com",
    cancellationPolicy: "100% refund up to 24 hours.",
    buildings: [
      {
        name: "Tirthankar Bhawan",
        wings: [
          { name: "Block A", rooms: 8, start: 101, isAc: false, price: 400, cap: 2 },
          { name: "Block B", rooms: 6, start: 201, isAc: true, price: 1000, cap: 3 }
        ]
      }
    ]
  },
  {
    publicId: "JFD112",
    name: "Shri Pavapuri Jal Mandir Dharamshala",
    shortName: "Pavapuri Dharamshala",
    trustName: "Pavapuri Jain Trust",
    city: "Pavapuri",
    state: "Bihar",
    pincode: "803115",
    addressLine: "Near Jal Mandir",
    lat: 25.0744,
    lng: 85.5393,
    dharamshalaPhone: "+919000400044",
    contactEmail: "bookings@pavapuri.org",
    cancellationPolicy: "50% refund on cancellations.",
    buildings: [
      {
        name: "Nirvana Bhawan",
        wings: [
          { name: "South Wing", rooms: 15, start: 101, isAc: true, price: 1400, cap: 2 }
        ]
      },
      {
        name: "Pilgrim Block",
        wings: [
          { name: "North Wing", rooms: 10, start: 101, isAc: false, price: 600, cap: 4 }
        ]
      }
    ]
  },
  {
    publicId: "JFD113",
    name: "Shri Ranakpur Tirth Dharamshala",
    shortName: "Ranakpur Yatri Yatri",
    trustName: "Ranakpur Temple Trust",
    city: "Ranakpur",
    state: "Rajasthan",
    pincode: "306702",
    addressLine: "Near Ranakpur Jain Temple",
    lat: 25.1143,
    lng: 73.4716,
    dharamshalaPhone: "+919000500055",
    contactEmail: "ranakpur@dharamshala.in",
    cancellationPolicy: "No cancellation allowed.",
    buildings: [
      {
        name: "Adinath Bhawan",
        wings: [
          { name: "Wing 1", rooms: 20, start: 1001, isAc: true, price: 2000, cap: 2 }
        ]
      }
    ]
  }
];

const seedDharamshalas = async () => {
  try {
    console.log("Starting Real Dharamshala seeding...");

    const createdDharamshalas = [];

    for (const ddata of dharamshalasData) {
      
      const organization = await prisma.organization.create({
        data: {
          publicId: ddata.publicId,
          type: OrganizationType.DHARAMSHALA,
          name: ddata.name,
          shortName: ddata.shortName,
          trustName: ddata.trustName,
          status: "ACTIVE",
          addressLine: ddata.addressLine,
          city: ddata.city,
          state: ddata.state,
          country: "India",
          pincode: ddata.pincode,
          lat: ddata.lat,
          lng: ddata.lng,
          hasDharamshala: true,
          dharamshalaPublished: true,
          checkInTime: "12:00 PM",
          checkOutTime: "11:00 AM",
          advanceBookingRequired: true,
          onlineBookingAvailable: true,
          dharamshalaPhone: ddata.dharamshalaPhone,
          contactEmail: ddata.contactEmail,
          contactMobileVerified: true,
          contactEmailVerified: true,
          rulesText: "Strictly Jain food only. Alcohol, smoking, and leather items are prohibited.",
          dharamshalaSettings: {
            create: {
              cancellationPolicy: ddata.cancellationPolicy,
              receiptTerms: "Please present this receipt at the time of check-in with a valid Govt ID.",
              receiptFooter: "Thank you for visiting. Jai Jinendra.",
              bankDetails: JSON.stringify({ bank: "HDFC", acc: `1234567890_${ddata.publicId}`, ifsc: "HDFC0001234" }),
              upiDetails: `${ddata.publicId.toLowerCase()}@ybl`,
            }
          },
          accommodationRules: {
            create: [
              { ruleType: "JAIN_ONLY", notes: "Only practicing Jains allowed." },
              { ruleType: "NO_PETS", notes: "Pets are strictly prohibited." },
              { ruleType: "NO_SMOKING", notes: "Smoking is not allowed on premises." }
            ]
          },
          notices: {
            create: [
              { title: `${ddata.city} Yatra Update`, body: "Bookings for the upcoming parikrama are open.", isPinned: true },
              { title: `Dining Timings`, body: "Bhojanshala timings: Lunch 11AM-1PM, Dinner 5PM-Sunset.", isPinned: false }
            ]
          },
          announcements: {
            create: [
              { title: "Special Aangi", body: "Special Aangi decoration tomorrow morning." },
              { title: "Donation Request", body: "Contribute to the Gaushala fund." }
            ]
          }
        }
      });

      console.log(`Created Dharamshala: ${organization.name} (${organization.id})`);

      const resBuildings = [];
      for (const bdata of ddata.buildings) {
        const building = await prisma.building.create({
          data: {
            organizationId: organization.id,
            name: bdata.name,
          }
        });

        const resWings = [];
        for (const wdata of bdata.wings) {
          const wing = await prisma.wing.create({
            data: {
              buildingId: building.id,
              name: wdata.name,
            }
          });

          const rooms = [];
          for (let r = 0; r < wdata.rooms; r++) {
            const roomType = "ROOM"; 
            const roomNumberStr = `${wdata.start + r}`;
            const room = await prisma.roomOrHall.create({
              data: {
                wingId: wing.id,
                name: `Room ${roomNumberStr}`,
                roomNumber: roomNumberStr,
                type: roomType,
                capacity: wdata.cap,
                pricePerUnit: wdata.price,
                currency: "INR",
                amenities: JSON.stringify(generateAmenities(wdata.isAc ? "AC_ROOM" : "NON_AC_ROOM")),
                status: "AVAILABLE",
                bedType: wdata.cap === 2 ? "DOUBLE" : (wdata.cap === 3 ? "TRIPLE" : "SINGLE"),
                attachedBathroom: "YES",
                category: wdata.isAc ? "AC" : "Non-AC",
              }
            });
            rooms.push({ id: room.id, name: room.name, type: room.category, price: room.pricePerUnit });
          }
          resWings.push({ id: wing.id, name: wing.name, roomsCount: rooms.length, rooms });
        }
        resBuildings.push({ id: building.id, name: building.name, wings: resWings });
      }

      createdDharamshalas.push({
        organizationId: organization.id,
        publicId: organization.publicId,
        name: organization.name,
        noticesCount: 2,
        announcementsCount: 2,
        buildings: resBuildings
      });
    }

    console.log("Seeding completed successfully.");

    // Write output to file
    const outputData = JSON.stringify(createdDharamshalas, null, 2);
    fs.writeFileSync("/Users/sde/Documents/SDEJOB/JiNANAM Community/dara/dharamshalas_seed_real.json", outputData);
    console.log("Seed data summary written to /Users/sde/Documents/SDEJOB/JiNANAM Community/dara/dharamshalas_seed_real.json");

  } catch (error) {
    console.error("Error seeding Dharamshalas:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seedDharamshalas();
