const axios = require('axios');
const jwt = require('jsonwebtoken');

async function test() {
  const tokenPayload = {
    sub: "cmst8t3n2000dd3lxdv8bov1d", // SDE Super Admin
    mobile: "+919999900000",
    role: "SUPER_ADMIN",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60)
  };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || "SUPER_SECRET_KEY_MAKE_IT_LONG_1234");

  try {
    const res = await axios.post("http://localhost:3000/api/v1/auth/admins", {
      mobile: "+919999912353",
      firstName: "TestAdmin WithModules",
      role: "TEMPLE_ADMIN",
      organizationIds: ["cmst8tt8o001ad3lxct7sod1e"], // Valid Org ID from earlier
      modules: ["DASHBOARD"]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.status, JSON.stringify(res.data));
  } catch(e) {
    console.error("Failed:", e.response?.status, e.response?.data);
  }
}

test();
