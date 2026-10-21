import { PrismaClient } from '@prisma/client';
import { signAccessToken } from './src/engines/rbac/jwt.service';

const prisma = new PrismaClient();
async function main() {
  const sa = await prisma.user.findFirst({ where: { primaryRoleKey: 'SUPER_ADMIN' } });
  
  const token = signAccessToken({
    sub: sa.id,
    publicId: sa.publicId,
    role: sa.primaryRoleKey,
    isSuperAdmin: true,
    deviceId: 'web-test-123'
  });

  const res = await fetch('http://localhost:4000/api/v1/auth/admins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mobile: "+919999912346",
      firstName: "TestAdmin2",
      role: "TEMPLE_ADMIN",
      organizationIds: ["cmst8u21g007uhd3lf0v0l99r"], // Assuming some org ID exists, let's just use a dummy one to see if validation passes. Wait, Zod accepts any string array.
    })
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
main().catch(console.error).finally(() => prisma.$disconnect());
