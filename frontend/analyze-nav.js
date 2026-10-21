const fs = require('fs');
const path = './src/constants/nav.config.js';
const content = fs.readFileSync(path, 'utf8');

const regex = /\{[^}]*id:\s*"([^"]+)"[^}]*label:\s*"([^"]+)"[^}]*route:\s*"([^"]+)"[^}]*\}/g;
let match;
let completed = [];
let comingSoon = [];

while ((match = regex.exec(content)) !== null) {
  const label = match[2];
  const route = match[3];
  if (route.includes('coming-soon')) {
    comingSoon.push(label);
  } else {
    completed.push(label);
  }
}

console.log(`\n=== COMPLETED (${completed.length}) ===\n`);
console.log(completed.join(', '));
console.log(`\n=== COMING SOON (${comingSoon.length}) ===\n`);
console.log(comingSoon.join(', '));
