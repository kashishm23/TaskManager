const { Project, ProjectMember, User, Task } = require('../models');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
exports.createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required.'
      });
    }

    // Create the project
    const project = await Project.create({ name, description });

    // Automatically add the creating Admin as a member of this project
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully and creator added as a member.',
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (Admin gets all, Member gets only their assigned projects)
exports.getAllProjects = async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === 'Admin') {
      // Admins get all projects including their members list
      projects = await Project.findAll({
        include: [
          {
            model: User,
            as: 'members',
            attributes: ['id', 'name', 'email', 'role'],
            through: { attributes: [] } // Exclude junction table columns
          }
        ]
      });
    } else {
      // Members get only the projects they belong to
      const memberProjects = await Project.findAll({
        include: [
          {
            model: User,
            as: 'members',
            where: { id: req.user.id },
            attributes: [], // Don't return current user in this nested query
            through: { attributes: [] }
          }
        ]
      });

      // Extract the project IDs the member belongs to
      const projectIds = memberProjects.map(p => p.id);

      // Fetch the full projects along with all other members
      projects = await Project.findAll({
        where: { id: projectIds },
        include: [
          {
            model: User,
            as: 'members',
            attributes: ['id', 'name', 'email', 'role'],
            through: { attributes: [] }
          }
        ]
      });
    }

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private (Admin or Project Member)
exports.getProjectById = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // Find project with members and its related tasks
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'role'],
          through: { attributes: [] }
        },
        {
          model: Task,
          as: 'tasks',
          include: [
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // Verify if the requesting user is either an Admin or a member of the project
    const isMember = project.members.some(member => member.id === req.user.id);
    if (req.user.role !== 'Admin' && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.'
      });
    }

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // Deletes project; CASCADE deletes references in project_members and tasks in MySQL
    await project.destroy();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private/Admin
exports.addMemberToProject = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const projectId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      where: { projectId, userId }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project.'
      });
    }

    // Add user as a project member
    await ProjectMember.create({ projectId, userId });

    res.status(200).json({
      success: true,
      message: `User ${user.name} added to project successfully.`
    });
  } catch (error) {
    next(error);
  }
};
