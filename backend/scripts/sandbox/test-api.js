const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/v1/auth/otp/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response body:', body);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  mobile: '+919999999999',
  otp: '123456',
  purpose: 'REGISTER'
}));
req.end();
