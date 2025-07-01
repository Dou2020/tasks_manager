const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class ProjectMember extends Model {}
ProjectMember.init({
  projectId: { type: DataTypes.INTEGER, primaryKey: true },
  userId: { type: DataTypes.INTEGER, primaryKey: true },
  joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  modelName: 'ProjectMember',
  tableName: 'ProjectMembers',
  timestamps: false,
});

module.exports = ProjectMember;