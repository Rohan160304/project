const fs = require('fs');
let code = fs.readFileSync('src/pages/BhojanshalaManagementPage.jsx', 'utf8');

// 1. Map totalAmount instead of pricePaid
code = code.replace(
  '<td className="px-6 py-4 text-slate-700 font-medium">₹{bkg.pricePaid}</td>',
  '<td className="px-6 py-4 text-slate-700 font-medium">₹{bkg.totalAmount}</td>'
);

// 2. Hide ID if pending
code = code.replace(
  '<td className="px-6 py-4 font-medium text-slate-900">{bkg.id.slice(-6).toUpperCase()}</td>',
  '<td className="px-6 py-4 font-medium text-slate-900">{bkg.status === "PENDING" ? <span className="text-slate-400 text-xs italic font-normal">Pending Approval</span> : <span className="font-mono text-orange-700">{bkg.publicId}</span>}</td>'
);

// 3. Update actions menu
code = code.replace(
  '<MoreVertical className="w-4 h-4" />',
  '<span className="text-xs text-slate-400">—</span>'
);

fs.writeFileSync('src/pages/BhojanshalaManagementPage.jsx', code);
