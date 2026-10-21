const fs = require('fs');
const path = 'src/pages/member/MemberFeedPage.jsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  'if (p.isAd) return true;\n    if (search) {\n      const q = search.toLowerCase();\n      const matchText =\n        p.title?.toLowerCase().includes(q) || p.org?.toLowerCase().includes(q);\n      const matchId = p.entityPublicId?.toLowerCase().includes(q);\n      if (!matchText && !matchId) return false;\n    }',
  `if (search) {
      const q = search.toLowerCase();
      const matchText =
        p.title?.toLowerCase().includes(q) || 
        p.org?.toLowerCase().includes(q) ||
        p.body?.toLowerCase().includes(q);
      const matchId = p.entityPublicId?.toLowerCase().includes(q);
      if (!matchText && !matchId) return false;
    }
    if (p.isAd && !sponsoredOnly && category === "All") return true; // Ads bypass category if in All, but not search
    // wait, if category !== All, ads might need to bypass category? 
    // The original said: if (p.isAd) return true;
    // So ads bypassed category filter completely.
    if (p.isAd) return true; // Keep original bypass for category, but AFTER search
`
);
fs.writeFileSync(path, content);
console.log('done');
