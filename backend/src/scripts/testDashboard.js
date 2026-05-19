const app = require('../app');
const http = require('http');
const { sequelize, User, Project, ProjectMember, Task } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = 5005;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

async function runTest() {
  console.log('[Test Dashboard]: Starting dashboard analytics API tests...');

  try {
    await sequelize.authenticate();
  } catch (dbError) {
    console.error('[Test Dashboard Error]: Database connection failed.');
    process.exit(1);
  }

  // Cleanup old test data
  await Task.destroy({ where: { title: ['Dash Task 1', 'Dash Task 2', 'Dash Task 3', 'Dash Task 4'] } });
  await Project.destroy({ where: { name: 'Dash Project Alpha' } });
  await User.destroy({ where: { email: ['admin-dash@example.com', 'member-dash@example.com'] } });

  // Create test users
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  const admin = await User.create({
    name: 'Dash Admin',
    email: 'admin-dash@example.com',
    password,
    role: 'Admin'
  });

  const member = await User.create({
    name: 'Dash Member',
    email: 'member-dash@example.com',
    password,
    role: 'Member'
  });

  const adminToken = generateToken(admin.id);
  const memberToken = generateToken(member.id);

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Dashboard]: Test server running on port ${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api/dashboard/stats`;

  try {
    // 1. Create a project
    const projRes = await fetch(`http://localhost:${PORT}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Dash Project Alpha', description: 'Dashboard metrics' })
    });
    const projData = await projRes.json();
    const projectId = projData.project.id;

    // 2. Add Member to project
    await fetch(`http://localhost:${PORT}/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ userId: member.id })
    });

    // 3. Seed tasks with diverse dates and assignments
    // Task 1: Overdue Task (Assigned to Member, pending, due date in past)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    const pastDateStr = pastDate.toISOString().split('T')[0];

    // Task 2: Completed Task in Past (Assigned to Member, completed, due in past - NOT marked overdue!)
    // Task 3: Admin Task (Assigned to Admin, pending, due in future)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Task 4: In Progress Task (Assigned to Member, in progress, due in future)

    await Task.bulkCreate([
      {
        projectId,
        assignedTo: member.id,
        title: 'Dash Task 1',
        description: 'Overdue task',
        status: 'Pending',
        dueDate: pastDateStr
      },
      {
        projectId,
        assignedTo: member.id,
        title: 'Dash Task 2',
        description: 'Completed past task',
        status: 'Completed',
        dueDate: pastDateStr
      },
      {
        projectId,
        assignedTo: admin.id,
        title: 'Dash Task 3',
        description: 'Admin future task',
        status: 'Pending',
        dueDate: futureDateStr
      },
      {
        projectId,
        assignedTo: member.id,
        title: 'Dash Task 4',
        description: 'Member future task',
        status: 'In Progress',
        dueDate: futureDateStr
      }
    ]);

    // 4. Request stats as Admin (Expected global statistics)
    console.log('\n[Test Dashboard]: 1. Fetching stats as ADMIN (Expected: Total: 4, Pending: 2, In Progress: 1, Completed: 1, Overdue: 1)...');
    const adminStatsRes = await fetch(baseUrl, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminStatsData = await adminStatsRes.json();
    console.log('Status:', adminStatsRes.status);
    console.log('Admin Stats:', adminStatsData.stats);
    console.log('Project breakdown counts:', adminStatsData.projectAnalytics[0]?.stats);

    if (
      adminStatsData.stats.totalTasks !== 4 ||
      adminStatsData.stats.pendingTasks !== 2 ||
      adminStatsData.stats.inProgressTasks !== 1 ||
      adminStatsData.stats.completedTasks !== 1 ||
      adminStatsData.stats.overdueTasks !== 1
    ) {
      throw new Error('Admin statistics aggregation incorrect.');
    }

    // 5. Request stats as Member (Expected Member-scoped stats only)
    console.log('\n[Test Dashboard]: 2. Fetching stats as MEMBER (Expected: Total: 3, Pending: 1, In Progress: 1, Completed: 1, Overdue: 1)...');
    const memberStatsRes = await fetch(baseUrl, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const memberStatsData = await memberStatsRes.json();
    console.log('Status:', memberStatsRes.status);
    console.log('Member Stats:', memberStatsData.stats);
    console.log('Member Project breakdown counts:', memberStatsData.projectAnalytics[0]?.stats);

    if (
      memberStatsData.stats.totalTasks !== 3 ||
      memberStatsData.stats.pendingTasks !== 1 ||
      memberStatsData.stats.inProgressTasks !== 1 ||
      memberStatsData.stats.completedTasks !== 1 ||
      memberStatsData.stats.overdueTasks !== 1
    ) {
      throw new Error('Member statistics aggregation incorrect.');
    }

    console.log('\n[Test Dashboard]: SUCCESS! Dashboard metrics and role scoping verified.');
  } catch (error) {
    console.error('\n[Test Dashboard Error]: Test failed:', error.message);
  } finally {
    // Cleanup remaining test data
    await Task.destroy({ where: { title: ['Dash Task 1', 'Dash Task 2', 'Dash Task 3', 'Dash Task 4'] } });
    await Project.destroy({ where: { name: 'Dash Project Alpha' } });
    await User.destroy({ where: { email: ['admin-dash@example.com', 'member-dash@example.com'] } });
    server.close();
    console.log('[Test Dashboard]: Cleanup complete and server closed.');
  }
}

runTest();
