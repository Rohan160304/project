const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ScanPassModal.jsx', 'utf8');

code = code.replace(
  'export function ScanPassModal({ open, onClose, orgId, onScanSuccess }) {',
  'export function ScanPassModal({ isOpen, onClose, organizationId, onScanSuccess }) {\n  const open = isOpen;\n  const orgId = organizationId;'
);

fs.writeFileSync('src/components/modals/ScanPassModal.jsx', code);
