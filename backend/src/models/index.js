const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');

// Many-to-Many Relationship: Users <-> Projects via ProjectMembers
User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: 'userId',
  otherKey: 'projectId',
  as: 'projects'
});

Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: 'projectId',
  otherKey: 'userId',
  as: 'members'
});

// Direct relations to the ProjectMember table for detailed querying
ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
User.hasMany(ProjectMember, { foreignKey: 'userId', as: 'memberships' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'memberRelations' });

// One-to-Many Relationship: Project -> Tasks
Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks',
  onDelete: 'CASCADE'
});
Task.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

// One-to-Many Relationship: User -> Tasks (Assigned tasks)
User.hasMany(Task, {
  foreignKey: 'assignedTo',
  as: 'tasks',
  onDelete: 'SET NULL'
});
Task.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee'
});

module.exports = {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task
};
