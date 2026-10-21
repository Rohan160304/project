
import 'dotenv/config';
import { PrismaClient, OrganizationType, RoleKey, MealType, EventStatus, FeedPostType, MemberStatus } from '@prisma/client';
import { generatePublicId } from '../src/engines/idGenerator/id.service';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function getMasterData() {
  const shwetambar = await prisma.community.findFirst({ where: { name: 'Shwetambar' } });
  const murtipujak = await prisma.subCommunity.findFirst({ where: { name: 'Murtipujak' } });
  const tapaGaccha = await prisma.gaccha.findFirst({ where: { name: 'Tapa Gaccha' } });
  const gujarati = await prisma.tithiCalendarType.findFirst({ where: { name: 'Gujarati' } });
  const utsav = await prisma.eventCategory.findFirst({ where: { name: 'Utsav/Festival' } });
  const superAdmin = await prisma.user.findFirst({ where: { primaryRoleKey: 'SUPER_ADMIN' } });

  if (!shwetambar || !murtipujak || !tapaGaccha || !gujarati || !utsav || !superAdmin) {
    throw new Error('Master data is missing. Please run `npx prisma migrate reset` or `npm run seed` first.');
  }

  return { shwetambar, murtipujak, tapaGaccha, gujarati, utsav, superAdmin };
}

async function seedRealisticData() {
  console.log('🌱 Starting Realistic Seed Data Population...');
  const master = await getMasterData();
  const passwordHash = await bcrypt.hash('ChangeMe@108', 10);

  // ---------------------------------------------------------
  // 1. Create Jain Member
  // ---------------------------------------------------------
  console.log('Creating Realistic Jain Member...');
  const jmPublicId = await generatePublicId('JAIN_MEMBER');
  const userKalpesh = await prisma.user.create({
    data: {
      publicId: jmPublicId,
      mobile: '+919876543210',
      mobileVerifiedAt: new Date(),
      email: 'kalpesh.shah@example.com',
      emailVerifiedAt: new Date(),
      firstName: 'Kalpesh',
      lastName: 'Shah',
      passwordHash,
      primaryRoleKey: 'MEMBER',
      status: 'ACTIVE',
      createdByAdmin: true,
    }
  });

  const memberKalpesh = await prisma.member.create({
    data: {
      userId: userKalpesh.id,
      publicId: jmPublicId,
      category: 'JAIN',
      firstName: 'Kalpesh',
      middleName: 'Ramanlal',
      surname: 'Shah',
      fullName: 'Kalpesh Ramanlal Shah',
      photoUrl: 'https://example.com/profiles/kalpesh_shah.jpg',
      gender: 'Male',
      dob: new Date('1985-05-15T00:00:00Z'),
      nationality: 'Indian',
      preferredLanguage: 'Gujarati',
      maritalStatus: 'Married',
      motherTongue: 'Gujarati',
      communityId: master.shwetambar.id,
      subCommunityId: master.murtipujak.id,
      gacchaId: master.tapaGaccha.id,
      tithiCalendarTypeId: master.gujarati.id,
      mobile: '+919876543210',
      mobileVerifiedAt: new Date(),
      whatsapp: '+919876543210',
      whatsappVerifiedAt: new Date(),
      email: 'kalpesh.shah@example.com',
      emailVerifiedAt: new Date(),
      preferredCommunicationMethod: 'WHATSAPP',
      alternateContact: '+919998887776',
      currentAddress: {
        line1: 'A/204, Siddhivinayak Apartments',
        line2: 'MG Road, Kandivali West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400067',
        country: 'India'
      },
      permanentAddress: {
        line1: 'A/204, Siddhivinayak Apartments',
        line2: 'MG Road, Kandivali West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400067',
        country: 'India'
      },
      sameAsPermanent: true,
      nativeVillage: 'Palanpur',
      currentLat: 19.2070,
      currentLng: 72.8360,
      visitFrequency: 'WEEKLY',
      bloodGroup: 'O_POSITIVE',
      disability: 'None',
      medicalNotes: 'Allergic to Peanuts',
      emergencyContact: {
        name: 'Bhavna Shah',
        relation: 'Wife',
        phone: '+919998887776'
      },
      profession: 'Chartered Accountant',
      isVolunteer: true,
      volunteerAreas: ['Event Support', 'Bhojanshala Seva'],
      volunteerAvailability: 'Weekends',
      currencyCode: 'INR',
      status: 'ACTIVE',
      isAutoCreated: false,
      activatedAt: new Date(),
      profileCompletionPct: 100
    }
  });

  // ---------------------------------------------------------
  // 2. Create Non-Jain Member
  // ---------------------------------------------------------
  console.log('Creating Realistic Non-Jain Member...');
  const njmPublicId = await generatePublicId('NON_JAIN_MEMBER');
  const userRahul = await prisma.user.create({
    data: {
      publicId: njmPublicId,
      mobile: '+919000000001',
      mobileVerifiedAt: new Date(),
      firstName: 'Rahul',
      lastName: 'Sharma',
      passwordHash,
      primaryRoleKey: 'NON_JAIN_MEMBER',
      status: 'ACTIVE',
      createdByAdmin: true,
    }
  });

  const memberRahul = await prisma.member.create({
    data: {
      userId: userRahul.id,
      publicId: njmPublicId,
      category: 'NON_JAIN',
      firstName: 'Rahul',
      surname: 'Sharma',
      fullName: 'Rahul Sharma',
      gender: 'Male',
      mobile: '+919000000001',
      mobileVerifiedAt: new Date(),
      status: 'ACTIVE',
      isAutoCreated: false,
      activatedAt: new Date(),
      profileCompletionPct: 60
    }
  });

  // ---------------------------------------------------------
  // Helper: Create Org Admin
  // ---------------------------------------------------------
  async function createOrgAdmin(phone: string, firstName: string, lastName: string, roleKey: RoleKey) {
    const pubId = await generatePublicId('STAFF');
    return prisma.user.create({
      data: {
        publicId: pubId,
        mobile: phone,
        mobileVerifiedAt: new Date(),
        firstName,
        lastName,
        passwordHash,
        primaryRoleKey: roleKey,
        status: 'ACTIVE',
        createdByAdmin: true,
      }
    });
  }

  // ---------------------------------------------------------
  // 3. Create Bhojanshala
  // ---------------------------------------------------------
  console.log('Creating Realistic Bhojanshala...');
  const adminBhojanshala = await createOrgAdmin('+919000011111', 'Mahesh', 'Bhai', 'BHOJANSHALA_ADMIN');
  const bhojPubId = await generatePublicId('BHOJANSHALA');

  const bhojanshala = await prisma.organization.create({
    data: {
      publicId: bhojPubId,
      type: 'BHOJANSHALA',
      name: 'Shri Adinath Shwetambar Jain Bhojanshala',
      shortName: 'Adinath Bhojanshala',
      trustName: 'Shri Adinath Jain Trust',
      trustRegistrationNumber: 'E-9876/Mumbai',
      status: 'ACTIVE',
      logoUrl: 'https://example.com/logo/adinath_bhoj.png',
      coverUrl: 'https://example.com/cover/adinath_bhoj.jpg',
      addressLine: 'Near Adinath Temple, SV Road, Borivali West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400092',
      lat: 19.2290,
      lng: 72.8573,
      googleMapsLink: 'https://maps.google.com/?q=19.2290,72.8573',
      facilities: ['RO Water', 'AC Seating', 'Washrooms', 'Wheelchair Access'],
      activeModules: ['BHOJANSHALAS', 'DONATIONS', 'EVENTS'],
      hasBhojanshala: true,
      bhojanshalaName: 'Shri Adinath Bhojanshala',
      bhojanshalaPublished: true,
      bhojanshalaBreakfastCharge: '40 INR',
      bhojanshalaBreakfastTiming: '07:00 AM to 08:30 AM',
      bhojanshalaLunchCharge: '80 INR',
      bhojanshalaLunchTiming: '11:00 AM to 01:30 PM',
      bhojanshalaDinnerCharge: '80 INR',
      bhojanshalaDinnerTiming: '04:30 PM to 06:15 PM (Before Sunset)',
      bhojanshalaContact: '+91-9000011111',
      bhojanshalaContactMemberId: memberKalpesh.id,
      bhojanshalaMealType: 'Pure Jain (No Root Vegetables)',
      bhojanshalaAvailability: 'Open for all Jains',
      bankAccountName: 'Shri Adinath Jain Trust Bhojanshala',
      bankName: 'State Bank of India',
      bankBranch: 'Borivali West',
      bankAccountEncrypted: 'ENCRYPTED_SBI_AC',
      bankIfsc: 'SBIN0001234',
      upiId: 'adinath.bhoj@sbi',
      is80gEligible: true,
      csrEligible: false,
      avgRating: 4.9,
      followersCount: 3500,
      staffWorkingHoursStart: '05:30 AM',
      staffWorkingHoursEnd: '07:30 PM',
      emergencyContact: '+91-9000011112',
      caretakerDetails: 'Mahesh Bhai (Manager)',
      rulesText: '1. Do not waste food. 2. Outside food not allowed. 3. Maintain silence.',
      contactEmail: 'bhojanshala@adinathtrust.org',
      primaryContactPreference: 'WHATSAPP',
      establishedDate: new Date('1980-04-20T00:00:00Z'),
      createdById: master.superAdmin.id,
    }
  });

  await prisma.userOrganization.create({
    data: { userId: adminBhojanshala.id, organizationId: bhojanshala.id, roleKey: 'BHOJANSHALA_ADMIN' }
  });

  await prisma.bhojanshalaMenuItem.create({
    data: {
      organizationId: bhojanshala.id,
      mealType: 'LUNCH',
      itemName: 'Maharaja Jain Thali',
      description: '2 Sabzi, Dal, Rice, 4 Fulka Roti, Farsan, Sweet, Papad, Chaas.',
      isAvailable: true,
      price: 80.00,
      dayOfWeek: 'SUNDAY',
      startTime: '11:00',
      endTime: '13:30'
    }
  });

  // Bhojanshala Pass
  const bpPubId = await generatePublicId('BHOJANSHALA_PASS');
  await prisma.bhojanshalaPass.create({
    data: {
      publicId: bpPubId,
      organizationId: bhojanshala.id,
      memberId: memberKalpesh.id,
      mealType: 'LUNCH',
      date: new Date('2026-09-05T00:00:00Z'),
      numberOfPersons: 4,
      totalAmount: 320.00,
      status: 'BOOKED'
    }
  });

  // ---------------------------------------------------------
  // 4. Create Temple
  // ---------------------------------------------------------
  console.log('Creating Realistic Temple...');
  const adminTemple = await createOrgAdmin('+919000022222', 'Rameshchandra', 'Pujari', 'TEMPLE_ADMIN');
  const templePubId = await generatePublicId('TEMPLE');

  const temple = await prisma.organization.create({
    data: {
      publicId: templePubId,
      type: 'TEMPLE',
      name: 'Shri Shankheshwar Parshwanath Jain Derasar',
      shortName: 'Shankheshwar Derasar',
      trustName: 'Shri Shankheshwar Jain Shwetambar Trust',
      trustRegistrationNumber: 'E-1002/Ahmedabad',
      status: 'ACTIVE',
      logoUrl: 'https://example.com/logo/shankheshwar.png',
      coverUrl: 'https://example.com/cover/shankheshwar_temple.jpg',
      addressLine: 'Shankheshwar Road, City Center',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      pincode: '380001',
      lat: 23.0225,
      lng: 72.5714,
      googleMapsLink: 'https://maps.google.com/?q=23.0225,72.5714',
      facilities: ['Pooja Clothes Available', 'Locker Room', 'Washrooms', 'Wheelchair Access'],
      activeModules: ['TEMPLES', 'DONATIONS', 'EVENTS', 'POLLS'],
      bankAccountName: 'Shri Shankheshwar Derasar Trust',
      bankName: 'Bank of Baroda',
      bankBranch: 'CG Road',
      bankAccountEncrypted: 'ENCRYPTED_BOB_AC',
      bankIfsc: 'BARB0CGROAD',
      upiId: 'shankheshwar.derasar@bob',
      is80gEligible: true,
      csrEligible: true,
      avgRating: 5.0,
      followersCount: 15000,
      staffWorkingHoursStart: '05:00 AM',
      staffWorkingHoursEnd: '09:00 PM',
      emergencyContact: '+91-9898989898',
      caretakerDetails: 'Pujari: Rameshchandra',
      rulesText: '1. Traditional Pooja clothes mandatory. 2. Mobile phones strictly prohibited inside Garbhagriha.',
      contactEmail: 'info@shankheshwartemple.org',
      primaryContactPreference: 'EMAIL',
      establishedDate: new Date('1950-01-15T00:00:00Z'),
      createdById: master.superAdmin.id,
    }
  });

  await prisma.userOrganization.create({
    data: { userId: adminTemple.id, organizationId: temple.id, roleKey: 'TEMPLE_ADMIN' }
  });

  await prisma.organizationNotice.create({
    data: {
      organizationId: temple.id,
      title: 'Paryushan Parv Timings & Pravachan',
      body: 'Temple will open at 4:30 AM during all 8 days of Paryushan. Daily Pravachan by Acharya Shri at 9:00 AM.',
      isPinned: true,
      startDate: new Date('2026-08-30T00:00:00Z'),
      endDate: new Date('2026-09-08T23:59:59Z'),
      createdById: adminTemple.id,
    }
  });

  const evtPubId = await generatePublicId('EVENT');
  await prisma.event.create({
    data: {
      publicId: evtPubId,
      organizationId: temple.id,
      title: 'Shri Parshwanath Bhagwan Janma Kalyanak Utsav',
      categoryId: master.utsav.id,
      startAt: new Date('2026-12-25T06:00:00Z'),
      endAt: new Date('2026-12-25T14:00:00Z'),
      venue: 'Main Temple Ground, Ahmedabad',
      visibilityConfig: { isPublic: true, targetAudience: ["ALL_MEMBERS"] },
      status: 'PUBLISHED',
      isPaid: false,
      rsvpCapacity: 2000,
      createdById: adminTemple.id,
    }
  });

  // ---------------------------------------------------------
  // 5. Create Dharamshala
  // ---------------------------------------------------------
  console.log('Creating Realistic Dharamshala...');
  const adminDharamshala = await createOrgAdmin('+919000033333', 'Suresh', 'Jain', 'DHARAMSHALA_ADMIN');
  const dharamPubId = await generatePublicId('DHARAMSHALA');

  const dharamshala = await prisma.organization.create({
    data: {
      publicId: dharamPubId,
      type: 'DHARAMSHALA',
      name: 'Shri Nakoda Tirth Yatri Niwas',
      shortName: 'Nakoda Dharamshala',
      trustName: 'Shri Nakoda Parshwanath Trust',
      trustRegistrationNumber: 'E-456/Rajasthan',
      status: 'ACTIVE',
      logoUrl: 'https://example.com/logo/nakoda_dr.png',
      coverUrl: 'https://example.com/cover/nakoda_dr.jpg',
      addressLine: 'Mewanagar, Nakoda Tirth Road',
      city: 'Balotra',
      state: 'Rajasthan',
      country: 'India',
      pincode: '344022',
      lat: 25.8361,
      lng: 72.2472,
      googleMapsLink: 'https://maps.google.com/?q=25.8361,72.2472',
      facilities: ['AC Rooms', 'Hot Water', 'Lift', 'Bhojanshala Attached', '24x7 Security'],
      activeModules: ['DHARAMSHALAS', 'DONATIONS', 'BOOKINGS'],
      bankAccountName: 'Shri Nakoda Tirth Dharamshala',
      bankName: 'HDFC Bank',
      bankBranch: 'Balotra',
      bankAccountEncrypted: 'ENCRYPTED_HDFC_AC',
      bankIfsc: 'HDFC0009999',
      upiId: 'nakodadr@hdfc',
      avgRating: 4.7,
      followersCount: 8500,
      staffWorkingHoursStart: '00:00',
      staffWorkingHoursEnd: '23:59',
      emergencyContact: '+91-8888888888',
      caretakerDetails: 'Manager: Suresh Jain',
      rulesText: '1. Checkout time 10:00 AM. 2. Original ID proof mandatory.',
      contactEmail: 'booking@nakodatirth.org',
      primaryContactPreference: 'PHONE',
      establishedDate: new Date('1990-10-10T00:00:00Z'),
      createdById: master.superAdmin.id,
    }
  });

  await prisma.userOrganization.create({
    data: { userId: adminDharamshala.id, organizationId: dharamshala.id, roleKey: 'DHARAMSHALA_ADMIN' }
  });

  const bld = await prisma.building.create({
    data: { organizationId: dharamshala.id, name: 'New AC Block (Bhairav Bhavan)' }
  });
  const wing = await prisma.wing.create({
    data: { buildingId: bld.id, name: 'Wing A - Family Rooms' }
  });
  const room = await prisma.roomOrHall.create({
    data: {
      wingId: wing.id,
      name: 'Room 101',
      type: 'ROOM',
      capacity: 4,
      pricePerUnit: 800.00,
      deposit: 500.00,
      status: 'AVAILABLE',
      amenities: { isAc: true, bed: 'Double Bed' },
      attachedBathroom: "Yes",
    }
  });

  const drBkPubId = await generatePublicId('DHARAMSHALA_BOOKING');
  const dBooking = await prisma.dharamshalaBooking.create({
    data: {
      publicId: drBkPubId,
      organizationId: dharamshala.id,
      memberId: memberKalpesh.id,
      fromDate: new Date('2026-11-10T12:00:00Z'),
      toDate: new Date('2026-11-12T10:00:00Z'),
      numberOfRooms: 1,
      numberOfPersons: 4,
      totalAmount: 1600.00,
      depositAmount: 500.00,
      status: 'CONFIRMED'
    }
  });
  await prisma.bookingAllocation.create({
    data: {
      bookingId: dBooking.id,
      roomOrHallId: room.id,
      startDate: new Date('2026-11-10T00:00:00Z'),
      endDate: new Date('2026-11-12T00:00:00Z'),
      numberOfGuests: 4
    }
  });

  // ---------------------------------------------------------
  // 6. Create Jain Center
  // ---------------------------------------------------------
  console.log('Creating Realistic Jain Center...');
  const adminJC = await createOrgAdmin('+919000044444', 'Nitin', 'Mehta', 'JAIN_CENTER_ADMIN');
  const jcPubId = await generatePublicId('JAIN_CENTER');

  const jainCenter = await prisma.organization.create({
    data: {
      publicId: jcPubId,
      type: 'JAIN_CENTER',
      name: 'Jain Center of America (JCA)',
      shortName: 'JCA New York',
      trustName: 'JCA Trust',
      status: 'ACTIVE',
      city: 'New York',
      state: 'New York',
      country: 'United States',
      pincode: '10001',
      activeModules: ['JAIN_CENTERS', 'DONATIONS', 'EVENTS'],
      hasPathshala: true,
      hasBhojanshala: true,
      hasUpashray: true,
      followersCount: 5000,
      createdById: master.superAdmin.id,
    }
  });

  await prisma.userOrganization.create({
    data: { userId: adminJC.id, organizationId: jainCenter.id, roleKey: 'JAIN_CENTER_ADMIN' }
  });

  // ---------------------------------------------------------
  // 7. Create Sthanak
  // ---------------------------------------------------------
  console.log('Creating Realistic Sthanak...');
  const adminSthanak = await createOrgAdmin('+919000055555', 'Hemant', 'Doshi', 'ORG_ADMIN');
  const stnPubId = await generatePublicId('STHANAK');

  const sthanak = await prisma.organization.create({
    data: {
      publicId: stnPubId,
      type: 'STHANAK',
      name: 'Shri Sthanakvasi Jain Sangh',
      shortName: 'Sthanak Sangh',
      status: 'ACTIVE',
      city: 'Surat',
      state: 'Gujarat',
      country: 'India',
      pincode: '395001',
      activeModules: ['EVENTS', 'DONATIONS'],
      hasUpashray: true,
      createdById: master.superAdmin.id,
    }
  });

  await prisma.userOrganization.create({
    data: { userId: adminSthanak.id, organizationId: sthanak.id, roleKey: 'ORG_ADMIN' }
  });

  // ---------------------------------------------------------
  // 8. Create Community Page
  // ---------------------------------------------------------
  console.log('Creating Community Page...');
  const adminPage = await createOrgAdmin('+919000066666', 'Jigar', 'Savla', 'PAGE_OWNER');
  const cpPublicId = await generatePublicId('COMMUNITY_PAGE');
  const cpCategory = await prisma.communityPageCategory.create({
    data: { name: 'Youth & Cultural' }
  });
  
  const commPage = await prisma.communityPage.create({
    data: {
      publicId: cpPublicId,
      name: 'Jain Youth Forum (JYF)',
      shortName: 'JYF India',
      categoryId: cpCategory.id,
      about: 'A global forum for Jain youth networking and events.',
      communityVisibility: 'PUBLIC',
      subscriptionPlan: 'FREE',
      createdById: master.superAdmin.id,
    }
  });

  await prisma.communityPageMember.create({
    data: {
      pageId: commPage.id,
      memberId: memberKalpesh.id,
      status: 'APPROVED',
    }
  });

  console.log('✅ Realistic Seed Data Population Complete!');
}

seedRealisticData()
  .catch(e => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
