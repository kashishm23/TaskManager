const app = require('../app');
const http = require('http');
const { sequelize, User, Project, ProjectMember } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = 5003;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

async function runTest() {
  console.log('[Test Projects]: Starting project API tests...');

  try {
    await sequelize.authenticate();
  } catch (dbError) {
    console.error('[Test Projects Error]: Database is not running.');
    process.exit(1);
  }

  // Cleanup old test data
  await Project.destroy({ where: { name: ['Test Project Alpha', 'Test Project Beta', 'Updated Project Alpha'] } });
  await User.destroy({ where: { email: ['admin-project@example.com', 'member-project@example.com'] } });

  // Create test users
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  const admin = await User.create({
    name: 'Project Admin',
    email: 'admin-project@example.com',
    password,
    role: 'Admin'
  });

  const member = await User.create({
    name: 'Project Member',
    email: 'member-project@example.com',
    password,
    role: 'Member'
  });

  const adminToken = generateToken(admin.id);
  const memberToken = generateToken(member.id);

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Projects]: Test server running on port ${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api/projects`;

  try {
    // 1. Admin creates a project (Project Alpha)
    console.log('\n[Test Projects]: 1. Creating project as Admin...');
    const createRes1 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Test Project Alpha',
        description: 'First test project'
      })
    });
    const createData1 = await createRes1.json();
    console.log('Status:', createRes1.status);
    console.log('Body:', createData1);

    if (createRes1.status !== 201) throw new Error('Project creation failed');
    const projectAlphaId = createData1.project.id;

    // 2. Member tries to create a project (Should fail 403)
    console.log('\n[Test Projects]: 2. Trying to create project as Member (Expected: 403)...');
    const createRes2 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({
        name: 'Test Project Beta',
        description: 'Should not succeed'
      })
    });
    console.log('Status:', createRes2.status);
    console.log('Body:', await createRes2.json());

    // 3. Admin updates Project Alpha
    console.log('\n[Test Projects]: 3. Updating project details as Admin...');
    const updateRes = await fetch(`${baseUrl}/${projectAlphaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Updated Project Alpha',
        description: 'Updated description'
      })
    });
    console.log('Status:', updateRes.status);
    console.log('Body:', await updateRes.json());

    // 4. Admin adds Member to Project Alpha
    console.log('\n[Test Projects]: 4. Adding Member to Project Alpha...');
    const addMemberRes = await fetch(`${baseUrl}/${projectAlphaId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ userId: member.id })
    });
    console.log('Status:', addMemberRes.status);
    console.log('Body:', await addMemberRes.json());

    // 5. Member fetches all projects (Should include Project Alpha)
    console.log('\n[Test Projects]: 5. Fetching projects as Member...');
    const getProjectsRes = await fetch(baseUrl, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const getProjectsData = await getProjectsRes.json();
    console.log('Status:', getProjectsRes.status);
    console.log('Projects Count:', getProjectsData.count);
    console.log('Projects:', getProjectsData.projects.map(p => ({ id: p.id, name: p.name })));

    // 6. Admin creates Project Beta (Member is NOT in it)
    console.log('\n[Test Projects]: 6. Creating Project Beta as Admin (no member added)...');
    const createRes3 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Test Project Beta',
        description: 'Second project'
      })
    });
    const createData3 = await createRes3.json();
    const projectBetaId = createData3.project.id;

    // 7. Member tries to view Project Beta details (Should fail 403)
    console.log(`\n[Test Projects]: 7. Accessing Project Beta details as Member (Expected: 403)...`);
    const viewBetaRes = await fetch(`${baseUrl}/${projectBetaId}`, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    console.log('Status:', viewBetaRes.status);
    console.log('Body:', await viewBetaRes.json());

    // 8. Admin deletes Project Alpha (Cleanup)
    console.log('\n[Test Projects]: 8. Deleting Project Alpha as Admin...');
    const deleteRes = await fetch(`${baseUrl}/${projectAlphaId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Status:', deleteRes.status);
    console.log('Body:', await deleteRes.json());

    console.log('\n[Test Projects]: SUCCESS! Project Management API tests passed.');
  } catch (error) {
    console.error('\n[Test Projects Error]: Test failed:', error.message);
  } finally {
    // Cleanup users and remaining projects
    await Project.destroy({ where: { name: ['Test Project Alpha', 'Test Project Beta', 'Updated Project Alpha'] } });
    await User.destroy({ where: { email: ['admin-project@example.com', 'member-project@example.com'] } });
    server.close();
    console.log('[Test Projects]: Cleanup complete and server closed.');
  }
}

runTest();
