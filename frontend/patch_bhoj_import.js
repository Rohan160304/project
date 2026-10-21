const fs = require('fs');
let code = fs.readFileSync('src/pages/BhojanshalaManagementPage.jsx', 'utf8');

if (!code.includes('ScanPassModal')) {
  code = code.replace(
    'import { CreateBhojanshalaPassModal } from "@/components/modals/CreateBhojanshalaPassModal";',
    'import { CreateBhojanshalaPassModal } from "@/components/modals/CreateBhojanshalaPassModal";\nimport { ScanPassModal } from "@/components/modals/ScanPassModal";'
  );
}

const modalPlacement = `
      <CreateBhojanshalaPassModal 
        open={isCreatePassModalOpen} 
        onClose={() => setIsCreatePassModalOpen(false)} 
        orgId={orgId} 
        onSuccess={fetchPasses}
      />
      <ScanPassModal
        open={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        orgId={orgId}
        onScanSuccess={fetchPasses}
      />
    </div>
  );
};
`;

code = code.replace(
  /      <CreateBhojanshalaPassModal [\s\S]*? \/>\n    <\/div>\n  \);\n\};\n/,
  modalPlacement
);

fs.writeFileSync('src/pages/BhojanshalaManagementPage.jsx', code);
