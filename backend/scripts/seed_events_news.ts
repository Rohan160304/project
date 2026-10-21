import { PrismaClient } from '@prisma/client';
import { generatePublicId } from '../src/engines/idGenerator/id.service';

const prisma = new PrismaClient();

const DUMMY_BANNERS = [
  'https://www.shutterstock.com/image-photo/highangle-landscape-girnar-jain-temple-complex-600nw-2720749709.jpg',
  'https://www.shutterstock.com/image-photo/highangle-landscape-girnar-jain-temple-complex-600nw-2720749709.jpg',
  'https://www.shutterstock.com/image-photo/highangle-landscape-girnar-jain-temple-complex-600nw-2720749709.jpg',
  'https://www.shutterstock.com/image-photo/highangle-landscape-girnar-jain-temple-complex-600nw-2720749709.jpg',
  'https://www.shutterstock.com/image-photo/highangle-landscape-girnar-jain-temple-complex-600nw-2720749709.jpg',
  'https://www.shutterstock.com/image-photo/highangle-landscape-girnar-jain-temple-complex-600nw-2720749709.jpg'
];

const EVENT_TITLES = [
  'Annual Jain Sangh Gathering',
  'Paryushan Parva Special Discourses',
  'Youth Spiritual Retreat 2026',
  'Medical Camp for the Underprivileged',
  'Mahavir Janma Kalyanak Celebration',
  'Jivdaya awareness workshop',
  'Navpad Oli Aradhana Camp',
  'Sutra Pathan Competition',
  'Bhakti Sangeet Sandhya',
  'Ahinsa Walkathon',
  'Jainism in Modern Times Seminar',
  'Kids Pathshala Annual Function',
  'Jain Food Festival & Vegan Expo',
];

const EVENT_DESCRIPTIONS = [
  'Join us for a grand gathering of the Sangh where we will discuss our yearly progress and enjoy a satsang together. Open for all families.',
  'Daily discourses and pratikraman sessions organized throughout the holy days of Paryushan. Swamivatsalya on the final day.',
  'A weekend retreat designed for the youth to disconnect from the digital world and reconnect with spiritual roots through meditation and interactive sessions.',
  'A free health checkup and consultation camp. Doctors across different specializations will be available. Organized as part of our community service initiatives.',
  'Celebrate the auspicious occasion of Mahavir Swami Janma Kalyanak with grand aarti, cultural programs, and bhajan.',
  'A workshop focusing on the principles of Jivdaya and practical ways to implement non-violence in our daily lives towards all living beings.',
  'Complete arrangement for Ayambil and daily discourses for the Navpad Oli. Registration is mandatory for arrangement purposes.',
  'Annual competition for children and young adults to showcase their knowledge and memorization of Jain Sutras.',
  'An evening filled with soulful Bhakti songs and stotras by renowned singers from the community.',
  'A 5km walk to raise awareness about Ahinsa (non-violence) and environmental conservation.',
  'A panel discussion featuring scholars exploring how Jain principles can be applied to solve modern-day challenges.',
  'The annual showcase event of our Pathshala students featuring plays, recitation, and prize distribution.',
  'Discover the variety of Jain-compliant vegan food. Various stalls and culinary competitions will be held.',
];

const NEWS_TITLES = [
  'New Pathshala Branch Opened in South Side',
  'Sangh Contributes 5 Lakhs to Earthquake Relief',
  'Highlights from Last Week’s Youth Convention',
  'Upcoming Renovation of the Main Derasar',
  'Jain Scholar Awarded National Honour',
  'Record Number of Taps (Fasting) Observed This Choturmas',
  'Community Kitchen Reaches Milestone: 1 Lakh Meals Served',
  'Interview with our newly elected Sangh President',
  'Important Notice Regarding Paryushan Dates',
  'Jivdaya Foundation Rescues 500 Animals',
  'Annual Scholarship Distributed to 200 Students',
  'New Library Facility Inaugurated',
  'Health Camp Successfully Treats 1000 Patients',
  'Guidance on the New Education Trust Scheme',
  'Sangh Pilgrimage to Shikharji Announced for Next Month',
  'Local Jain Youth Wins International Science Olympiad',
  'Plantation Drive Successfully Adds 500 Trees',
];

const NEWS_DESCRIPTIONS = [
  'We are thrilled to announce the opening of a new Pathshala branch in the south side to accommodate the growing number of students in that area.',
  'Following the devastating earthquake, the Sangh has collectively raised and donated 5 Lakh rupees to the PM Relief Fund to aid those in need.',
  'The 3-day youth convention concluded on a high note with over 300 participants. Key takeaways included a pledge towards eco-friendly practices.',
  'The managing committee has approved a comprehensive renovation plan for the main Derasar to preserve its heritage structure. Works will begin next month.',
  'Dr. Ramesh Shah was honoured with a national award for his extensive research on ancient Jain manuscripts. We congratulate him on this achievement.',
  'This year’s Chaturmas saw a record-breaking number of individuals undertaking extended fasts (tapasya). We bow down to their devotion.',
  'Our Bhojanshala initiative has successfully served its 100,000th meal since its inception 2 years ago, thanks to generous donors.',
  'An exclusive interview with the newly elected president discussing his vision for the Sangh’s progress over the next three years.',
  'Please note the confirmed dates and schedule for the upcoming Paryushan Parva. Detailed timings for Pratikraman are attached.',
  'Our affiliated Jivdaya foundation has successfully rescued and provided shelter to over 500 animals during the severe winter months.',
  'In our commitment to education, scholarships worth 10 Lakhs were distributed to deserving students pursuing higher education.',
  'A new state-of-the-art library section focusing on Jain Agams and literature has been inaugurated at the community center.',
  'The weekend health camp saw overwhelming participation, with specialist doctors treating over 1000 patients for free.',
  'Members are requested to review the new guidelines for the Education Trust Scheme available at the Sangh office.',
  'A special train has been booked for the upcoming 7-day pilgrimage to Sammed Shikharji. Interested members should register by next week.',
  'We are proud to share that a local youth from our community has won a gold medal at the International Science Olympiad.',
  'As part of our green initiative, volunteers successfully planted 500 saplings around the city’s outskirts last Sunday.',
];

async function main() {
  console.log('Starting Events and News Seeding...');

  // Fetch some existing organizations
  const orgs = await prisma.organization.findMany({
    take: 10,
    where: { deletedAt: null },
  });

  if (orgs.length === 0) {
    console.error('No organizations found! Please seed orgs first.');
    return;
  }

  // Seed 13 Events
  console.log('Seeding 13 Events...');
  for (let i = 0; i < 13; i++) {
    const org = orgs[i % orgs.length];
    const publicId = await generatePublicId('EVENT');

    // Create random start date within next 30 days
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + Math.floor(Math.random() * 30) + 1);
    startAt.setHours(9, 0, 0, 0); // 9 AM

    // End date is usually same day or a few days later
    const endAt = new Date(startAt);
    endAt.setHours(18, 0, 0, 0); // 6 PM
    if (Math.random() > 0.7) {
      endAt.setDate(endAt.getDate() + Math.floor(Math.random() * 3) + 1); // Multi-day event
    }

    const title = EVENT_TITLES[i];
    const description = EVENT_DESCRIPTIONS[i];
    const bannerUrl = DUMMY_BANNERS[i % DUMMY_BANNERS.length];

    await prisma.event.create({
      data: {
        publicId,
        organizationId: org.id,
        title,
        description,
        bannerUrl,
        venue: `${org.name} Community Hall, ${org.city || 'City Center'}`,
        lat: org.lat,
        lng: org.lng,
        startAt,
        endAt,
        status: 'PUBLISHED',
      },
    });
    console.log(`Created Event: ${title} (${publicId}) under org ${org.name}`);
  }

  // Seed 17 News
  console.log('Seeding 17 News articles...');
  for (let i = 0; i < 17; i++) {
    const org = orgs[i % orgs.length];
    const publicId = await generatePublicId('NEWS');

    const title = NEWS_TITLES[i];
    const description = NEWS_DESCRIPTIONS[i];
    const coverUrl = DUMMY_BANNERS[(i + 2) % DUMMY_BANNERS.length];

    // Create random published date in the past 30 days
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - Math.floor(Math.random() * 30));

    await prisma.news.create({
      data: {
        publicId,
        organizationId: org.id,
        title,
        description,
        coverUrl,
        publishedAt,
      },
    });
    console.log(`Created News: ${title} (${publicId}) under org ${org.name}`);
  }

  console.log('Events and News seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
