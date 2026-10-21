const fs = require('fs');
let code = fs.readFileSync('src/constants/nav.config.js', 'utf8');

code = code.replace(
  /\{\s*id:\s*"group-people"[\s\S]*?children:\s*\[\s*\{\s*id:\s*"folder-members"/,
  '{\n        id: "folder-members"'
);

code = code.replace(
  /\{\s*id:\s*"com-dir"[\s\S]*?\}\s*\]\s*\}\s*\]\s*\},\s*\{\s*id:\s*"folder-temple"/,
  '{ id: "com-dir", label: "Contact Directory", route: "/admin/coming-soon?module=Committee Directory" }\n        ]\n      },\n\n      {\n        id: "folder-temple"'
);

code = code.replace(
  /\{\s*id:\s*"group-orgs"[\s\S]*?children:\s*\[\s*\{\s*id:\s*"folder-temple"/,
  '{\n        id: "folder-temple"'
);

code = code.replace(
  /\{\s*id:\s*"ev-an"[^\}]*\}\s*\]\s*\}\s*\]\s*\},\s*\{\s*id:\s*"group-community"/,
  '{ id: "ev-an", label: "Event Analytics", route: "/admin/event-analytics" }\n        ]\n      },\n\n  {\n    id: "group-community"'
);

fs.writeFileSync('src/constants/nav.config.js', code);
console.log('done');
