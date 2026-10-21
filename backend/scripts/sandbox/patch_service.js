const fs = require('fs');
let code = fs.readFileSync('src/modules/temples/organizations.service.ts', 'utf8');

code = code.replace(
  "return prisma.organization.findMany({ where: { hasBhojanshala: true, deletedAt: null }, orderBy: { name: 'asc' } });",
  "return prisma.organization.findMany({ where: { OR: [ { bhojanshalaPublished: true }, { type: 'BHOJANSHALA' } ], deletedAt: null }, orderBy: { name: 'asc' } });"
);

fs.writeFileSync('src/modules/temples/organizations.service.ts', code);
