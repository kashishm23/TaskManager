const { Task, Project, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get dashboard metrics & analytics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const todayStr = new Date().toISOString().split('T')[0];

    let taskFilter = {};

    // Standard Users (Members) only get statistics based on their assigned tasks
    if (req.user.role !== 'Admin') {
      taskFilter.assignedTo = req.user.id;
    }

    // 1. Fetch count stats
    const totalTasks = await Task.count({ where: taskFilter });

    const pendingTasks = await Task.count({
      where: {
        ...taskFilter,
        status: 'Pending'
      }
    });

    const inProgressTasks = await Task.count({
      where: {
        ...taskFilter,
        status: 'In Progress'
      }
    });

    const completedTasks = await Task.count({
      where: {
        ...taskFilter,
        status: 'Completed'
      }
    });

    const overdueTasks = await Task.count({
      where: {
        ...taskFilter,
        status: {
          [Op.ne]: 'Completed'
        },
        dueDate: {
          [Op.lt]: todayStr
        }
      }
    });

    // 2. Fetch recent tasks (limit to 5)
    const recentTasks = await Task.findAll({
      where: taskFilter,
      limit: 5,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // 3. Project breakdown (analytics)
    let projectAnalytics = [];

    if (req.user.role === 'Admin') {
      // Admin sees the total task distribution for all projects
      const projects = await Project.findAll({
        include: [{ model: Task, as: 'tasks' }]
      });

      projectAnalytics = projects.map(p => {
        const total = p.tasks.length;
        const completed = p.tasks.filter(t => t.status === 'Completed').length;
        const pending = p.tasks.filter(t => t.status === 'Pending').length;
        const inProgress = p.tasks.filter(t => t.status === 'In Progress').length;
        const overdue = p.tasks.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate < todayStr).length;

        return {
          id: p.id,
          name: p.name,
          stats: { total, completed, pending, inProgress, overdue }
        };
      });
    } else {
      // Member sees their own task distribution within the projects they belong to
      const projects = await Project.findAll({
        include: [
          {
            model: User,
            as: 'members',
            where: { id: req.user.id },
            attributes: [],
            through: { attributes: [] }
          },
          {
            model: Task,
            as: 'tasks'
          }
        ]
      });

      projectAnalytics = projects.map(p => {
        const myTasksInProj = p.tasks.filter(t => t.assignedTo === req.user.id);
        const total = myTasksInProj.length;
        const completed = myTasksInProj.filter(t => t.status === 'Completed').length;
        const pending = myTasksInProj.filter(t => t.status === 'Pending').length;
        const inProgress = myTasksInProj.filter(t => t.status === 'In Progress').length;
        const overdue = myTasksInProj.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate < todayStr).length;

        return {
          id: p.id,
          name: p.name,
          stats: { total, completed, pending, inProgress, overdue }
        };
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks
      },
      recentTasks,
      projectAnalytics
    });
  } catch (error) {
    next(error);
  }
};
