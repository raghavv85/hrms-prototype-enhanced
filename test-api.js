const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  try {
    console.log('🚀 Testing HRMS API endpoints...\n');

    // Test 1: Server health check
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running:', healthResponse.data.message);
    console.log('   Database Type:', healthResponse.data.databaseType);
    console.log('   Version:', healthResponse.data.version);
    console.log('');

    // Test 2: Login
    console.log('2. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'hradmin',
      password: 'password'
    });
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.user.username);
    console.log('   Role:', loginResponse.data.user.role);
    console.log('');

    // Set up headers for authenticated requests
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 3: Get employees
    console.log('3. Testing employees endpoint...');
    const employeesResponse = await axios.get(`${BASE_URL}/api/employees`, { headers });
    console.log('✅ Employees endpoint working');
    console.log('   Total employees:', employeesResponse.data.length);
    console.log('');

    // Test 4: Get attendance
    console.log('4. Testing attendance endpoint...');
    const attendanceResponse = await axios.get(`${BASE_URL}/api/attendance`, { headers });
    console.log('✅ Attendance endpoint working');
    console.log('   Total attendance records:', attendanceResponse.data.length);
    console.log('');

    // Test 5: Get performance
    console.log('5. Testing performance endpoint...');
    const performanceResponse = await axios.get(`${BASE_URL}/api/performance`, { headers });
    console.log('✅ Performance endpoint working');
    console.log('   Total performance records:', performanceResponse.data.length);
    console.log('');

    // Test 6: Get payroll (HR Admin only)
    console.log('6. Testing payroll endpoint...');
    const payrollResponse = await axios.get(`${BASE_URL}/api/payroll`, { headers });
    console.log('✅ Payroll endpoint working');
    console.log('   Total payroll records:', payrollResponse.data.length);
    console.log('');

    // Test 7: Get dashboard data
    console.log('7. Testing dashboard endpoint...');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/reports/dashboard`, { headers });
    console.log('✅ Dashboard endpoint working');
    console.log('   Dashboard data keys:', Object.keys(dashboardResponse.data));
    console.log('');

    console.log('🎉 All API tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Server: Running on port 5000');
    console.log('- Database: In-Memory (ready for PostgreSQL upgrade)');
    console.log('- Authentication: Working with JWT tokens');
    console.log('- All core modules: Functional');
    console.log('- Frontend: Should be accessible at http://localhost:3000');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testAPI();
