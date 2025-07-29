const axios = require('axios');

const testAuth = async () => {
  try {
    console.log('Testing authentication...');
    
    const response = await axios.post('http://localhost:5004/api/auth/login', {
      username: 'hradmin',
      password: 'password'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.response?.data);
  }
};

testAuth();
