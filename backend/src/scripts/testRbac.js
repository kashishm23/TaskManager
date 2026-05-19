const express = require('express');
const http = require('http');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = 5002;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

async function runTest() {
  console.log('[Test RBAC]: Initializing RBAC test suite...');

  // Setup test Express routes dynamically to avoid polluting production server files
  const testApp = express();
  testApp.use(express.json());

  // Admin-only route
  testApp.get('/admin-route', protect, authorize('Admin'), (req, res) => {
    res.json({ success: true, message: 'Welcome Admin!' });
  });

  // Shared route for Admins and Members
  testApp.get('/shared-route', protect, authorize('Admin', 'Member'), (req, res) => {
    res.json({ success: true, message: 'Welcome User!' });
  });

  try {
    await sequelize.authenticate();
  } catch (dbError) {
    console.error('[Test RBAC Error]: Database connection failed.');
    process.exit(1);
  }

  // Clear previous test users
  await User.destroy({ where: { email: ['admin-rbac@example.com', 'member-rbac@example.com'] } });

  // Create password hash
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  // Seed test users with different roles
  const adminUser = await User.create({
    name: 'RBAC Admin',
    email: 'admin-rbac@example.com',
    password,
    role: 'Admin'
  });

  const memberUser = await User.create({
    name: 'RBAC Member',
    email: 'member-rbac@example.com',
    password,
    role: 'Member'
  });

  const adminToken = generateToken(adminUser.id);
  const memberToken = generateToken(memberUser.id);

  // Spin up temporary test server
  const server = http.createServer(testApp);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test RBAC]: Test server running on port ${PORT}`);

  const baseUrl = `http://localhost:${PORT}`;

  try {
    // 1. Admin accessing Admin-only route
    console.log('\n[Test RBAC]: 1. Accessing Admin-only route as an Admin (Expected: 200 Success)...');
    const res1 = await fetch(`${baseUrl}/admin-route`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const body1 = await res1.json();
    console.log('Response Status:', res1.status);
    console.log('Response Body:', body1);

    if (res1.status !== 200 || !body1.success) {
      throw new Error('Admin user was denied access to Admin route.');
    }

    // 2. Member accessing Admin-only route
    console.log('\n[Test RBAC]: 2. Accessing Admin-only route as a Member (Expected: 403 Forbidden)...');
    const res2 = await fetch(`${baseUrl}/admin-route`, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const body2 = await res2.json();
    console.log('Response Status:', res2.status);
    console.log('Response Body:', body2);

    if (res2.status !== 403 || body2.success) {
      throw new Error('Member user was incorrectly allowed access to Admin route.');
    }

    // 3. Member accessing Shared route
    console.log('\n[Test RBAC]: 3. Accessing Shared route as a Member (Expected: 200 Success)...');
    const res3 = await fetch(`${baseUrl}/shared-route`, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const body3 = await res3.json();
    console.log('Response Status:', res3.status);
    console.log('Response Body:', body3);

    if (res3.status !== 200 || !body3.success) {
      throw new Error('Member user was denied access to Shared route.');
    }

    // 4. Unauthorized access (no token)
    console.log('\n[Test RBAC]: 4. Accessing route with no token (Expected: 401 Unauthorized)...');
    const res4 = await fetch(`${baseUrl}/shared-route`);
    const body4 = await res4.json();
    console.log('Response Status:', res4.status);
    console.log('Response Body:', body4);

    if (res4.status !== 401 || body4.success) {
      throw new Error('Request was incorrectly authorized without token.');
    }

    console.log('\n[Test RBAC]: SUCCESS! Role-Based Access Control verified successfully!');
  } catch (error) {
    console.error('\n[Test RBAC Error]: Test suite failed:', error.message);
  } finally {
    // Cleanup database entries and shut down server
    await User.destroy({ where: { email: ['admin-rbac@example.com', 'member-rbac@example.com'] } });
    server.close();
    console.log('[Test RBAC]: Test server stopped. Cleanup completed.');
  }
}

runTest();
