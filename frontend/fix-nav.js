const fs = require('fs');
const path = './src/constants/nav.config.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/route:\s*\"\/([^a\"]+.*?)\"/g, (match, p1) => {
  if (p1.startsWith('admin/')) {
    return match;
  }
  return `route: "/admin/${p1}"`;
});

fs.writeFileSync(path, content);
console.log('Fixed nav.config.js');
