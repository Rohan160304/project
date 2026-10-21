const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.roomOrHall.findMany();
  let splitCount = 0;
  
  for (const room of rooms) {
    let numbers = [];
    if (room.roomNumber && room.roomNumber.includes(',')) {
      numbers = room.roomNumber.split(',').map(n => n.trim()).filter(Boolean);
    } else if (room.roomCount > 1) {
      for (let i = 1; i <= room.roomCount; i++) {
        numbers.push((room.roomNumber || 'Room') + ' - ' + i);
      }
    }
    
    if (numbers.length > 1) {
      console.log(`Splitting room ${room.id} (${room.name}) into ${numbers.length} rooms:`, numbers);
      
      // Delete the original room
      await prisma.roomOrHall.delete({ where: { id: room.id } });
      
      // Create new rooms
      for (const rn of numbers) {
        const { id, ...roomData } = room;
        roomData.roomNumber = rn;
        roomData.roomCount = 1;
        await prisma.roomOrHall.create({ data: roomData });
        splitCount++;
      }
    }
  }
  
  console.log(`Migration complete. Split into ${splitCount} new rooms.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
