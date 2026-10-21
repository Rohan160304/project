const fs = require('fs');
let code = fs.readFileSync('src/pages/BhojanshalaManagementPage.jsx', 'utf8');

code = code.replace(
  '            </select>\n          </div>\n        )}',
  '            </select>\n          </div>\n        </div>\n        )}'
);

fs.writeFileSync('src/pages/BhojanshalaManagementPage.jsx', code);
