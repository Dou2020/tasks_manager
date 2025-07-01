const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Comment extends Model {}
Comment.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  modelName: 'Comment',
  tableName: 'Comments',
  timestamps: false,
});

module.exports = Comment;