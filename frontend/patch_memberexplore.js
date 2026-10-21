const fs = require('fs');
let code = fs.readFileSync('src/pages/member/MemberExplorePage.jsx', 'utf8');

// We need to update mapResult to include the published flags and type
code = code.replace(
  '    followers: compactNumber(r.followerCount ?? 0),',
  '    followers: compactNumber(r.followerCount ?? 0),\n    type: r.type,\n    hasBhojanshala: r.hasBhojanshala,\n    bhojanshalaPublished: r.bhojanshalaPublished,\n    dharamshalaPublished: r.dharamshalaPublished,\n    pathshalaPublished: r.pathshalaPublished,'
);

// We need to update the isBhojanshala logic
code = code.replace(
  'const isBhojanshala = category === "bhojanshala" || item.type === "BHOJANSHALA" || item.hasBhojanshala;',
  'const isBhojanshala = category === "bhojanshala" || item.type === "BHOJANSHALA" || item.bhojanshalaPublished;'
);

fs.writeFileSync('src/pages/member/MemberExplorePage.jsx', code);
