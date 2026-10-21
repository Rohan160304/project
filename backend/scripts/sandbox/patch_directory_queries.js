const fs = require('fs');
let code = fs.readFileSync('src/modules/temples/organizations.service.ts', 'utf8');

// Patch listOrganizations
code = code.replace(
  /if \(type === 'DHARAMSHALA'\) \{\n    whereClause.OR = \[ \{ type: 'DHARAMSHALA' \}, \{ dharamshalaPublished: true \} \];\n  \} else if \(type === 'BHOJANSHALA'\) \{\n    whereClause.OR = \[ \{ type: 'BHOJANSHALA' \}, \{ bhojanshalaPublished: true \} \];\n  \} else \{\n    whereClause.type = type;\n  \}/,
  `if (type === 'DHARAMSHALA') {
    whereClause.dharamshalaPublished = true;
  } else if (type === 'BHOJANSHALA') {
    whereClause.bhojanshalaPublished = true;
  } else {
    whereClause.type = type;
  }`
);

// Patch listBhojanalayDirectory
code = code.replace(
  /OR: \[\n        \{ type: 'BHOJANSHALA' \},\n        \{ bhojanshalaPublished: true \}\n      \]/g,
  `bhojanshalaPublished: true`
);

fs.writeFileSync('src/modules/temples/organizations.service.ts', code);
