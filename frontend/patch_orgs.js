const fs = require('fs');
const files = [
  "src/pages/MemberReportsPage.jsx",
  "src/pages/ReportsPage.jsx",
  "src/pages/FeedbackPage.jsx",
  "src/pages/FamilyPage.jsx",
  "src/pages/EventsReportsPage.jsx",
  "src/pages/ReceiptsPage.jsx",
  "src/pages/CommunicationPage.jsx",
  "src/pages/ChaturmasPage.jsx",
  "src/pages/SettingsPage.jsx",
  "src/pages/IncorrectReportsPage.jsx",
  "src/pages/FaqPage.jsx",
  "src/pages/DonationReportsPage.jsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace useAuth destructuring
  content = content.replace(/const {([^}]+)} = useAuth\(\);/g, (match, p1) => {
    if (!p1.includes('activeOrganizationId')) {
      return `const {${p1}, activeOrganizationId} = useAuth();`;
    }
    return match;
  });
  
  // Replace orgId assignment
  content = content.replace(/const orgId = user\?\.organizationIds\?\.\[0\];/g, "const orgId = activeOrganizationId || user?.organizationIds?.[0];");
  
  fs.writeFileSync(file, content);
}
console.log("Patched successfully");
