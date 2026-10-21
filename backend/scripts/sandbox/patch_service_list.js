const fs = require('fs');
let code = fs.readFileSync('src/modules/temples/organizations.service.ts', 'utf8');

code = code.replace(
  /export async function listOrganizations\(type: OrganizationType, filters: \{ city\?: string; state\?: string; hasBhojanshala\?: boolean \}\) \{\n  return prisma\.organization\.findMany\(\{\n    where: \{\n      type,\n      deletedAt: null,\n      city: filters\.city,\n      state: filters\.state,\n      hasBhojanshala: filters\.hasBhojanshala,\n    \},/g,
  `export async function listOrganizations(type: OrganizationType, filters: { city?: string; state?: string; hasBhojanshala?: boolean }) {
  const whereClause: any = {
    deletedAt: null,
    city: filters.city,
    state: filters.state,
  };

  if (filters.hasBhojanshala !== undefined) {
    whereClause.hasBhojanshala = filters.hasBhojanshala;
  }

  if (type === 'DHARAMSHALA') {
    whereClause.OR = [ { type: 'DHARAMSHALA' }, { dharamshalaPublished: true } ];
  } else if (type === 'BHOJANSHALA') {
    whereClause.OR = [ { type: 'BHOJANSHALA' }, { bhojanshalaPublished: true } ];
  } else if (type === 'PATHSHALA') {
    whereClause.OR = [ { type: 'PATHSHALA' }, { pathshalaPublished: true } ];
  } else {
    whereClause.type = type;
  }

  return prisma.organization.findMany({
    where: whereClause,`
);

fs.writeFileSync('src/modules/temples/organizations.service.ts', code);
