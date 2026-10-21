const fs = require('fs');
let code = fs.readFileSync('src/pages/OrgDetailPage.jsx', 'utf8');

code = code.replace(
  /function EditOrgDialog\([^)]+\)\s*\{/g,
  `$& \n  const apiClient = useContext(ApiClientContext);`
);

fs.writeFileSync('src/pages/OrgDetailPage.jsx', code);
console.log("Done EditOrgDialog!");
