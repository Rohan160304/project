const fs = require('fs');
let code = fs.readFileSync('src/pages/dharamshala/DharamshalaManagementPage.jsx', 'utf8');

const publishLogic = `  const handleTogglePublish = async () => {
    if (!organization) return;
    setSaving(true);
    try {
      const payload = { dharamshalaPublished: !organization.dharamshalaPublished };
      await api.patch(\`/temples/\${orgId}\`, payload);
      toast.success(payload.dharamshalaPublished ? "Dharamshala published successfully!" : "Dharamshala unpublished.");
      setOrganization({ ...organization, dharamshalaPublished: payload.dharamshalaPublished });
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const COMMON_AMENITIES = [`;

code = code.replace(
  '  const COMMON_AMENITIES = [',
  publishLogic
);

const publishButton = `{isSuperAdmin && (
          <OrgSelect
            value={selectedOrg || orgId}
            onChange={setSelectedOrg}
            options={dharamshalas}
            label={t("Select Dharamshala")}
            className="w-full md:w-64"
          />
        )}
        {organization && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-slate-700">Published</span>
            <button
              onClick={handleTogglePublish}
              disabled={saving}
              className={\`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 \${organization.dharamshalaPublished ? 'bg-green-500' : 'bg-slate-300'}\`}
            >
              <span className={\`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform \${organization.dharamshalaPublished ? 'translate-x-4' : 'translate-x-1'}\`} />
            </button>
          </div>
        )}`;

code = code.replace(
  /\{isSuperAdmin && \(\s*<OrgSelect\s*value=\{selectedOrg \|\| orgId\}\s*onChange=\{setSelectedOrg\}\s*options=\{dharamshalas\}\s*label=\{t\("Select Dharamshala"\)\}\s*className="w-full md:w-64"\s*\/>\s*\)\}/,
  publishButton
);

fs.writeFileSync('src/pages/dharamshala/DharamshalaManagementPage.jsx', code);
