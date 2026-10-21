import { PrismaClient, FeedPostType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedCommunities() {
  console.log("Starting Community Pages seeding (5-7 Complete Profiles with operations)...");

  // Fetch a category to link to
  let category = await prisma.communityPageCategory.findFirst({
    where: { name: 'Trust' }
  });
  
  if (!category) {
    category = await prisma.communityPageCategory.create({
      data: { name: 'Trust' }
    });
  }

  let youthCategory = await prisma.communityPageCategory.findFirst({
    where: { name: 'Youth Group' }
  });
  if (!youthCategory) {
    youthCategory = await prisma.communityPageCategory.create({
      data: { name: 'Youth Group' }
    });
  }

  let mahilaCategory = await prisma.communityPageCategory.findFirst({
    where: { name: 'Mahila Mandal' }
  });
  if (!mahilaCategory) {
    mahilaCategory = await prisma.communityPageCategory.create({
      data: { name: 'Mahila Mandal' }
    });
  }

  // Delete previous test communities if any
  await prisma.communityPage.deleteMany({
    where: {
      publicId: {
        in: ["JFC001", "JFC002", "JFC003", "JFC004", "JFC005", "JFC006"]
      }
    }
  });

  const communities = [
    {
      publicId: "JFC001",
      name: "Jain Youth Forum India",
      shortName: "JYFI",
      logoUrl: "https://example.com/jyfi-logo.jpg",
      bannerUrl: "https://example.com/jyfi-banner.jpg",
      about: "A dynamic platform uniting Jain youth across India to foster cultural values, social service, and professional networking. We conduct numerous events throughout the year focusing on spiritual growth and leadership.",
      categoryId: youthCategory.id,
      contacts: {
        phone: "+91 9876543210",
        email: "contact@jyfi.org",
        website: "https://jyfi.org"
      },
      socialLinks: {
        instagram: "https://instagram.com/jyfi_india",
        facebook: "https://facebook.com/jyfiindia",
        twitter: "https://twitter.com/jyfi"
      },
      visibilityConfig: {
        isPublic: true,
        showInDirectory: true
      },
      joinApprovalMode: "AUTO",
      orgType: "Non-Profit Youth Organization",
      establishedYear: 2010,
      operatesFrom: "Mumbai, Maharashtra",
      officeAddress: "101, Mahavir Chambers, Dalal Street, Fort, Mumbai",
      googleMapsUrl: "https://maps.google.com/?q=101+Mahavir+Chambers+Mumbai",
      googleFormName: "Join JYFI Core Team",
      googleFormLink: "https://forms.gle/xyz123",
      gallery: [
        { url: "https://example.com/jyfi1.jpg", caption: "Youth Camp 2023" },
        { url: "https://example.com/jyfi2.jpg", caption: "Blood Donation Drive" }
      ],
      communityVisibility: "PUBLIC",
      geoVisibility: "National",
      geoCountry: "India"
    },
    {
      publicId: "JFC002",
      name: "Samast Jain Mahila Mandal",
      shortName: "SJMM",
      logoUrl: "https://example.com/sjmm-logo.jpg",
      bannerUrl: "https://example.com/sjmm-banner.jpg",
      about: "Empowering Jain women through education, cultural preservation, and entrepreneurship. We run pathshalas, skill development centers, and organize religious congregations.",
      categoryId: mahilaCategory.id,
      contacts: {
        phone: "+91 8877665544",
        email: "info@mahilamandal.org",
        website: "https://mahilamandal.org"
      },
      socialLinks: {
        facebook: "https://facebook.com/sjmm"
      },
      visibilityConfig: {
        isPublic: true,
        showInDirectory: true
      },
      joinApprovalMode: "MANUAL",
      orgType: "Women's Organization",
      establishedYear: 1995,
      operatesFrom: "Ahmedabad, Gujarat",
      officeAddress: "Sarkar Wadi, Ashram Road, Ahmedabad",
      googleMapsUrl: "https://maps.google.com/?q=Ashram+Road+Ahmedabad",
      googleFormName: "Membership Registration",
      googleFormLink: "https://forms.gle/abc456",
      gallery: [
        { url: "https://example.com/sjmm1.jpg", caption: "Navkar Mantra Jaap" }
      ],
      communityVisibility: "PUBLIC",
      geoVisibility: "State",
      geoState: "Gujarat",
      geoCountry: "India"
    },
    {
      publicId: "JFC003",
      name: "Jain Social Group Int. Federation",
      shortName: "JSG",
      logoUrl: "https://example.com/jsg-logo.jpg",
      bannerUrl: "https://example.com/jsg-banner.jpg",
      about: "A global federation of Jain Social Groups. Promoting fellowship, brotherhood and service. We connect families globally, running numerous philanthropic and networking chapters.",
      categoryId: category.id,
      contacts: {
        phone: "+91 9988776655",
        email: "admin@jsgif.com",
        website: "https://jsgif.com"
      },
      socialLinks: {
        linkedin: "https://linkedin.com/company/jsg",
        instagram: "https://instagram.com/jsg_global"
      },
      visibilityConfig: {
        isPublic: true,
        showInDirectory: true
      },
      joinApprovalMode: "AUTO",
      orgType: "Federation",
      establishedYear: 1980,
      operatesFrom: "Global",
      officeAddress: "JSG Bhavan, C.P. Tank, Mumbai",
      googleMapsUrl: "https://maps.google.com/?q=CP+Tank+Mumbai",
      googleFormName: "Start a New Chapter",
      googleFormLink: "https://forms.gle/jsg123",
      gallery: [
        { url: "https://example.com/jsg1.jpg", caption: "Annual Global Summit" },
        { url: "https://example.com/jsg2.jpg", caption: "Community Service" }
      ],
      communityVisibility: "PUBLIC",
      geoVisibility: "Global"
    },
    {
      publicId: "JFC004",
      name: "Veerayatan International",
      shortName: "Veerayatan",
      logoUrl: "https://example.com/veerayatan-logo.jpg",
      bannerUrl: "https://example.com/veerayatan-banner.jpg",
      about: "A non-profit organization founded by Acharya Shri Chandanaji. Focused on Seva (Service), Shiksha (Education), and Sadhana (Spiritual Development) cutting across cast, creed, and religion.",
      categoryId: category.id,
      contacts: {
        phone: "+91 7766554433",
        email: "info@veerayatan.org",
        website: "https://veerayatan.org"
      },
      socialLinks: {
        youtube: "https://youtube.com/veerayatan",
        facebook: "https://facebook.com/veerayatan"
      },
      visibilityConfig: {
        isPublic: true,
        showInDirectory: true
      },
      joinApprovalMode: "MANUAL",
      orgType: "NGO / Trust",
      establishedYear: 1973,
      operatesFrom: "Rajgir, Bihar",
      officeAddress: "Veerayatan Vidyapeeth, Rajgir, Nalanda, Bihar",
      googleMapsUrl: "https://maps.google.com/?q=Veerayatan+Rajgir",
      googleFormName: "Volunteer Application",
      googleFormLink: "https://forms.gle/veerayatan_vol",
      gallery: [
        { url: "https://example.com/veerayatan1.jpg", caption: "Eye Camp in Kutch" },
        { url: "https://example.com/veerayatan2.jpg", caption: "Educational Campus" }
      ],
      communityVisibility: "PUBLIC",
      geoVisibility: "Global"
    },
    {
      publicId: "JFC005",
      name: "JITO - Jain International Trade Organisation",
      shortName: "JITO",
      logoUrl: "https://example.com/jito-logo.jpg",
      bannerUrl: "https://example.com/jito-banner.jpg",
      about: "JITO is a worldwide organisation of Jain businessmen, industrialists, knowledge workers and professionals reflecting the glory of ethical business practices.",
      categoryId: category.id,
      contacts: {
        phone: "+91 22 12345678",
        email: "contact@jito.org",
        website: "https://jito.org"
      },
      socialLinks: {
        linkedin: "https://linkedin.com/company/jito",
        twitter: "https://twitter.com/jito_org"
      },
      visibilityConfig: {
        isPublic: true,
        showInDirectory: true
      },
      joinApprovalMode: "MANUAL",
      orgType: "Professional Network",
      establishedYear: 2007,
      operatesFrom: "Mumbai, Global",
      officeAddress: "Andheri East, Mumbai, Maharashtra",
      googleMapsUrl: "https://maps.google.com/?q=JITO+Mumbai",
      googleFormName: "Membership Enquiry",
      googleFormLink: "https://forms.gle/jito123",
      gallery: [
        { url: "https://example.com/jito1.jpg", caption: "JITO Connect Event" }
      ],
      communityVisibility: "PUBLIC",
      geoVisibility: "Global"
    },
    {
      publicId: "JFC006",
      name: "Young Jains of America (YJA)",
      shortName: "YJA",
      logoUrl: "https://example.com/yja-logo.jpg",
      bannerUrl: "https://example.com/yja-banner.jpg",
      about: "Young Jains of America (YJA) is an entity of JAINA that serves Jain youth from ages 14-29 across North America. We hold regional retreats, national conventions, and community service projects.",
      categoryId: youthCategory.id,
      contacts: {
        email: "info@yja.org",
        website: "https://yja.org"
      },
      socialLinks: {
        instagram: "https://instagram.com/yja",
        facebook: "https://facebook.com/youngjains"
      },
      visibilityConfig: {
        isPublic: true,
        showInDirectory: true
      },
      joinApprovalMode: "AUTO",
      orgType: "Youth Organization",
      establishedYear: 1991,
      operatesFrom: "North America",
      officeAddress: "USA",
      googleMapsUrl: "https://maps.google.com/?q=USA",
      googleFormName: "Convention Registration",
      googleFormLink: "https://forms.gle/yja2024",
      gallery: [
        { url: "https://example.com/yja1.jpg", caption: "YJA Convention 2024" }
      ],
      communityVisibility: "PUBLIC",
      geoVisibility: "Regional",
      geoCountry: "USA"
    }
  ];

  for (const community of communities) {
    const createdCommunity = await prisma.communityPage.create({
      data: community
    });
    console.log(`Created Community Page: ${community.name}`);

    // Create an operation (e.g. a Feed Post) for the first community to demonstrate
    if (community.publicId === "JFC001") {
      await prisma.feedPost.create({
        data: {
          communityPageId: createdCommunity.id,
          type: FeedPostType.MANUAL,
          title: "Upcoming Youth Leadership Camp 2024",
          description: "We are thrilled to announce the upcoming Jain Youth Leadership Camp! Join us for a weekend of spiritual growth, networking, and leadership training. Limited seats available.",
          coverUrl: "https://example.com/jyfi-camp-cover.jpg",
          externalLink: "https://jyfi.org/camp2024",
          isActive: true,
        }
      });
      console.log(` -> Created a FeedPost for ${community.name}`);
    }
    
    // Create an operation (e.g. a Feed Post) for Veerayatan
    if (community.publicId === "JFC004") {
      await prisma.feedPost.create({
        data: {
          communityPageId: createdCommunity.id,
          type: FeedPostType.MANUAL,
          title: "Mega Eye Camp successfully completed",
          description: "With the blessings of Acharya Shri Chandana Ji, we successfully completed the mega eye camp in Kutch, restoring vision to over 500 individuals. Thank you to all the doctors and volunteers!",
          coverUrl: "https://example.com/veerayatan-eye-camp.jpg",
          isActive: true,
        }
      });
      console.log(` -> Created a FeedPost for ${community.name}`);
    }
  }

  console.log("Successfully seeded 6 Community Pages with complete details and operations!");
}

seedCommunities()
  .catch((e) => {
    console.error("Error seeding Community Pages:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
