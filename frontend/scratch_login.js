const axios = require('axios');
const run = async () => {
  const loginRes = await axios.post('http://localhost:4000/api/v1/auth/login-with-otp', {
    mobile: "+916263584175",
    otp: "123456",
    device: { deviceId: "123", deviceType: "web" }
  });
  const token = loginRes.data.data.accessToken;
  const modulesRes = await axios.get('http://localhost:4000/api/v1/auth/me/modules', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("MODULES", modulesRes.data.data);
};
run().catch(console.error);
