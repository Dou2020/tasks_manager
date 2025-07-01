const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');
const User = require('./User');

class Project extends Model {}
Project.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  ownerId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('Activo', 'Completado'), defaultValue: 'Activo' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  modelName: 'Project',
  tableName: 'Projects',
  timestamps: false,
});

module.exports = Project;