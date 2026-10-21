const fs = require('fs');
let code = fs.readFileSync('src/components/modals/BhojanshalaBookingModal.jsx', 'utf8');

// Add orgData state
code = code.replace(
  'const [menuItems, setMenuItems] = useState([]);',
  `const [menuItems, setMenuItems] = useState([]);\n  const [orgData, setOrgData] = useState(null);`
);

// Add fetch orgData
code = code.replace(
  '.catch(err => console.error("Failed to fetch menu", err));',
  `.catch(err => console.error("Failed to fetch menu", err));\n      \n      memberClient.get(\`/temples/\${orgId}\`)\n        .then(res => setOrgData(res.data?.data))\n        .catch(err => console.error("Failed to fetch orgData", err));`
);

// Update price calculation
const oldPriceCode = `const pricePerPerson = selectedMenu?.price || 0;\n  const totalAmount = pricePerPerson * formData.numberOfPersons;`;
const newPriceCode = `const pricePerPerson = React.useMemo(() => {
    if (selectedMenu && selectedMenu.price !== null && selectedMenu.price !== undefined && selectedMenu.price !== "") {
      return Number(selectedMenu.price);
    }
    if (orgData) {
      if (formData.mealType === 'BREAKFAST') return Number(orgData.bhojanshalaBreakfastCharge) || 0;
      if (formData.mealType === 'LUNCH') return Number(orgData.bhojanshalaLunchCharge) || 0;
      if (formData.mealType === 'DINNER') return Number(orgData.bhojanshalaDinnerCharge) || 0;
    }
    return 0;
  }, [selectedMenu, formData.mealType, orgData]);

  const totalAmount = pricePerPerson * formData.numberOfPersons;`;

code = code.replace(oldPriceCode, newPriceCode);

fs.writeFileSync('src/components/modals/BhojanshalaBookingModal.jsx', code);
