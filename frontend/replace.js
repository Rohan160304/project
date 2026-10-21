const fs = require('fs');
let code = fs.readFileSync('src/pages/OrgDetailPage.jsx', 'utf8');

// 1. Add context import
code = code.replace(
  'import { api, extractErrorMessage, STATIC_URL, API_BASE } from "@/lib/api";',
  'import { api as adminApi, extractErrorMessage, STATIC_URL, API_BASE } from "@/lib/api";\nimport { memberClient } from "@/lib/memberClient";\nimport React, { createContext, useContext } from "react";\nexport const ApiClientContext = createContext(adminApi);'
);

// 2. Add useContext to all component functions
const comps = ['GalleryTab', 'TrusteesTab', 'ContactsTab', 'NoticesTab', 'AnnouncementsTab', 'ReviewsTab', 'DhajaTab', 'ChaturmasTab', 'EventsTab', 'TimelineTab'];
for (const comp of comps) {
  code = code.replace(
    new RegExp(`function ${comp}\\([^{]+\\{`, 'g'),
    `$& \n  const apiClient = useContext(ApiClientContext);`
  );
}

// 3. Add useContext to OrgDetailPage
code = code.replace(
  'export default function OrgDetailPage(props) {',
  'export default function OrgDetailPage(props) {\n  const { isMemberView } = props;\n  const apiClient = isMemberView ? memberClient : adminApi;\n'
);

// 4. Wrap OrgDetailPage return in Provider
code = code.replace(
  'return (\n    <div data-testid="org-detail-page">',
  'return (\n    <ApiClientContext.Provider value={apiClient}>\n    <div data-testid="org-detail-page">'
);
// And the closing div
code = code.replace(
  '      <Confirm open={!!ticketOpen} message="Are you sure you want to discard this report?" onConfirm={() => { setTicketOpen(false); setTicketField(""); setTicketDesc(""); }} onCancel={() => {}} />\n    </div>\n  );\n}',
  '      <Confirm open={!!ticketOpen} message="Are you sure you want to discard this report?" onConfirm={() => { setTicketOpen(false); setTicketField(""); setTicketDesc(""); }} onCancel={() => {}} />\n    </div>\n    </ApiClientContext.Provider>\n  );\n}'
);

// 5. Replace all `api.` with `apiClient.` (carefully)
// Only match api.get, api.post, api.delete, api.patch, api.put
code = code.replace(/\bapi\.(get|post|delete|patch|put)/g, 'apiClient.$1');

fs.writeFileSync('src/pages/OrgDetailPage.jsx', code);
console.log("Done!");
