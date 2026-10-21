import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const member = await prisma.member.findFirst();
  if (!member) return;
  const token = jwt.sign({ sub: member.userId, type: 'ACCESS', publicId: member.publicId }, process.env.JWT_ACCESS_SECRET as string);

  const payload = {
    // try omitting subCommunityId completely and testing if it passes
    firstName: member.firstName,
  };

  const res = await fetch('http://localhost:4000/api/v1/members/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  console.log("Status:", res.status);
  console.log(await res.text());
}
main();
