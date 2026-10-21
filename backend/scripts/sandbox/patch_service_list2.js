const fs = require('fs');
let code = fs.readFileSync('src/modules/temples/organizations.service.ts', 'utf8');

code = code.replace(
  "} else if (type === 'PATHSHALA') {\n    whereClause.OR = [ { type: 'PATHSHALA' }, { pathshalaPublished: true } ];\n  ",
  ""
);

fs.writeFileSync('src/modules/temples/organizations.service.ts', code);
