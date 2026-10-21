const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/v1/events/member?scope=upcoming', {
      headers: { 'Authorization': 'Bearer ' + process.env.TEST_TOKEN }
    });
    console.log(res.data.data.items[0]);
  } catch(e) {
    console.log(e.response?.data || e.message);
  }
}
test();
