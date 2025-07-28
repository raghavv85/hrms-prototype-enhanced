const http = require('http');

function testLogin() {
  const postData = JSON.stringify({
    username: 'hradmin',
    password: 'password'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Testing login API...');

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Login successful!');
      } else {
        console.log('❌ Login failed!');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
  });

  req.write(postData);
  req.end();
}

testLogin();
