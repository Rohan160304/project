const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/v1/events/JFEV108', {
      headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI...` } // Wait, I don't have the token.
    });
    console.log(res.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
test();
