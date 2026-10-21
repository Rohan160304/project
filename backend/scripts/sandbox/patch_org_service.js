const fs = require('fs');
const file = 'src/modules/temples/organizations.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `      notices: {
        where: {
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' }
      },
      socialLinks: true,`;

const replacement = `      notices: {
        where: {
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' }
      },
      socialLinks: true,
      childOrganizations: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          state: true,
          imageUrl: true,
          bhojanshalaAvailability: true
        }
      },
      parentOrganization: {
        select: {
          id: true,
          name: true,
          type: true
        }
      },`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Patched');
