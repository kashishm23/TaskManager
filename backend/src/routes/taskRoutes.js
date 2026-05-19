const express = require('express');
const router = express.Router();
const { getMyTasks, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const { updateTaskValidator } = require('../middleware/validators');

// All task routes require authentication
router.use(protect);

// Get currently logged-in user's tasks
router.get('/my', getMyTasks);

// Update a task (Admin can update all fields; Member can only update status of assigned tasks)
router.put('/:id', updateTaskValidator, updateTask);

// Delete a task (Admin only)
router.delete('/:id', authorize('Admin'), deleteTask);

module.exports = router;
