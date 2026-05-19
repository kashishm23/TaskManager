const app = require('../app');
const http = require('http');
const { sequelize, User } = require('../models');

const PORT = 5006;

async function runTest() {
  console.log('[Test Validation]: Starting backend validation and error handling tests...');

  try {
    await sequelize.authenticate();
  } catch (dbError) {
    console.error('[Test Validation Error]: Database is not running.');
    process.exit(1);
  }

  // Clear existing duplicate user if leftover
  await User.destroy({ where: { email: 'unique@example.com' } });

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Validation]: Test server running on port ${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 1. Test Registration Input Validation (Failure case)
    console.log('\n[Test Validation]: 1. Testing Registration Validation with invalid body...');
    const regFailRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'a',              // fails: too short (min 2)
        email: 'invalid-email', // fails: invalid email format
        password: '123'         // fails: too short (min 6)
      })
    });
    const regFailData = await regFailRes.json();
    console.log('Response Status:', regFailRes.status);
    console.log('Response Errors:', regFailData.errors);

    if (regFailRes.status !== 400 || !regFailData.errors || regFailData.errors.length !== 3) {
      throw new Error('Registration input validation failed to report errors correctly');
    }

    // 2. Test Unique Constraint Validation (Database level via Error Handler)
    console.log('\n[Test Validation]: 2. Testing Unique Email Database Constraint handler...');
    
    // Register the first user successfully
    await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unique User',
        email: 'unique@example.com',
        password: 'password123'
      })
    });

    // Attempt to register another user with the same email
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: 'unique@example.com',
        password: 'password123'
      })
    });
    const dupData = await dupRes.json();
    console.log('Response Status:', dupRes.status);
    console.log('Response Message:', dupData.message);

    if (dupRes.status !== 400 || (!dupData.message.includes('already in use') && !dupData.message.includes('unique'))) {
      throw new Error('Unique constraint database validation was not handled properly');
    }

    console.log('\n[Test Validation]: SUCCESS! Validation and error handling middleware works perfectly!');
  } catch (error) {
    console.error('\n[Test Validation Error]: Test failed:', error.message);
  } finally {
    // Cleanup
    await User.destroy({ where: { email: 'unique@example.com' } });
    server.close();
    console.log('[Test Validation]: Cleanup completed and server stopped.');
  }
}

runTest();
