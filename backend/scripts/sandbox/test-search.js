const axios = require('axios');
async function test() {
  try {
    const login = await axios.post('http://localhost:4000/api/v1/auth/login', { phone: '9999999999' }); // assuming dummy login or something?
  } catch(e) {
    console.log("Error:", e.message);
  }
}
test();
