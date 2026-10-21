import { PrismaClient, FeedPostType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPollsAndNotices() {
  console.log("Fetching some organizations and community pages to author polls and notices...");

  const orgs = await prisma.organization.findMany({ take: 3 });
  const communityPages = await prisma.communityPage.findMany({ take: 2 });

  if (orgs.length === 0 && communityPages.length === 0) {
    console.log("No organizations or community pages found to author posts.");
    return;
  }

  // --- 1. Seed Polls ---
  console.log("Seeding Polls...");
  
  const pollData = [
    {
      title: "Best time for daily evening Aarti?",
      description: "We are considering changing the evening Aarti timings to accommodate more working professionals.",
      question: "Which timing do you prefer for the daily evening Aarti?",
      options: [
        { id: "opt1", text: "7:00 PM" },
        { id: "opt2", text: "7:30 PM" },
        { id: "opt3", text: "8:00 PM" },
        { id: "opt4", text: "Keep it the same" }
      ],
      allowMultiple: false,
      author: orgs[0] ? { organizationId: orgs[0].id } : { communityPageId: communityPages[0].id }
    },
    {
      title: "Upcoming Sunday Medical Camp Services",
      description: "Please help us prioritize which medical services to offer at our upcoming free camp.",
      question: "Which checkup services are you most interested in?",
      options: [
        { id: "opt1", text: "Eye Checkup" },
        { id: "opt2", text: "Dental Checkup" },
        { id: "opt3", text: "General Physician" },
        { id: "opt4", text: "Blood Sugar & BP" }
      ],
      allowMultiple: true,
      author: communityPages[0] ? { communityPageId: communityPages[0].id } : { organizationId: orgs[0].id }
    },
    {
      title: "Pathshala Curriculum Suggestions",
      description: "We are reviewing our weekend Pathshala syllabus for kids.",
      question: "What topics should we focus more on?",
      options: [
        { id: "opt1", text: "Jain History & Stories" },
        { id: "opt2", text: "Sutra Recitation" },
        { id: "opt3", text: "Practical Jainism (Diet, Compassion)" },
        { id: "opt4", text: "Meditation & Yoga" }
      ],
      allowMultiple: true,
      author: orgs[1] ? { organizationId: orgs[1].id } : { communityPageId: communityPages[0].id }
    }
  ];

  for (const p of pollData) {
    if (!p.author.organizationId && !p.author.communityPageId) continue;

    await prisma.feedPost.create({
      data: {
        ...p.author,
        type: FeedPostType.AUTO,
        sourceModule: "POLLS",
        title: p.title,
        description: p.description,
        isActive: true,
        visibilityConfig: { isPublic: true }, // Needed to be visible in smart feed
        poll: {
          create: {
            question: p.question,
            options: p.options,
            allowMultiple: p.allowMultiple,
            endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        }
      }
    });
    console.log(` -> Created Poll: ${p.title}`);
  }

  // --- 2. Seed Notices ---
  console.log("Seeding Notices...");

  const noticeData = [
    {
      title: "Temple Renovation Update",
      body: "Please note that the main hall will be closed for renovation from Monday to Thursday. Daily pooja will take place in the side hall.",
      organizationId: orgs[0]?.id
    },
    {
      title: "Annual General Meeting",
      body: "All trust members are requested to attend the AGM this coming Sunday at 10 AM in the community hall.",
      organizationId: orgs[1]?.id
    },
    {
      title: "New Bhojanshala Timings",
      body: "Starting next month, the Bhojanshala will open at 11:30 AM for lunch and 5:00 PM for dinner. Please ensure you book your passes in advance.",
      organizationId: orgs[2]?.id
    }
  ];

  for (const n of noticeData) {
    if (!n.organizationId) continue;

    const notice = await prisma.organizationNotice.create({
      data: {
        organizationId: n.organizationId,
        title: n.title,
        body: n.body,
        isPinned: false
      }
    });

    // Mirror to FeedPost as AUTO post
    await prisma.feedPost.create({
      data: {
        organizationId: n.organizationId,
        type: FeedPostType.AUTO,
        sourceModule: "NOTICE",
        sourceId: notice.id,
        title: n.title,
        description: n.body,
        isActive: true,
        visibilityConfig: { isPublic: true } // Needed to be visible in smart feed
      }
    });
    console.log(` -> Created Notice: ${n.title}`);
  }

  console.log("Successfully seeded Polls and Notices! Feed will now have more items.");
}

seedPollsAndNotices()
  .catch((e) => {
    console.error("Error seeding Polls and Notices:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
