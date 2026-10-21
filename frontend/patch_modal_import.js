const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ScanPassModal.jsx', 'utf8');

code = code.replace(
  'import { extractErrorMessage } from "@/utils/error";',
  '// import { extractErrorMessage } from "@/utils/error"; // removed'
);

code = code.replace(
  'import { api } from "@/lib/api";',
  'import { api, extractErrorMessage } from "@/lib/api";'
);

fs.writeFileSync('src/components/modals/ScanPassModal.jsx', code);
