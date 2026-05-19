const app = require('../app');
const http = require('http');
const { sequelize, User } = require('../models');

const PORT = 5001; // Using a unique port for test isolation

async function runTest() {
  console.log('[Test Auth]: Starting auth endpoints tests...');

  // Ensure DB connection is active
  try {
    await sequelize.authenticate();
  } catch (dbError) {
    console.error('[Test Auth Error]: Database is not running. Please start the database first.');
    process.exit(1);
  }

  // Clear any existing test user from previous runs
  await User.destroy({ where: { email: 'testauth@example.com' } });

  // Spin up a temporary server instance
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Auth]: Test server listening on port ${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api/auth`;

  try {
    // 1. Test registration endpoint
    console.log('\n[Test Auth]: 1. Testing POST /api/auth/register...');
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auth Test User',
        email: 'testauth@example.com',
        password: 'securePassword123',
        role: 'Admin'
      })
    });

    const regData = await registerResponse.json();
    console.log('Register Status:', registerResponse.status);
    console.log('Register Body:', regData);

    if (registerResponse.status !== 201 || !regData.token) {
      throw new Error('Registration failed or did not return token');
    }

    const testToken = regData.token;

    // 2. Test login endpoint
    console.log('\n[Test Auth]: 2. Testing POST /api/auth/login...');
    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testauth@example.com',
        password: 'securePassword123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    console.log('Login Body:', loginData);

    if (loginResponse.status !== 200 || !loginData.token) {
      throw new Error('Login failed or did not return token');
    }

    // 3. Test protected route (GET /me) using token
    console.log('\n[Test Auth]: 3. Testing GET /api/auth/me (Protected Route)...');
    const meResponse = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });

    const meData = await meResponse.json();
    console.log('Get Profile Status:', meResponse.status);
    console.log('Get Profile Body:', meData);

    if (meResponse.status !== 200 || !meData.success || meData.user.email !== 'testauth@example.com') {
      throw new Error('Accessing protected route failed');
    }

    console.log('\n[Test Auth]: SUCCESS! All authentication APIs passed verified!');
  } catch (error) {
    console.error('\n[Test Auth Error]: Test sequence failed:', error.message);
  } finally {
    // Cleanup: Delete the test user from database
    await User.destroy({ where: { email: 'testauth@example.com' } });
    server.close();
    console.log('[Test Auth]: Test server stopped. Cleanup completed.');
  }
}

runTest();
