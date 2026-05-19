const express = require('express');
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberToProject
} = require('../controllers/projectController');
const { createTask, getProjectTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const { projectValidator, createTaskValidator, addMemberValidator } = require('../middleware/validators');

// All project routes require authentication
router.use(protect);

// Get all projects (Admin sees all; Member sees their own)
router.get('/', getAllProjects);

// Get single project details (Admin or Project Member)
router.get('/:id', getProjectById);

// Admin-only operations
router.post('/', authorize('Admin'), projectValidator, createProject);
router.put('/:id', authorize('Admin'), projectValidator, updateProject);
router.delete('/:id', authorize('Admin'), deleteProject);
router.post('/:id/members', authorize('Admin'), addMemberValidator, addMemberToProject);

// Task operations associated with a project
router.post('/:projectId/tasks', authorize('Admin'), createTaskValidator, createTask);
router.get('/:projectId/tasks', getProjectTasks);

module.exports = router;
