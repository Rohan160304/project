const fs = require('fs');
let code = fs.readFileSync('src/modules/temples/organizations.service.ts', 'utf8');

code = code.replace(
  "where: { OR: [ { bhojanshalaPublished: true }, { type: 'BHOJANSHALA' } ], deletedAt: null }",
  "where: { bhojanshalaPublished: true, deletedAt: null }"
);

fs.writeFileSync('src/modules/temples/organizations.service.ts', code);
