const fs = require('fs');
let code = fs.readFileSync('src/pages/BhojanshalaManagementPage.jsx', 'utf8');

const publishLogic = `  const handleTogglePublish = async () => {
    if (!selectedOrg) return;
    try {
      const payload = { bhojanshalaPublished: !selectedOrg.bhojanshalaPublished };
      await api.patch(\`/temples/\${selectedOrg.id}\`, payload);
      toast.success(payload.bhojanshalaPublished ? "Bhojanshala published successfully!" : "Bhojanshala unpublished.");
      setOrganizations(orgs => orgs.map(o => o.id === selectedOrg.id ? { ...o, bhojanshalaPublished: payload.bhojanshalaPublished } : o));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);`;

code = code.replace(
  '  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);',
  publishLogic
);

const publishButton = `{(isGlobalScope || organizations.length > 0) && (
          <div className="flex items-center gap-4">
            {selectedOrg && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-slate-700">Published</span>
                <button
                  onClick={handleTogglePublish}
                  className={\`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none \${selectedOrg.bhojanshalaPublished ? 'bg-green-500' : 'bg-slate-300'}\`}
                >
                  <span className={\`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform \${selectedOrg.bhojanshalaPublished ? 'translate-x-4' : 'translate-x-1'}\`} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">`;

code = code.replace(
  /\{\(isGlobalScope \|\| organizations\.length > 0\) && \(\s*<div className="flex items-center gap-2">/,
  publishButton
);

fs.writeFileSync('src/pages/BhojanshalaManagementPage.jsx', code);
