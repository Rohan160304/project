const bcrypt = require('bcryptjs');
async function main() {
  const match = await bcrypt.compare('d32f26129dce', '$2a$10$CEHnPt1EC.pWSLKbYkZ5/etQIsUlNuQ8EAitCcZplfzdFbfVtexq2');
  console.log('Match?', match);
}
main();
