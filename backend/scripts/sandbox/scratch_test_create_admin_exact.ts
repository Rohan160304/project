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
      "mobile": "+919999912347",
      "email": "",
      "firstName": "Test",
      "lastName": "Admin",
      "role": "TEMPLE_ADMIN",
      "organizationIds": [
          "cmsta16wo0003nosd3akppmef" // Test Temple ID from the db
      ],
      "grantedModules": {
          "MEMBERS": ["VIEW", "CREATE", "EDIT"]
      },
      "modules": ["MEMBERS"],
      "permissions": [
          { "module": "MEMBERS", "actions": ["VIEW", "CREATE", "EDIT"] }
      ],
      "assignedById": sa.id,
      "assignedByName": "Super Admin",
      "assignedByRole": "SUPER_ADMIN"
    })
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
main().catch(console.error).finally(() => prisma.$disconnect());
