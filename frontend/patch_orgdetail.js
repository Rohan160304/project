const fs = require('fs');
let code = fs.readFileSync('src/pages/OrgDetailPage.jsx', 'utf8');

// Inside OrgDetailPage component:
// We need to define the flags at the top of the component or just replace org.hasBhojanshala inline.
// Replacing inline with `(isMemberView ? org.bhojanshalaPublished : org.hasBhojanshala)` might be risky if we break something.
// Wait, the Edit forms also use `hasBhojanshala`, which should strictly remain `hasBhojanshala`.
// So we must only change rendering logic, not forms.

// Let's replace only the specific places where it decides to show the tab or details.

code = code.replace(
  'if (tab === "bhojanshala" && (!isBhojanshala && (!org.hasBhojanshala || org.bhojanshalaAvailability?.toLowerCase() == "daily"))) return null;',
  'if (tab === "bhojanshala" && (!isBhojanshala && (!(isMemberView ? org.bhojanshalaPublished : org.hasBhojanshala) || org.bhojanshalaAvailability?.toLowerCase() == "daily"))) return null;'
);

code = code.replace(
  '["Bhojanshala", (org.hasBhojanshala || org.childOrganizations?.some(c => c.type === "BHOJANSHALA")) ? t("Yes ✓") : t("No")],',
  '["Bhojanshala", ((isMemberView ? org.bhojanshalaPublished : org.hasBhojanshala) || org.childOrganizations?.some(c => c.type === "BHOJANSHALA")) ? t("Yes ✓") : t("No")],'
);

code = code.replace(
  '                    {org.hasBhojanshala && (',
  '                    {(isMemberView ? org.bhojanshalaPublished : org.hasBhojanshala) && ('
);

code = code.replace(
  '                  {org.hasBhojanshala ? (',
  '                  {(isMemberView ? org.bhojanshalaPublished : org.hasBhojanshala) ? ('
);

code = code.replace(
  '{isMemberView && (org.hasBhojanshala || org.type === \'BHOJANSHALA\') && (',
  '{isMemberView && (org.bhojanshalaPublished || org.type === \'BHOJANSHALA\') && ('
);

fs.writeFileSync('src/pages/OrgDetailPage.jsx', code);
