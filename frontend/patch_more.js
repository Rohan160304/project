const fs = require('fs');
const files = [
  "src/pages/NonJainMembersPage.jsx",
  "src/pages/VisitorsPage.jsx",
  "src/pages/BookingCalendarPage.jsx",
  "src/pages/pathshala/PathshalaManagementPage.jsx",
  "src/pages/gaushala/GaushalaManagementPage.jsx",
  "src/pages/dharamshala/DharamshalaManagementPage.jsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/const {([^}]+)} = useAuth\(\);/g, (match, p1) => {
    if (!p1.includes('activeOrganizationId')) {
      return `const {${p1}, activeOrganizationId} = useAuth();`;
    }
    return match;
  });
  
  content = content.replace(/const orgId = user\?\.organizationIds\?\.\[0\];/g, "const orgId = activeOrganizationId || user?.organizationIds?.[0];");
  content = content.replace(/user\?\.organizationIds\?\.\[0\]/g, "(activeOrganizationId || user?.organizationIds?.[0])");
  
  fs.writeFileSync(file, content);
}
console.log("Patched more successfully");
