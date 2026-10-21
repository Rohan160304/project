import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  let type = await prisma.tithiCalendarType.findFirst();
  if (!type) {
    console.log("No calendar type found. Creating one.");
    type = await prisma.tithiCalendarType.create({ data: { name: "Default Calendar" } });
  }
  
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  await prisma.tithiCalendarEntry.create({
    data: {
      calendarTypeId: type.id,
      year: now.getUTCFullYear(),
      gregorianDate: dayStart,
      tithiName: "Chaturdashi Tithi",
      description: "Vikram Samvat 2082 • Nakshatra: Pushya"
    }
  });
  console.log("Inserted mock tithi for today!");
}
main();
