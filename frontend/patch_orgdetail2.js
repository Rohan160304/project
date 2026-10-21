const fs = require('fs');
let code = fs.readFileSync('src/pages/OrgDetailPage.jsx', 'utf8');

code = code.replace(
  '                    {org.hasDharamshala && (',
  '                    {(isMemberView ? org.dharamshalaPublished : org.hasDharamshala) && ('
);

code = code.replace(
  '                    {org.hasPathshala && (',
  '                    {(isMemberView ? org.pathshalaPublished : org.hasPathshala) && ('
);

fs.writeFileSync('src/pages/OrgDetailPage.jsx', code);
