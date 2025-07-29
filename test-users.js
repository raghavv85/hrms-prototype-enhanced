const { User } = require('./models');

const testUsers = async () => {
  try {
    console.log('Checking users in database...');
    
    const users = await User.findAll();
    console.log('Total users:', users.length);
    
    for (const user of users) {
      console.log(`User: ${user.username}, Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`);
    }
    
    // Test finding by username
    const hradmin = await User.findByUsername('hradmin');
    if (hradmin) {
      console.log('✅ Found hradmin user');
      console.log('Password hash:', hradmin.password);
      
      // Test password validation
      const isValid = await hradmin.validatePassword('password');
      console.log('Password validation result:', isValid);
    } else {
      console.log('❌ hradmin user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
};

testUsers();
