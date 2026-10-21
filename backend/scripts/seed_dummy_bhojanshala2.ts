import { PrismaClient, OrganizationType, MealType, EventStatus, RoleKey, FeedPostType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cmt4jvk72016o12sc0b0gduq6';
  const memberId = 'cmt4jvjjv016m12sci92cr6fu';

  console.log('Seeding Bhojanshala...');

  // Assign a Public ID properly based on ID Sequences
  const seq = await prisma.idSequence.upsert({
    where: { prefix: 'JFBJ' },
    update: { lastValue: { increment: 1 } },
    create: { prefix: 'JFBJ', lastValue: 100 },
  });

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      publicId: `JFBJ${seq.lastValue}`,
      type: OrganizationType.BHOJANSHALA,
      name: 'Shri Mahavir Swami Jain Bhojanshala',
      shortName: 'Mahavir Bhojanshala',
      trustName: 'Shri Jain Shwetambar Murtipujak Sangh',
      trustRegistrationNumber: 'E-12345/Mumbai',
      status: 'ACTIVE',
      logoUrl: 'https://example.com/logo/bhojanshala_logo.jpg',
      coverUrl: 'https://example.com/cover/bhojanshala_cover.jpg',
      addressLine: '101, MG Road, Near Jain Temple',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      lat: 18.9690,
      lng: 72.8205,
      googleMapsLink: 'https://maps.google.com/?q=18.9690,72.8205',
      facilities: ['RO Water', 'AC Seating', 'Washrooms'],
      activeModules: ['BHOJANSHALA', 'DONATION', 'REVIEW'],
      hasBhojanshala: true,
      bhojanshalaName: 'Shri Mahavir Bhojanshala',
      bhojanshalaPublished: true,
      bhojanshalaBreakfastCharge: '30 INR',
      bhojanshalaBreakfastTiming: '07:30 AM to 09:00 AM',
      bhojanshalaLunchCharge: '70 INR',
      bhojanshalaLunchTiming: '11:30 AM to 01:30 PM',
      bhojanshalaDinnerCharge: '70 INR',
      bhojanshalaDinnerTiming: '05:00 PM to 06:45 PM',
      bhojanshalaContact: '+91-9876543210',
      bhojanshalaContactMemberId: memberId,
      bhojanshalaMealType: 'Pure Jain',
      bhojanshalaAvailability: 'Open for all.',
      bankAccountName: 'Shri Mahavir Bhojanshala',
      bankName: 'HDFC',
      bankBranch: 'MG Road',
      bankAccountEncrypted: 'ENCRYPTED_AC',
      bankIfsc: 'HDFC0001234',
      upiId: 'bhojanshala@hdfc',
      is80gEligible: true,
      csrEligible: false,
      avgRating: 4.8,
      followersCount: 1250,
      staffWorkingHoursStart: '06:00 AM',
      staffWorkingHoursEnd: '08:00 PM',
      emergencyContact: '+91-9876543211',
      caretakerDetails: 'Ramesh Bhai',
      rulesText: "Don't waste food.",
      contactEmail: 'info@bhojanshala.com',
      primaryContactPreference: 'WHATSAPP',
      establishedDate: new Date('1995-08-15T00:00:00.000Z'),
    },
  });

  console.log('Created Organization: ', org.id);

  // 2. Assign Admin (UserOrganization)
  await prisma.userOrganization.create({
    data: {
      userId: userId,
      organizationId: org.id,
      roleKey: RoleKey.BHOJANSHALA_ADMIN,
    }
  });

  // 3. Menu Item
  await prisma.bhojanshalaMenuItem.create({
    data: {
      organizationId: org.id,
      mealType: MealType.LUNCH,
      itemName: 'Special Jain Thali',
      description: 'Includes 2 Sabzi, Dal, Rice, 4 Roti, Farsan, and Sweet.',
      isAvailable: true,
      price: 70.00,
      dayOfWeek: 'SUNDAY',
      startTime: '11:30',
      endTime: '13:30'
    }
  });

  // 4. Notice
  await prisma.organizationNotice.create({
    data: {
      organizationId: org.id,
      title: 'Sunday Special Menu Update',
      body: 'This Sunday, we will serve special sweets in Lunch.',
      isPinned: true,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-09-05T23:59:59Z'),
      createdById: userId,
    }
  });

  // 5. Announcement
  await prisma.announcement.create({
    data: {
      organizationId: org.id,
      title: 'Kitchen Renovation',
      body: 'Bhojanshala will be closed for dinner on 15th August.',
      visibilityConfig: { isPublic: true, targetAudience: ["ALL_MEMBERS"] },
      createdById: userId,
    }
  });

  // 6. Event
  const evSeq = await prisma.idSequence.upsert({
    where: { prefix: 'JFEV' },
    update: { lastValue: { increment: 1 } },
    create: { prefix: 'JFEV', lastValue: 100 },
  });
  
  await prisma.event.create({
    data: {
      publicId: `JFEV${evSeq.lastValue}`,
      organizationId: org.id,
      title: 'Mega Food Drive',
      startAt: new Date('2026-09-01T10:00:00Z'),
      endAt: new Date('2026-09-01T14:00:00Z'),
      venue: 'Ground Floor',
      visibilityConfig: { isPublic: true },
      rsvpCapacity: 500,
      status: EventStatus.PUBLISHED,
      createdById: userId,
    }
  });

  // 7. Poll via FeedPost
  const feed = await prisma.feedPost.create({
    data: {
      organizationId: org.id,
      authorUserId: userId,
      type: FeedPostType.MANUAL,
      title: 'Poll regarding Sunday menu',
      visibilityConfig: { isPublic: true },
      isActive: true,
      poll: {
        create: {
          question: 'Which sweet would you prefer for Sunday lunch?',
          options: [{ text: "Gulab Jamun", votes: 0 }, { text: "Jalebi", votes: 0 }],
          allowMultiple: false,
          endsAt: new Date('2026-09-15T00:00:00Z')
        }
      }
    }
  });

  // 8. Bhojanshala Pass
  const bpSeq = await prisma.idSequence.upsert({
    where: { prefix: 'JFBP' },
    update: { lastValue: { increment: 1 } },
    create: { prefix: 'JFBP', lastValue: 100 },
  });
  await prisma.bhojanshalaPass.create({
    data: {
      publicId: `JFBP${bpSeq.lastValue}`,
      organizationId: org.id,
      memberId: memberId,
      mealType: MealType.LUNCH,
      date: new Date('2026-09-01T00:00:00Z'),
      numberOfPersons: 2,
      totalAmount: 140.00,
    }
  });

  console.log('Successfully seeded all related entities for Bhojanshala.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
