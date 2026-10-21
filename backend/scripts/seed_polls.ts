import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPolls() {
  console.log("Starting Polls seeding...");

  // Get a user to act as author
  let user = await prisma.user.findFirst();
  if (!user) {
    throw new Error("No user found in DB. Please seed users first!");
  }

  // Get a few organizations
  const orgs = await prisma.organization.findMany({ take: 3 });
  if (orgs.length === 0) {
    throw new Error("No organizations found in DB. Please seed organizations first!");
  }

  const pollData = [
    {
      question: "What should be the timing for the upcoming Sunday Pravachan?",
      options: ["Morning 8 AM", "Morning 9 AM", "Evening 4 PM"],
      allowMultiple: false,
    },
    {
      question: "Which facility needs immediate improvement in our Dharamshala?",
      options: ["Rooms", "Bhojanshala", "Parking", "Cleanliness"],
      allowMultiple: false,
    },
    {
      question: "Are you planning to attend the upcoming Mahavir Jayanti procession?",
      options: ["Yes, definitely", "No, out of town", "Maybe"],
      allowMultiple: false,
    }
  ];

  for (let i = 0; i < Math.min(orgs.length, pollData.length); i++) {
    const org = orgs[i]!;
    const data = pollData[i]!;

    // Create FeedPost
    const feedPost = await prisma.feedPost.create({
      data: {
        organizationId: org.id,
        authorUserId: user.id, // we might need User, but Member is what we fetched? Wait, authorUserId references User id. Let's check.
        type: "MANUAL",
        title: "Community Poll",
        description: "Please share your opinion on this poll.",
        isActive: true,
      }
    });

    // Create Poll
    await prisma.poll.create({
      data: {
        feedPostId: feedPost.id,
        question: data.question,
        options: data.options,
        allowMultiple: data.allowMultiple,
      }
    });

    console.log(`Created Poll for Organization: ${org.name}`);
  }

  console.log("Successfully seeded Polls!");
}

seedPolls()
  .catch((e) => {
    console.error("Error seeding Polls:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
