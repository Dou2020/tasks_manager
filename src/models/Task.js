const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Task extends Model {}
Task.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  assignedTo: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('Por hacer', 'En progreso', 'Completado'), defaultValue: 'Por hacer' },
  priority: { type: DataTypes.ENUM('Baja', 'Media', 'Alta'), defaultValue: 'Media' },
  dueDate: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  modelName: 'Task',
  tableName: 'Tasks',
  timestamps: false,
});

module.exports = Task;