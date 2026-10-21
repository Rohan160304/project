const fs = require('fs');
const file = 'src/components/modals/CreatePassModal.jsx';
let code = fs.readFileSync(file, 'utf8');

// Imports
code = code.replace("import { X, Search, Calendar, Users, IndianRupee }", "import { X, Search, Calendar, Users, IndianRupee, Info, Calendar as CalendarIcon }");

// State and logic
const replacement = `
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orgData, setOrgData] = useState(null);

  React.useEffect(() => {
    if (isOpen && organizationId) {
      api.get(\`/bhojanshala/\${organizationId}/menu\`)
        .then(res => setMenuItems(res.data?.data || []))
        .catch(err => console.error("Failed to fetch menu", err));
      
      api.get(\`/temples/\${organizationId}\`)
        .then(res => setOrgData(res.data?.data))
        .catch(err => console.error("Failed to fetch orgData", err));
    }
  }, [isOpen, organizationId]);

  const currentDayOfWeek = React.useMemo(() => {
    if (!formData.date) return "";
    return new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' });
  }, [formData.date]);

  const availableMealsForDay = React.useMemo(() => {
    return menuItems.filter(m => m.dayOfWeek === currentDayOfWeek && m.isAvailable);
  }, [menuItems, currentDayOfWeek]);

  const selectedMenu = React.useMemo(() => {
    return availableMealsForDay.find(m => m.mealType === formData.mealType);
  }, [availableMealsForDay, formData.mealType]);

  const pricePerPerson = React.useMemo(() => {
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

  const calculatedTotalAmount = pricePerPerson * formData.numberOfPersons;

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, pricePaid: calculatedTotalAmount }));
  }, [calculatedTotalAmount]);

`;

code = code.replace("  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState(null);", replacement);

const menuDisplay = `
          {selectedMenu && (
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-orange-900 text-sm">{selectedMenu.itemName}</h4>
                  <p className="text-xs text-orange-700">{selectedMenu.description}</p>
                  {(selectedMenu.startTime && selectedMenu.endTime) && (
                     <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                       <CalendarIcon className="w-3 h-3"/> {selectedMenu.startTime} - {selectedMenu.endTime}
                     </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600">₹{pricePerPerson}</div>
                  <div className="text-[10px] text-orange-500 uppercase">per person</div>
                </div>
              </div>
            </div>
          )}

          {!selectedMenu && (
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 mt-0.5" />
              <p className="text-xs text-slate-600">
                Menu details are not available for this meal on {currentDayOfWeek}.
              </p>
            </div>
          )}
`;

code = code.replace('          <div className="grid grid-cols-2 gap-4">\n            <div>\n              <label className="block text-sm font-medium text-slate-700 mb-1">\n                No. of Persons', menuDisplay + '\n          <div className="grid grid-cols-2 gap-4">\n            <div>\n              <label className="block text-sm font-medium text-slate-700 mb-1">\n                No. of Persons');

fs.writeFileSync(file, code);
console.log("Patched CreatePassModal.jsx");
