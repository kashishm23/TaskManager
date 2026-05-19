const { Task, Project, ProjectMember, User } = require('../models');

// @desc    Create a task inside a project
// @route   POST /api/projects/:projectId/tasks
// @access  Private/Admin
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, dueDate, status } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.'
      });
    }

    // 1. Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // 2. If assignedTo is provided, verify they are a member of this project
    if (assignedTo) {
      const isMember = await ProjectMember.findOne({
        where: { projectId, userId: assignedTo }
      });
      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user is not a member of this project.'
        });
      }
    }

    // 3. Create the task
    const task = await Task.create({
      projectId,
      assignedTo: assignedTo || null,
      title,
      description,
      status: status || 'Pending',
      dueDate: dueDate || null
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks of a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private (Admin or Project Member)
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // Verify requesting user is Admin or a member of the project
    const isMember = await ProjectMember.findOne({
      where: { projectId, userId: req.user.id }
    });
    if (req.user.role !== 'Admin' && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.'
      });
    }

    // Fetch tasks
    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks assigned to currently logged-in user
// @route   GET /api/tasks/my
// @access  Private
exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.findAll({
      where: { assignedTo: req.user.id },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task (Admin can update all fields; Member can only update status of their assigned task)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, dueDate, status } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    if (req.user.role === 'Admin') {
      // Admin update rules
      if (assignedTo) {
        // Verify new assignee is a member of the project
        const isMember = await ProjectMember.findOne({
          where: { projectId: task.projectId, userId: assignedTo }
        });
        if (!isMember) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user is not a member of this project.'
          });
        }
      }

      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;
      task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
      task.status = status || task.status;

      await task.save();
    } else {
      // Member update rules
      // 1. Must be assigned to this task
      if (task.assignedTo !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update the status of tasks assigned to you.'
        });
      }

      // 2. Can only update status
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required for updating.'
        });
      }

      // 3. Status must be valid
      if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value.'
        });
      }

      task.status = status;
      await task.save();
    }

    // Fetch updated task with details
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    await task.destroy();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
