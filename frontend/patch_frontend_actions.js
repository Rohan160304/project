const fs = require('fs');
let code = fs.readFileSync('src/pages/BhojanshalaManagementPage.jsx', 'utf8');

// 1. Add handleCancel
const handleApproveCode = `const handleApprove = async (passId) => {`;
const handleCancelCode = `
  const handleCancel = async (passId) => {
    if (!window.confirm("Are you sure you want to cancel this pass?")) return;
    let toastId;
    try {
      toastId = toast.loading("Cancelling pass...");
      await api.patch(\`/bhojanshala/\${orgId}/passes/\${passId}/cancel\`);
      toast.success("Pass cancelled successfully", { id: toastId });
      fetchPasses();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(extractErrorMessage(error));
    }
  };

  const handleApprove = async (passId) => {`;
  
code = code.replace(handleApproveCode, handleCancelCode);

// 2. Replace the action cell rendering
const oldActionCell = `<td className="px-6 py-4 text-right">
                  {bkg.status === 'PENDING' ? (
                    <button 
                      onClick={() => handleApprove(bkg.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>`;

const newActionCell = `<td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                  {bkg.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleApprove(bkg.id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleCancel(bkg.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg shadow-sm transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {bkg.status === 'BOOKED' && (
                    <button 
                      onClick={() => handleCancel(bkg.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg shadow-sm transition-colors"
                    >
                      Cancel Pass
                    </button>
                  )}
                  {['SCANNED', 'CANCELLED', 'EXPIRED'].includes(bkg.status) && (
                    <span className="text-xs text-slate-400 px-3 py-1.5">—</span>
                  )}
                </td>`;

code = code.replace(oldActionCell, newActionCell);

fs.writeFileSync('src/pages/BhojanshalaManagementPage.jsx', code);
console.log("Frontend actions patched");
