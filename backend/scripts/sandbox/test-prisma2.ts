import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const member = await prisma.member.findFirst();
  if (!member) return;

  try {
    await prisma.member.update({
      where: { id: member.id },
      data: {
        siblings: [ { name: "test", age: undefined } ] as any,
      }
    });
    console.log("Success with undefined inside JSON array");
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
main();
