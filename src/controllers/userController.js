const bcrypt = require('bcrypt');
const { User } = require('../models');

/**
 * Muestra el perfil del usuario
 */
const showProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    
    if (!user) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }
    
    res.render('user/profile', {
      title: 'Mi Perfil',
      user: user,
      currentPage: 'profile'
    });
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    res.status(500).render('error', { 
      error: 'Error al cargar la información del perfil', 
      user: { name: 'Usuario' } 
    });
  }
};

/**
 * Actualiza los datos del perfil del usuario
 */
const updateProfile = async (req, res) => {
  try {
    const { name, username, email, first_name, last_name } = req.body;
    const userId = req.session.userId;
    
    // Validación básica
    if (!name || !username || !email) {
      return res.render('user/profile', { 
        error: 'Nombre, nombre de usuario y correo son obligatorios',
        user: await User.findByPk(userId),
        currentPage: 'profile',
        title: 'Mi Perfil'
      });
    }
    
    // Verificar si el email o username ya están tomados por otro usuario
    const existingUser = await User.findOne({
      where: { 
        email,
        id: { [require('sequelize').Op.ne]: userId }
      }
    });
    
    if (existingUser) {
      return res.render('user/profile', { 
        error: 'El correo electrónico ya está registrado por otro usuario',
        user: await User.findByPk(userId),
        currentPage: 'profile',
        title: 'Mi Perfil'
      });
    }
    
    const existingUsername = await User.findOne({
      where: { 
        username,
        id: { [require('sequelize').Op.ne]: userId }
      }
    });
    
    if (existingUsername) {
      return res.render('user/profile', { 
        error: 'El nombre de usuario ya está tomado',
        user: await User.findByPk(userId),
        currentPage: 'profile',
        title: 'Mi Perfil'
      });
    }
    
    // Actualizar datos del usuario
    await User.update({
      name,
      username,
      email,
      first_name,
      last_name,
      updatedAt: new Date()
    }, {
      where: { id: userId }
    });
    
    // Redirigir a perfil con mensaje de éxito
    res.render('user/profile', { 
      success: 'Perfil actualizado exitosamente',
      user: await User.findByPk(userId),
      currentPage: 'profile',
      title: 'Mi Perfil'
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.render('user/profile', { 
      error: 'Error al actualizar el perfil',
      user: await User.findByPk(req.session.userId),
      currentPage: 'profile',
      title: 'Mi Perfil'
    });
  }
};

/**
 * Cambia la contraseña del usuario
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.userId;
    
    // Validación básica
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render('user/profile', { 
        passwordError: 'Todos los campos son obligatorios',
        user: await User.findByPk(userId),
        currentPage: 'profile',
        title: 'Mi Perfil'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.render('user/profile', { 
        passwordError: 'Las nuevas contraseñas no coinciden',
        user: await User.findByPk(userId),
        currentPage: 'profile',
        title: 'Mi Perfil'
      });
    }
    
    if (newPassword.length < 6) {
      return res.render('user/profile', { 
        passwordError: 'La nueva contraseña debe tener al menos 6 caracteres',
        user: await User.findByPk(userId),
        currentPage: 'profile',
        title: 'Mi Perfil'
      });
    }
    
    // Verificar contraseña actual
    const user = await User.findByPk(userId);
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!validPassword) {
      return res.render('user/profile', { 
        passwordError: 'La contraseña actual es incorrecta',
        user,
        currentPage: 'profile',
        title: 'Mi Perfil'
      });
    }
    
    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await User.update({
      password: hashedPassword,
      updatedAt: new Date()
    }, {
      where: { id: userId }
    });
    
    // Redirigir a perfil con mensaje de éxito
    res.render('user/profile', { 
      passwordSuccess: 'Contraseña actualizada exitosamente',
      user: await User.findByPk(userId),
      currentPage: 'profile',
      title: 'Mi Perfil'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.render('user/profile', { 
      passwordError: 'Error al cambiar la contraseña',
      user: await User.findByPk(req.session.userId),
      currentPage: 'profile',
      title: 'Mi Perfil'
    });
  }
};

module.exports = {
  showProfile,
  updateProfile,
  changePassword
};
