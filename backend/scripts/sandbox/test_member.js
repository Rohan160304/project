const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const member = await prisma.member.findFirst({
    where: {
      OR: [
        { publicId: 'JFJM116' },
        { publicId: 'JFJM116'.toUpperCase() },
        { user: { mobile: 'JFJM116' } }
      ]
    },
    include: { user: true }
  });
  console.log("Member found:", member);
}
main().catch(console.error).finally(() => prisma.$disconnect());
