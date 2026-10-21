import { PrismaClient } from '@prisma/client';
import { updateMemberProfile } from './src/modules/members/members.service';
const prisma = new PrismaClient();

async function main() {
  const member = await prisma.member.findFirst();
  if (!member) {
    console.log("No member found");
    return;
  }
  console.log('Member:', member.id);
  try {
     const payload = {
        // mock frontend payload
        firstName: member.firstName,
        communityId: "123", // any
        tithiCalendarTypeId: null,
        dob: null,
     };
     await updateMemberProfile(member.id, payload as any);
     console.log("Success");
  } catch (e) {
     console.error("Error:", e);
  }
}
main();
