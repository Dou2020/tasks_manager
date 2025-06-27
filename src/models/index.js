// src/models/index.js
const User = require('./User');
const Task = require('./Task');
const Category = require('./Category');
const Priority = require('./Priority');
const TaskStatus = require('./TaskStatus');

// Definir asociaciones
User.hasMany(Task, {
  foreignKey: 'user_id',
  as: 'tasks'
});

Task.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Category.hasMany(Task, {
  foreignKey: 'category_id',
  as: 'tasks'
});

Task.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

Priority.hasMany(Task, {
  foreignKey: 'priority_id',
  as: 'tasks'
});

Task.belongsTo(Priority, {
  foreignKey: 'priority_id',
  as: 'priority'
});

TaskStatus.hasMany(Task, {
  foreignKey: 'status_id',
  as: 'tasks'
});

Task.belongsTo(TaskStatus, {
  foreignKey: 'status_id',
  as: 'status'
});

module.exports = {
  User,
  Task,
  Category,
  Priority,
  TaskStatus
};