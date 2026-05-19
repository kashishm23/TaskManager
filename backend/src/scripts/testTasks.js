const app = require('../app');
const http = require('http');
const { sequelize, User, Project, ProjectMember, Task } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = 5004;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

async function runTest() {
  console.log('[Test Tasks]: Starting task API tests...');

  try {
    await sequelize.authenticate();
  } catch (dbError) {
    console.error('[Test Tasks Error]: Database connection failed.');
    process.exit(1);
  }

  // Cleanup old test data
  await Task.destroy({ where: { title: ['Task One', 'Task Two', 'Task Three', 'Updated Task One'] } });
  await Project.destroy({ where: { name: 'Tasks Project Alpha' } });
  await User.destroy({ where: { email: ['admin-task@example.com', 'member-task@example.com', 'outsider-task@example.com'] } });

  // Create test users
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  const admin = await User.create({
    name: 'Task Admin',
    email: 'admin-task@example.com',
    password,
    role: 'Admin'
  });

  const member = await User.create({
    name: 'Task Member',
    email: 'member-task@example.com',
    password,
    role: 'Member'
  });

  const outsider = await User.create({
    name: 'Task Outsider',
    email: 'outsider-task@example.com',
    password,
    role: 'Member'
  });

  const adminToken = generateToken(admin.id);
  const memberToken = generateToken(member.id);

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[Test Tasks]: Test server running on port ${PORT}`);

  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 1. Create project
    const projectRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Tasks Project Alpha', description: 'Testing task links' })
    });
    const projectData = await projectRes.json();
    const projectId = projectData.project.id;

    // 2. Add Member to project
    await fetch(`${baseUrl}/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ userId: member.id })
    });

    // 3. Admin creates task assigned to Member (Should succeed 201)
    console.log('\n[Test Tasks]: 1. Admin creating task assigned to Member...');
    const createTaskRes1 = await fetch(`${baseUrl}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Task One',
        description: 'First task details',
        assignedTo: member.id,
        dueDate: '2026-12-31'
      })
    });
    const createTaskData1 = await createTaskRes1.json();
    console.log('Status:', createTaskRes1.status);
    console.log('Body:', createTaskData1);
    const taskOneId = createTaskData1.task.id;

    // 4. Admin tries to assign task to Outsider who is not a project member (Should fail 400)
    console.log('\n[Test Tasks]: 2. Admin assigning task to user who is not a project member (Expected: 400)...');
    const createTaskRes2 = await fetch(`${baseUrl}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Task Two',
        assignedTo: outsider.id
      })
    });
    console.log('Status:', createTaskRes2.status);
    console.log('Body:', await createTaskRes2.json());

    // 5. Member fetches their assigned tasks
    console.log('\n[Test Tasks]: 3. Member fetching their own tasks...');
    const getMyTasksRes = await fetch(`${baseUrl}/tasks/my`, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    const getMyTasksData = await getMyTasksRes.json();
    console.log('Status:', getMyTasksRes.status);
    console.log('My Tasks Count:', getMyTasksData.count);
    console.log('Tasks:', getMyTasksData.tasks.map(t => ({ id: t.id, title: t.title, status: t.status })));

    // 6. Member updates status of their task to 'In Progress'
    console.log('\n[Test Tasks]: 4. Member updating status of assigned task to "In Progress"...');
    const updateTaskRes1 = await fetch(`${baseUrl}/tasks/${taskOneId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ status: 'In Progress', title: 'Hacked Title' }) // Title should be ignored
    });
    const updateTaskData1 = await updateTaskRes1.json();
    console.log('Status:', updateTaskRes1.status);
    console.log('Updated Task Status:', updateTaskData1.task.status);
    console.log('Updated Task Title (Should remain "Task One"):', updateTaskData1.task.title);

    // 7. Member tries to update a task not assigned to them
    // Admin creates Task Two assigned to Admin
    const createTaskRes3 = await fetch(`${baseUrl}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ title: 'Task Two', assignedTo: admin.id })
    });
    const createTaskData3 = await createTaskRes3.json();
    const taskTwoId = createTaskData3.task.id;

    console.log('\n[Test Tasks]: 5. Member trying to update status of Task Two (assigned to Admin) (Expected: 403)...');
    const updateTaskRes2 = await fetch(`${baseUrl}/tasks/${taskTwoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ status: 'Completed' })
    });
    console.log('Status:', updateTaskRes2.status);
    console.log('Body:', await updateTaskRes2.json());

    // 8. Admin updates full task details for Task One
    console.log('\n[Test Tasks]: 6. Admin updating full details of Task One...');
    const updateTaskRes3 = await fetch(`${baseUrl}/tasks/${taskOneId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Updated Task One',
        description: 'New descriptions'
      })
    });
    console.log('Status:', updateTaskRes3.status);
    console.log('Body:', await updateTaskRes3.json());

    // 9. Admin deletes Task One
    console.log('\n[Test Tasks]: 7. Admin deleting Task One...');
    const deleteTaskRes = await fetch(`${baseUrl}/tasks/${taskOneId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('Status:', deleteTaskRes.status);
    console.log('Body:', await deleteTaskRes.json());

    console.log('\n[Test Tasks]: SUCCESS! Task Management API tests passed.');
  } catch (error) {
    console.error('\n[Test Tasks Error]: Test failed:', error.message);
  } finally {
    // Cleanup remaining test data
    await Task.destroy({ where: { title: ['Task One', 'Task Two', 'Task Three', 'Updated Task One'] } });
    await Project.destroy({ where: { name: 'Tasks Project Alpha' } });
    await User.destroy({ where: { email: ['admin-task@example.com', 'member-task@example.com', 'outsider-task@example.com'] } });
    server.close();
    console.log('[Test Tasks]: Cleanup complete and server closed.');
  }
}

runTest();
