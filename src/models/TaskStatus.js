// src/models/TaskStatus.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskStatus = sequelize.define('TaskStatus', {
  status_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  color_hex: {
    type: DataTypes.STRING(7),
    defaultValue: '#28A745'
  },
  is_final: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'Task_Status',
  timestamps: false
});

module.exports = TaskStatus;