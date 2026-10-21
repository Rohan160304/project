import { PrismaClient, OrganizationType, FeedPostType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { nextPublicId } from '../src/engines/idGenerator/id.service';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding More Mock Data ---');

  // 1. Add more Members (Users) with Passwords
  const memberData = [
    { name: 'Amit Jain', mobile: '+919800000001', email: 'amit@jinanam.app' },
    { name: 'Priya Shah', mobile: '+919800000002', email: 'priya@jinanam.app' },
    { name: 'Ravi Mehta', mobile: '+919800000003', email: 'ravi@jinanam.app' },
  ];

  const defaultPassword = await bcrypt.hash('Member@108', 10);
  const shwetambar = await prisma.community.findFirst({ where: { name: 'Shwetambar' } });

  for (const md of memberData) {
    const existing = await prisma.user.findFirst({ where: { mobile: md.mobile } });
    if (!existing) {
      const publicId = await prisma.$transaction((tx) => nextPublicId('JAIN_MEMBER', tx));
      const user = await prisma.user.create({
        data: {
          mobile: md.mobile,
          email: md.email,
          mobileVerifiedAt: new Date(),
          emailVerifiedAt: new Date(),
          passwordHash: defaultPassword,
          firstName: md.name.split(' ')[0] || '',
          lastName: md.name.split(' ')[1] || '',
          primaryRoleKey: 'MEMBER',
          status: 'ACTIVE',
          publicId: publicId,
        },
      });

      await prisma.member.create({
        data: {
          userId: user.id,
          publicId: publicId,
          category: 'JAIN',
          firstName: md.name.split(' ')[0] || '',
          surname: md.name.split(' ')[1] || '',
          fullName: md.name,
          communityId: shwetambar ? shwetambar.id : "cmst9v2b50009m4lx4u68y3v3",
          mobile: md.mobile,
          mobileVerifiedAt: new Date(),
          status: 'ACTIVE',
        },
      });
      console.log(`Added Member: ${md.name} | Mobile: ${md.mobile} | Pwd: Member@108`);
    } else {
      console.log(`Member already exists: ${md.mobile}`);
    }
  }

  // 2. Add More Organizations
  const adminMobile = '+919999900001';
  const admin = await prisma.user.findUnique({ where: { mobile: adminMobile } });
  if (!admin) {
    console.log('Super/Temple admin not found, skipping organization seed.');
    return;
  }

  const orgs = [
    { name: 'Shri Mahavir Swami Jain Shwetambar Temple', type: 'TEMPLE' as OrganizationType },
    { name: 'Shri Parshwanath Digambar Jain Mandir', type: 'TEMPLE' as OrganizationType },
    { name: 'Ahmedabad Jain Sangh', type: 'JAIN_CENTER' as any },
  ];

  for (const org of orgs) {
    let existingOrg = await prisma.organization.findFirst({ where: { name: org.name } });
    if (!existingOrg) {
      const orgPublicId = await prisma.$transaction((tx) => nextPublicId('TEMPLE', tx));
      existingOrg = await prisma.organization.create({
        data: {
          publicId: orgPublicId,
          type: org.type,
          name: org.name,
          status: 'ACTIVE',
          createdById: admin.id,
          bhojanshalaBreakfastCharge: '60',
          bhojanshalaBreakfastTiming: '08:00 AM - 10:00 AM',
          bhojanshalaLunchCharge: '120',
          bhojanshalaLunchTiming: '12:00 PM - 02:00 PM',
          bhojanshalaDinnerCharge: '100',
          bhojanshalaDinnerTiming: '05:30 PM - 07:30 PM',
        }
      });
      console.log(`Added Organization: ${org.name}`);
    } else {
      console.log(`Org already exists: ${org.name}`);
    }
  }

  const sampleOrg = await prisma.organization.findFirst();

  // 3. Add News
  const existingNews = await prisma.news.findFirst();
  if (!existingNews && sampleOrg) {
    const pId1 = await prisma.$transaction((tx) => nextPublicId('COMMUNITY_PAGE', tx));
    await prisma.news.create({
      data: {
        publicId: pId1,
        organizationId: sampleOrg.id,
        title: 'Grand Pratishtha Mahotsav Announced',
        description: 'We are delighted to announce the upcoming Grand Pratishtha Mahotsav starting next month. All members are requested to participate and volunteer for the event.',
        publishedAt: new Date(),
        createdById: admin.id,
      }
    });

    const pId2 = await prisma.$transaction((tx) => nextPublicId('COMMUNITY_PAGE', tx));
    await prisma.news.create({
      data: {
        publicId: pId2,
        organizationId: sampleOrg.id,
        title: 'Annual General Meeting (AGM) 2026',
        description: 'The Annual General Meeting will be held on the upcoming Sunday. Financial reports and future expansion plans will be discussed.',
        publishedAt: new Date(),
        createdById: admin.id,
      }
    });
    console.log('Added 2 News Items');
  } else {
    console.log('News already exists or no org found.');
  }

  // 4. Add Feed Posts
  const existingPost = await prisma.feedPost.findFirst();
  if (!existingPost && sampleOrg) {
    await prisma.feedPost.create({
      data: {
        organizationId: sampleOrg.id,
        authorUserId: admin.id,
        description: 'Today\'s morning aarti was exceptionally peaceful. Jai Jinendra to everyone! 🙏',
        type: 'TEXT' as FeedPostType,
      }
    });

    await prisma.feedPost.create({
      data: {
        organizationId: sampleOrg.id,
        authorUserId: admin.id,
        description: 'Looking for volunteers for the upcoming Swamivatsalya on Sunday. Please message if you can help with serving or management.',
        type: 'TEXT' as FeedPostType,
      }
    });
    console.log('Added 2 Feed Posts');
  } else {
    console.log('Feed Posts already exist or no org found.');
  }

  console.log('--- Seeding Complete ---');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
