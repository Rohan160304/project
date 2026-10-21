import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const member = await prisma.member.findFirst();
  if (!member) return;

  try {
    await prisma.member.update({
      where: { id: member.id },
      data: {
        currentAddress: { line1: undefined, city: "Test" } as any,
      }
    });
    console.log("Success with undefined inside JSON");
  } catch (e: any) {
    console.error("Error 1:", e.message);
  }

  try {
    await prisma.member.update({
      where: { id: member.id },
      data: {
        currentLat: "" as any,
      }
    });
    console.log("Success with empty string as Float");
  } catch (e: any) {
    console.error("Error 2:", e.message);
  }
}
main();
