const axios = require('axios');
axios.post('http://localhost:4000/api/v1/auth/otp/request', { mobile: '+919999999999', purpose: 'REGISTER' })
  .then(res => {
    console.log("REQUEST OTP Response:", res.data);
    return axios.post('http://localhost:4000/api/v1/auth/otp/verify', { mobile: '+919999999999', otp: res.data.data.devOtp, purpose: 'REGISTER' });
  })
  .then(res => {
    console.log("VERIFY OTP Response keys:", Object.keys(res));
    console.log("VERIFY OTP res.data:", res.data);
  })
  .catch(err => console.error(err.response ? err.response.data : err));
