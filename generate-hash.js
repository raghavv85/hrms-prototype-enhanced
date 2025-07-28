const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash for "password":', hash);
  
  // Test the hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash validation test:', isValid);
}

generateHash();
