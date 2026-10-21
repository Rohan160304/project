const fs = require('fs');

const path = 'src/pages/OrgDetailPage.jsx';
let code = fs.readFileSync(path, 'utf8');

// Find all function declarations
const funcRegex = /function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/g;

let match;
const injections = [];

while ((match = funcRegex.exec(code)) !== null) {
  const funcName = match[1];
  const startIdx = match.index;
  const bodyStartIdx = match.index + match[0].length;
  
  // Quick check to skip OrgDetailPage itself
  if (funcName === 'OrgDetailPage') continue;

  // We need to see if "apiClient" is used inside this function.
  // It's easier to just blindly inject it if it doesn't already have it, 
  // or we can check the substring between this function and the next one (roughly).
  injections.push({
    name: funcName,
    bodyStartIdx: bodyStartIdx
  });
}

// Sort in reverse order to not mess up indices during insertion
injections.sort((a, b) => b.bodyStartIdx - a.bodyStartIdx);

for (const inj of injections) {
  // Check if it already has it
  const snippet = code.substring(inj.bodyStartIdx, inj.bodyStartIdx + 100);
  if (!snippet.includes('const apiClient = useContext(ApiClientContext);')) {
    code = code.substring(0, inj.bodyStartIdx) +
           '\n  const apiClient = useContext(ApiClientContext);' +
           code.substring(inj.bodyStartIdx);
  }
}

fs.writeFileSync(path, code);
console.log('Fixed apiClient in OrgDetailPage.jsx');
