const fs = require('fs');
const path = require('path');

const backendConstantsPath = path.join(__dirname, 'src', 'config', 'constants.ts');
let backendContent = fs.readFileSync(backendConstantsPath, 'utf8');

if (!backendContent.includes('BHOJANSHALAS:')) {
    backendContent = backendContent.replace(
        "TEMPLES: 'TEMPLES',",
        "TEMPLES: 'TEMPLES',\n  BHOJANSHALAS: 'BHOJANSHALAS',\n  PATHSHALAS: 'PATHSHALAS',\n  GOSHALAS: 'GOSHALAS',"
    );
    fs.writeFileSync(backendConstantsPath, backendContent);
    console.log('Added BHOJANSHALAS to backend constants');
}

const frontendAccessPath = path.join(__dirname, '..', 'Jinanam-Community-Frontend-main', 'src', 'lib', 'access.js');
let frontendContent = fs.readFileSync(frontendAccessPath, 'utf8');

if (!frontendContent.includes('key: "BHOJANSHALAS"')) {
    frontendContent = frontendContent.replace(
        '{ key: "TEMPLES", label: "Temple Management", category: "Organizations" },',
        '{ key: "TEMPLES", label: "Temple Management", category: "Organizations" },\n  { key: "BHOJANSHALAS", label: "Bhojanshala Management", category: "Organizations" },\n  { key: "PATHSHALAS", label: "Pathshala Management", category: "Organizations" },\n  { key: "GOSHALAS", label: "Goshala Management", category: "Organizations" },'
    );
    fs.writeFileSync(frontendAccessPath, frontendContent);
    console.log('Added BHOJANSHALAS to frontend access.js');
}
