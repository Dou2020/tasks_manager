const bcrypt = require('bcrypt');
const { User } = require('../models');

const registerForm = (req, res) => {
  res.render('auth/register');
};

const registerUser = async (req, res) => {
  const { username, name, email, password, confirmPassword, first_name, last_name } = req.body;
  
  if (!username || !name || !email || !password || password !== confirmPassword) {
    return res.render('auth/register', { error: 'Datos inválidos o contraseñas no coinciden.' });
  }
  
  try {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.render('auth/register', { error: 'Email ya registrado.' });
    }
    
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.render('auth/register', { error: 'Nombre de usuario ya registrado.' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username,
      name, 
      email, 
      password: hash,
      first_name,
      last_name
    });
    
    req.session.userId = user.id;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', { error: 'Error al registrar usuario.' });
  }
};

const loginForm = (req, res) => {
  res.render('auth/login');
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('auth/login', { error: 'Por favor ingresa email y contraseña.' });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.render('auth/login', { error: 'Credenciales inválidas.' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.render('auth/login', { error: 'Credenciales inválidas.' });
  }
  req.session.userId = user.id;
  res.redirect('/dashboard');
};

const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/auth/login');
  });
};

module.exports = { registerForm, registerUser, loginForm, loginUser, logout };

