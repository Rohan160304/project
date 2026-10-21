import { PrismaClient, OrganizationType, OrganizationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function seedCenters() {
  console.log("Starting Jain Centers seeding (No loops, real data)...");

  // Center 1
  await prisma.organization.create({
    data: {
      publicId: "JFCEN201",
      type: OrganizationType.JAIN_CENTER,
      name: "Jain Center of America",
      shortName: "JCA NY",
      trustName: "Jain Center of America, New York",
      trustRegistrationNumber: "JCA-US-1001",
      status: OrganizationStatus.ACTIVE,
      sect: "ALL",
      subSect: "Swetambar, Digambar, Sthanakvasi",
      establishedDate: new Date("1973-05-15"),
      history: "JCA was established in 1973 to provide a place of worship and spiritual growth for the Jain community in New York and surrounding areas.",
      addressLine: "43-11 Ithaca St",
      city: "Elmhurst",
      state: "New York",
      country: "USA",
      pincode: "11373",
      lat: 40.7417,
      lng: -73.8824,
      googleMapsLink: "https://goo.gl/maps/xyz1",
      contactEmail: "info@nyjaincenter.org",
      emergencyContact: "+17184786300",
      is80gEligible: false,
      csrEligible: false,
      hasUpashray: true,
      hasEventHall: true,
      eventHallBookable: true,
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Sunday 10:00 AM - 1:00 PM",
      pathshalaDays: "Sunday",
      facilities: ["Library", "Auditorium", "Pathshala Classrooms", "Dining Hall", "Upashray"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS"],
      instaLink: "https://instagram.com/jcany",
      facebookLink: "https://facebook.com/jcany",
      youtubeLink: "https://youtube.com/jcany",
    }
  });
  console.log("Created Center: Jain Center of America");

  // Center 2
  await prisma.organization.create({
    data: {
      publicId: "JFCEN202",
      type: OrganizationType.JAIN_CENTER,
      name: "Jain Center of Southern California",
      shortName: "JCSC",
      trustName: "Jain Center of Southern California",
      trustRegistrationNumber: "JCSC-US-1002",
      status: OrganizationStatus.ACTIVE,
      sect: "ALL",
      subSect: "Swetambar, Digambar",
      establishedDate: new Date("1979-08-20"),
      history: "JCSC serves as a focal point for Jain spiritual and cultural activities in Southern California, promoting non-violence, peace, and harmony.",
      addressLine: "8072 Commonwealth Ave",
      city: "Buena Park",
      state: "California",
      country: "USA",
      pincode: "90621",
      lat: 33.8732,
      lng: -117.9943,
      googleMapsLink: "https://goo.gl/maps/xyz2",
      contactEmail: "info@jaincenter.net",
      emergencyContact: "+17146709972",
      is80gEligible: false,
      csrEligible: false,
      hasUpashray: true,
      hasEventHall: true,
      eventHallBookable: true,
      hasBhojanshala: true,
      bhojanshalaPublished: true,
      bhojanshalaAvailability: "Weekends Only",
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Sunday 09:30 AM - 12:30 PM",
      pathshalaDays: "Sunday",
      facilities: ["Ahimsa Hall", "Cultural Center", "Library", "Senior Center"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS", "BHOJANSHALA"],
      instaLink: "https://instagram.com/jcsc",
      facebookLink: "https://facebook.com/jcsc",
      youtubeLink: "https://youtube.com/jcsc",
    }
  });
  console.log("Created Center: Jain Center of Southern California");

  // Center 3
  await prisma.organization.create({
    data: {
      publicId: "JFCEN203",
      type: OrganizationType.JAIN_CENTER,
      name: "Jain Center of Greater Boston",
      shortName: "JCGB",
      trustName: "Jain Center of Greater Boston",
      trustRegistrationNumber: "JCGB-US-1003",
      status: OrganizationStatus.ACTIVE,
      sect: "ALL",
      subSect: "Swetambar, Digambar",
      establishedDate: new Date("1973-10-10"),
      history: "JCGB was founded to preserve and share the Jain way of life in the Greater Boston area. It provides a common platform for all Jain traditions.",
      addressLine: "556 Nichols St",
      city: "Norwood",
      state: "Massachusetts",
      country: "USA",
      pincode: "02062",
      lat: 42.1946,
      lng: -71.1995,
      googleMapsLink: "https://goo.gl/maps/xyz3",
      contactEmail: "info@jcgb.org",
      emergencyContact: "+17817625123",
      is80gEligible: false,
      csrEligible: false,
      hasUpashray: true,
      hasEventHall: true,
      eventHallBookable: false,
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Sunday 10:00 AM - 12:00 PM",
      pathshalaDays: "Sunday",
      facilities: ["Temple", "Community Hall", "Library"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS"],
      instaLink: "https://instagram.com/jcgb",
      facebookLink: "https://facebook.com/jcgb",
      youtubeLink: "https://youtube.com/jcgb",
    }
  });
  console.log("Created Center: Jain Center of Greater Boston");

  // Center 4
  await prisma.organization.create({
    data: {
      publicId: "JFCEN204",
      type: OrganizationType.JAIN_CENTER,
      name: "Jain Society of Metropolitan Chicago",
      shortName: "JSMC",
      trustName: "Jain Society of Metropolitan Chicago",
      trustRegistrationNumber: "JSMC-US-1004",
      status: OrganizationStatus.ACTIVE,
      sect: "ALL",
      subSect: "Swetambar, Digambar",
      establishedDate: new Date("1970-02-14"),
      history: "JSMC is one of the oldest Jain centers in North America, built to foster Jain philosophy, education, and community bonding in the Midwest.",
      addressLine: "435 N Route 59",
      city: "Bartlett",
      state: "Illinois",
      country: "USA",
      pincode: "60103",
      lat: 41.9961,
      lng: -88.2045,
      googleMapsLink: "https://goo.gl/maps/xyz4",
      contactEmail: "info@jsmconline.org",
      emergencyContact: "+16308373222",
      is80gEligible: false,
      csrEligible: false,
      hasUpashray: true,
      hasEventHall: true,
      eventHallBookable: true,
      hasBhojanshala: true,
      bhojanshalaPublished: true,
      bhojanshalaAvailability: "Weekends & Special Events",
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Saturday & Sunday",
      pathshalaDays: "Saturday, Sunday",
      facilities: ["Temple", "Auditorium", "Library", "Dining Hall", "Youth Center"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS", "BHOJANSHALA"],
      instaLink: "https://instagram.com/jsmc",
      facebookLink: "https://facebook.com/jsmc",
      youtubeLink: "https://youtube.com/jsmc",
    }
  });
  console.log("Created Center: Jain Society of Metropolitan Chicago");

  // Center 5
  await prisma.organization.create({
    data: {
      publicId: "JFCEN205",
      type: OrganizationType.JAIN_CENTER,
      name: "Jain Vishva Bharati London",
      shortName: "JVB London",
      trustName: "JVB London Trust",
      trustRegistrationNumber: "JVB-UK-1005",
      status: OrganizationStatus.ACTIVE,
      sect: "Shwetambar",
      subSect: "Terapanth",
      establishedDate: new Date("2003-04-10"),
      history: "JVB London aims to propagate the teachings of Jainism, Preksha Meditation, and Science of Living. It offers regular meditation classes and spiritual retreats.",
      addressLine: "Oshwal Centre, Coopers Lane Road",
      city: "Potters Bar",
      state: "Hertfordshire",
      country: "UK",
      pincode: "EN6 4DG",
      lat: 51.7061,
      lng: -0.1654,
      googleMapsLink: "https://goo.gl/maps/xyz5",
      contactEmail: "info@jvblondon.org",
      emergencyContact: "+442081234567",
      is80gEligible: false,
      csrEligible: false,
      hasUpashray: true,
      hasEventHall: true,
      eventHallBookable: true,
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Sunday 11:00 AM - 1:00 PM",
      pathshalaDays: "Sunday",
      facilities: ["Meditation Hall", "Library", "Study Rooms"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS"],
      instaLink: "https://instagram.com/jvblondon",
      facebookLink: "https://facebook.com/jvblondon",
      youtubeLink: "https://youtube.com/jvblondon",
    }
  });
  console.log("Created Center: Jain Vishva Bharati London");

  console.log("Successfully seeded 5 Jain Centers (Original data, fully populated)!");
}

seedCenters()
  .catch((e) => {
    console.error("Error seeding Jain Centers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
