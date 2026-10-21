const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.jsx', 'utf8');

// 1. Update state definition
code = code.replace(
  'const [hasDailyBhojanshala, setHasDailyBhojanshala] = useState(false);',
  'const [orgFacilities, setOrgFacilities] = useState({ hasBhojanshala: false, hasDharamshala: false, hasPathshala: false });'
);

// 2. Update fetch logic
code = code.replace(
  /const hasDaily = temples\.some.*?setHasDailyBhojanshala\(hasDaily\);/s,
  `const hasBhojanshala = temples.some(t => {
              const matchesOrg = isSuperAdmin ? true : (user.organizationIds?.includes(t._id) || user.organizationIds?.includes(t.id));
              return matchesOrg && (t.type === "BHOJANSHALA" || t.hasBhojanshala === true);
            });
            const hasDharamshala = temples.some(t => {
              const matchesOrg = isSuperAdmin ? true : (user.organizationIds?.includes(t._id) || user.organizationIds?.includes(t.id));
              return matchesOrg && (t.type === "DHARAMSHALA" || t.hasDharamshala === true);
            });
            const hasPathshala = temples.some(t => {
              const matchesOrg = isSuperAdmin ? true : (user.organizationIds?.includes(t._id) || user.organizationIds?.includes(t.id));
              return matchesOrg && t.hasPathshala === true;
            });
            setOrgFacilities({ hasBhojanshala, hasDharamshala, hasPathshala });`
);

// 3. Update isNodeAllowed signature
code = code.replace(
  'function isNodeAllowed(node, isSuperAdmin, user, authModules, hasDailyBhojanshala = false, parentModule = null) {',
  'function isNodeAllowed(node, isSuperAdmin, user, authModules, orgFacilities = {}, parentModule = null) {'
);

// 4. Update facility overrides
code = code.replace(
  /if \(node\.id === "folder-bhojanshala" \|\| node\.id\?\.startsWith\("bh-"\)\) \{.*?\}  \/\//s,
  `if (node.id === "folder-bhojanshala" || node.id?.startsWith("bh-") || node.id === "flat-bhojanshala") {
    if (!orgFacilities.hasBhojanshala && !isSuperAdmin) return false;
  }
  if (node.id === "folder-dharamshala-admin" || node.id === "flat-dharamshalas") {
    if (!orgFacilities.hasDharamshala && !isSuperAdmin) return false;
  }
  if (node.id === "br-path") {
    if (!orgFacilities.hasPathshala && !isSuperAdmin) return false;
  }

  //`
);

// 5. Update recursive calls
code = code.replaceAll('hasDailyBhojanshala', 'orgFacilities');

fs.writeFileSync('src/components/layout/Sidebar.jsx', code);
