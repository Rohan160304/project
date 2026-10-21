import { PrismaClient, OrganizationType, OrganizationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSthanaks() {
  console.log("Starting Sthanak seeding (No loops, real data)...");

  // Sthanak 1
  await prisma.organization.create({
    data: {
      publicId: "JFSTH301",
      type: OrganizationType.STHANAK,
      name: "Shri SS Jain Sthanak (Ludhiana)",
      shortName: "Jain Sthanak Ludhiana",
      trustName: "SS Jain Sabha Ludhiana",
      trustRegistrationNumber: "STH-PB-1001",
      status: OrganizationStatus.ACTIVE,
      sect: "Shwetambar",
      subSect: "Sthanakvasi",
      establishedDate: new Date("1952-04-10"),
      history: "Established in 1952, this is one of the largest Sthanaks in Punjab, hosting many Chaturmas events for esteemed Sadhu and Sadhvis.",
      addressLine: "Civil Lines, Near Clock Tower",
      city: "Ludhiana",
      state: "Punjab",
      country: "India",
      pincode: "141001",
      lat: 30.9084,
      lng: 75.8486,
      googleMapsLink: "https://goo.gl/maps/sth1",
      contactEmail: "info@jainsthanakludhiana.org",
      emergencyContact: "+911612445566",
      is80gEligible: true,
      csrEligible: false,
      hasUpashray: true,
      upashrayLocation: "Ground Floor & First Floor",
      hasEventHall: true,
      eventHallBookable: true,
      eventHallPurpose: "Pravachan, Religious Gatherings",
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Sunday 09:00 AM - 11:30 AM",
      pathshalaDays: "Sunday",
      facilities: ["Pravachan Hall", "Upashray", "Library", "Aayambil Khata"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS"],
      instaLink: "https://instagram.com/jainsthanakludhiana",
      facebookLink: "https://facebook.com/jainsthanakludhiana",
      youtubeLink: "https://youtube.com/jainsthanakludhiana",
    }
  });
  console.log("Created Sthanak: Shri SS Jain Sthanak (Ludhiana)");

  // Sthanak 2
  await prisma.organization.create({
    data: {
      publicId: "JFSTH302",
      type: OrganizationType.STHANAK,
      name: "Shri Vardhman Sthanakvasi Jain Shravak Sangh (Pune)",
      shortName: "Pune Jain Sthanak",
      trustName: "Vardhman Sthanakvasi Trust Pune",
      trustRegistrationNumber: "STH-MH-1002",
      status: OrganizationStatus.ACTIVE,
      sect: "Shwetambar",
      subSect: "Sthanakvasi",
      establishedDate: new Date("1968-11-20"),
      history: "A very prominent center for Sthanakvasi Jains in Maharashtra, actively involved in Jivdaya and educational initiatives.",
      addressLine: "Guruwar Peth",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      pincode: "411042",
      lat: 18.5089,
      lng: 73.8631,
      googleMapsLink: "https://goo.gl/maps/sth2",
      contactEmail: "contact@punestanak.in",
      emergencyContact: "+912024478989",
      is80gEligible: true,
      csrEligible: false,
      hasUpashray: true,
      upashrayLocation: "Main Building",
      hasEventHall: true,
      eventHallBookable: false,
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Saturday & Sunday",
      pathshalaDays: "Saturday, Sunday",
      facilities: ["Large Pravachan Hall", "Upashray", "Jivdaya Office"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS"],
      instaLink: "https://instagram.com/punejainsthanak",
      facebookLink: "https://facebook.com/punejainsthanak",
      youtubeLink: "https://youtube.com/punejainsthanak",
    }
  });
  console.log("Created Sthanak: Pune Jain Sthanak");

  // Sthanak 3
  await prisma.organization.create({
    data: {
      publicId: "JFSTH303",
      type: OrganizationType.STHANAK,
      name: "Kandivali East Jain Sthanak",
      shortName: "Kandivali Sthanak",
      trustName: "Kandivali Sthanakvasi Jain Sangh",
      trustRegistrationNumber: "STH-MH-1003",
      status: OrganizationStatus.ACTIVE,
      sect: "Shwetambar",
      subSect: "Sthanakvasi",
      establishedDate: new Date("1985-02-15"),
      history: "Located in the heart of Mumbai's Jain community, facilitating regular Vihars, Goshala support, and daily Swadhyay.",
      addressLine: "Akurli Road, Kandivali East",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400101",
      lat: 19.2064,
      lng: 72.8596,
      googleMapsLink: "https://goo.gl/maps/sth3",
      contactEmail: "kandivalisangh@gmail.com",
      emergencyContact: "+912228876543",
      is80gEligible: true,
      csrEligible: true,
      hasUpashray: true,
      upashrayLocation: "Building A",
      hasEventHall: true,
      eventHallBookable: true,
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Daily 08:00 AM - 09:30 AM",
      pathshalaDays: "Daily",
      facilities: ["Upashray", "Swadhyay Room", "Library", "Pravachan Hall"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS"],
      instaLink: "https://instagram.com/kandivalisthanak",
      facebookLink: "https://facebook.com/kandivalisthanak",
      youtubeLink: "https://youtube.com/kandivalisthanak",
    }
  });
  console.log("Created Sthanak: Kandivali East Jain Sthanak");

  // Sthanak 4
  await prisma.organization.create({
    data: {
      publicId: "JFSTH304",
      type: OrganizationType.STHANAK,
      name: "Delhi Jain Sthanak (Roop Nagar)",
      shortName: "Roop Nagar Sthanak",
      trustName: "Shri SS Jain Sabha Delhi",
      trustRegistrationNumber: "STH-DL-1004",
      status: OrganizationStatus.ACTIVE,
      sect: "Shwetambar",
      subSect: "Sthanakvasi",
      establishedDate: new Date("1960-08-05"),
      history: "A peaceful sanctuary in North Delhi known for its immense library of Jain Agams and peaceful meditation halls.",
      addressLine: "Roop Nagar, Near Kamla Nagar",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110007",
      lat: 28.6835,
      lng: 77.2001,
      googleMapsLink: "https://goo.gl/maps/sth4",
      contactEmail: "admin@roopnagarsthanak.org",
      emergencyContact: "+911144556677",
      is80gEligible: false,
      csrEligible: false,
      hasUpashray: true,
      upashrayLocation: "Within Campus",
      hasEventHall: true,
      eventHallBookable: false,
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Sunday 10:00 AM",
      pathshalaDays: "Sunday",
      facilities: ["Vipassana Center", "Agam Library", "Upashray"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS"],
      instaLink: "https://instagram.com/delhijainsthanak",
      facebookLink: "https://facebook.com/delhijainsthanak",
      youtubeLink: "https://youtube.com/delhijainsthanak",
    }
  });
  console.log("Created Sthanak: Delhi Jain Sthanak (Roop Nagar)");

  // Sthanak 5
  await prisma.organization.create({
    data: {
      publicId: "JFSTH305",
      type: OrganizationType.STHANAK,
      name: "Chennai Sthanakvasi Jain Bhavan",
      shortName: "Chennai Sthanak",
      trustName: "Chennai Sthanakvasi Trust",
      trustRegistrationNumber: "STH-TN-1005",
      status: OrganizationStatus.ACTIVE,
      sect: "Shwetambar",
      subSect: "Sthanakvasi",
      establishedDate: new Date("1975-01-26"),
      history: "Catering to the vast Jain community in South India, facilitating grand religious discourses and medical camps.",
      addressLine: "Vepery High Road",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pincode: "600007",
      lat: 13.0827,
      lng: 80.2707,
      googleMapsLink: "https://goo.gl/maps/sth5",
      contactEmail: "info@chennaisthanak.com",
      emergencyContact: "+914422334455",
      is80gEligible: true,
      csrEligible: true,
      hasUpashray: true,
      upashrayLocation: "Separate Block",
      hasEventHall: true,
      eventHallBookable: true,
      hasPathshala: true,
      pathshalaPublished: true,
      pathshalaTimings: "Saturday 4:00 PM - 6:00 PM",
      pathshalaDays: "Saturday",
      facilities: ["Dispensary", "Pravachan Hall", "Upashray", "Pathshala Block"],
      activeModules: ["PATHSHALA", "EVENTS", "DONATIONS"],
      instaLink: "https://instagram.com/chennaisthanak",
      facebookLink: "https://facebook.com/chennaisthanak",
      youtubeLink: "https://youtube.com/chennaisthanak",
    }
  });
  console.log("Created Sthanak: Chennai Sthanakvasi Jain Bhavan");

  console.log("Successfully seeded 5 Sthanaks (Original data, fully populated)!");
}

seedSthanaks()
  .catch((e) => {
    console.error("Error seeding Sthanaks:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
