const fs = require('fs');
const file = 'src/pages/OrgDetailPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'try { await apiClient.post(`${apiPrefix}/${id}/follow`); toast.success(`Following this ${entityLabel.toLowerCase()}.`); }',
  'try { await apiClient.post(`${apiPrefix}/${id}/follow`); toast.success(`Following this ${entityLabel.toLowerCase()}.`); loadOrg(); }'
);

content = content.replace(
  'try { await apiClient.delete(`${apiPrefix}/${id}/follow`); toast.success(`Unfollowed this ${entityLabel.toLowerCase()}.`); }',
  'try { await apiClient.delete(`${apiPrefix}/${id}/follow`); toast.success(`Unfollowed this ${entityLabel.toLowerCase()}.`); loadOrg(); }'
);

fs.writeFileSync(file, content);
console.log('Patched');
