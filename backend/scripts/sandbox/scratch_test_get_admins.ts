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
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
main().catch(console.error).finally(() => prisma.$disconnect());
