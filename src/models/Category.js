// src/models/Category.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre de la categoría no puede estar vacío'
      }
    }
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  color_hex: {
    type: DataTypes.STRING(7),
    defaultValue: '#007ACC',
    validate: {
      is: {
        args: /^#[0-9A-Fa-f]{6}$/,
        msg: 'El color debe ser un código hexadecimal válido'
      }
    }
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Category;