// src/models/Priority.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Priority = sequelize.define('Priority', {
  priority_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  level_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  color_hex: {
    type: DataTypes.STRING(7),
    defaultValue: '#FFA500'
  }
}, {
  tableName: 'Priorities',
  timestamps: false
});

module.exports = Priority;