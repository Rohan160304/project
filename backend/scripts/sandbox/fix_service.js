const fs = require('fs');
const file = 'src/modules/bookings/bookings.service.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Update submitBooking
content = content.replace(
  /export async function submitBooking\(memberId: string, input: \{ bookingItemId: string; dateFrom: Date; dateTo\?: Date; slot\?: string; peopleCount: number \}\) \{/g,
  'export async function submitBooking(memberId: string, input: { bookingItemId: string; dateFrom: Date; dateTo?: Date; slot?: string; peopleCount: number; quantity?: number }) {'
);

content = content.replace(
  /const booking = await prisma\.\$transaction\(async \(tx\) => \{\n\s+const publicId = await nextPublicId\('BOOKING', tx\);\n\s+const created = await tx\.booking\.create\(\{\n\s+data: \{\n\s+publicId,\n\s+bookingItemId: item\.id,\n\s+organizationId: item\.organizationId,\n\s+memberId,\n\s+dateFrom: input\.dateFrom,\n\s+dateTo: input\.dateTo,\n\s+slot: input\.slot,\n\s+peopleCount: input\.peopleCount,\n\s+amount: item\.type === 'PAID' \? item\.chargeAmount : 0,/g,
  `const qty = input.quantity || 1;\n  const baseAmount = item.type === 'PAID' ? Number(item.chargeAmount) : 0;\n  const totalAmount = baseAmount * qty;\n\n  const booking = await prisma.$transaction(async (tx) => {\n    const publicId = await nextPublicId('BOOKING', tx);\n    const created = await tx.booking.create({\n      data: {\n        publicId,\n        bookingItemId: item.id,\n        organizationId: item.organizationId,\n        memberId,\n        dateFrom: input.dateFrom,\n        dateTo: input.dateTo,\n        slot: input.slot,\n        peopleCount: input.peopleCount,\n        quantity: qty,\n        amount: totalAmount,`
);

// 2. Update checkInBooking
content = content.replace(
  /if \(booking\.allocatedRoomId\) \{\n\s+await prisma\.roomOrHall\.update\(\{ where: \{ id: booking\.allocatedRoomId \}, data: \{ status: 'OCCUPIED' \} \}\)\.catch\(\(\) => \{\}\);\n\s+\}/g,
  `if (booking.allocatedRoomId) {\n    const ids = booking.allocatedRoomId.split(',').map(id => id.trim()).filter(Boolean);\n    if (ids.length > 0) {\n      await prisma.roomOrHall.updateMany({ where: { id: { in: ids } }, data: { status: 'OCCUPIED' } }).catch(() => {});\n    }\n  }`
);

// 3. Update checkOutBooking
content = content.replace(
  /if \(booking\.allocatedRoomId\) \{\n\s+await prisma\.roomOrHall\.update\(\{ where: \{ id: booking\.allocatedRoomId \}, data: \{ status: 'DIRTY' \} \}\)\.catch\(\(\) => \{\}\);\n\s+\}/g,
  `if (booking.allocatedRoomId) {\n    const ids = booking.allocatedRoomId.split(',').map(id => id.trim()).filter(Boolean);\n    if (ids.length > 0) {\n      await prisma.roomOrHall.updateMany({ where: { id: { in: ids } }, data: { status: 'DIRTY' } }).catch(() => {});\n    }\n  }`
);

fs.writeFileSync(file, content, 'utf8');
console.log("Done");
