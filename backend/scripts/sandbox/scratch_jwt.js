require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const run = async () => {
  const user = await prisma.user.findFirst({ where: { firstName: { contains: 'Sanskar', mode: 'insensitive' } } });
  const token = jwt.sign(
    { sub: user.id, deviceId: 'test-device' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );
  
  const res = await fetch('http://localhost:4000/api/v1/auth/me/modules', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("RESPONSE:", JSON.stringify(data, null, 2));
};
run().then(() => process.exit(0)).catch(console.error);
