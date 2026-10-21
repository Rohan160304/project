const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const e = await prisma.event.findFirst({
      where: { OR: [{ id: 'JFEV108' }, { publicId: 'JFEV108' }] }
    });
    console.log(e ? 'found' : 'not found');
  } catch (e) {
    console.error('Error:', e.message);
  }
}
main();
