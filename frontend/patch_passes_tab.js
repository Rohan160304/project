const fs = require('fs');
let code = fs.readFileSync('src/pages/BhojanshalaManagementPage.jsx', 'utf8');

// 1. Add searchQuery state
code = code.replace(
  '  const [isScanModalOpen, setIsScanModalOpen] = useState(false);',
  '  const [isScanModalOpen, setIsScanModalOpen] = useState(false);\n  const [searchQuery, setSearchQuery] = useState("");'
);

// 2. Compute filteredPasses
const filterLogic = `
  useEffect(() => {
    fetchPasses();
  }, [orgId]);

  const filteredPasses = passes.filter((p) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = p.member?.firstName?.toLowerCase().includes(q) || p.member?.lastName?.toLowerCase().includes(q);
    const idMatch = p.id?.toLowerCase().includes(q) || p.publicId?.toLowerCase().includes(q);
    return nameMatch || idMatch;
  });
`;

code = code.replace(
  /  useEffect\(\(\) => \{\n    fetchPasses\(\);\n  \}, \[orgId\]\);/g,
  filterLogic
);

// 3. Bind input to searchQuery
const inputOld = `<input \n            type="text" \n            placeholder="Search bookings by ID or Name..." \n            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"\n          />`;
const inputNew = `<input \n            type="text" \n            placeholder="Search bookings by ID or Name..." \n            value={searchQuery}\n            onChange={(e) => setSearchQuery(e.target.value)}\n            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"\n          />`;

code = code.replace(inputOld, inputNew);

// 4. Map over filteredPasses
const mapOld = `) : passes.map((bkg) => (`;
const mapNew = `) : filteredPasses.length === 0 ? (\n              <tr><td colSpan="7" className="text-center p-8 text-slate-500">No matching passes found.</td></tr>\n            ) : filteredPasses.map((bkg) => (`;

code = code.replace(mapOld, mapNew);

// 5. Add status logic for 'SCANNED'
const scannedStatusOld = `{bkg.status === 'PENDING' && (`;
const scannedStatusNew = `{bkg.status === 'SCANNED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Scanned
                    </span>
                  )}
                  {bkg.status === 'BOOKED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Booked
                    </span>
                  )}
                  {bkg.status === 'PENDING' && (`;

code = code.replace(scannedStatusOld, scannedStatusNew);

fs.writeFileSync('src/pages/BhojanshalaManagementPage.jsx', code);
