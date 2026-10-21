const fs = require('fs');
let code = fs.readFileSync('src/pages/OrgDetailPage.jsx', 'utf8');

const comps = ['GalleryTab', 'TrusteesTab', 'ContactsTab', 'NoticesTab', 'AnnouncementsTab', 'ReviewsTab', 'DhajaTab', 'ChaturmasTab', 'EventsTab', 'TimelineTab'];
for (const comp of comps) {
  // Regex to match "function ComponentName(anything) {"
  code = code.replace(
    new RegExp(`function ${comp}\\([^)]+\\)\\s*\\{`, 'g'),
    `$& \n  const apiClient = useContext(ApiClientContext);`
  );
}

fs.writeFileSync('src/pages/OrgDetailPage.jsx', code);
console.log("Done!");
