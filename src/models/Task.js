// src/models/Task.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  task_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El título no puede estar vacío'
      },
      len: {
        args: [1, 200],
        msg: 'El título debe tener entre 1 y 200 caracteres'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Categories',
      key: 'category_id'
    }
  },
  priority_id: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    references: {
      model: 'Priorities',
      key: 'priority_id'
    }
  },
  status_id: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    references: {
      model: 'Task_Status',
      key: 'status_id'
    }
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'La fecha de vencimiento debe ser válida'
      }
    }
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Las horas estimadas no pueden ser negativas'
      }
    }
  },
  actual_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Las horas reales no pueden ser negativas'
      }
    }
  },
  progress_percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'El progreso no puede ser menor a 0'
      },
      max: {
        args: [100],
        msg: 'El progreso no puede ser mayor a 100'
      }
    }
  },
  tags: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'Tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeUpdate: (task, options) => {
      // Si se marca como completada y no tiene fecha de completado, agregarla
      if (task.changed('status_id') && task.status_id === 3) { // Asumiendo que 3 es "Completada"
        if (!task.completed_date) {
          task.completed_date = new Date();
        }
        if (task.progress_percentage !== 100) {
          task.progress_percentage = 100;
        }
      }
    }
  }
});

// Métodos de instancia
Task.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

// Método para obtener tags como array
Task.prototype.getTagsArray = function() {
  if (!this.tags) return [];
  return this.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

// Método para establecer tags desde array
Task.prototype.setTagsFromArray = function(tagsArray) {
  if (Array.isArray(tagsArray)) {
    this.tags = tagsArray.filter(tag => tag && tag.trim()).join(',');
  }
};

module.exports = Task;