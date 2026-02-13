// src/controllers/auth/authController.js
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../utils/jwt');
const { success, error } = require('../../utils/response');
const User = require('../../models/User');

// Usuario admin hardcodeado (para retrocompatibilidad)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

/**
 * Registrar nuevo usuario
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Crear usuario en la base de datos
    const newUser = await User.create({ name, email, password });

    // Generar token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    });

    return success(res, {
      token,
      user: newUser.toJSON()
    }, 'Usuario registrado exitosamente', 201);

  } catch (err) {
    console.error('Error en registro:', err);
    
    if (err.message.includes('ya está registrado')) {
      return error(res, err.message, 409);
    }
    
    return error(res, err.message || 'Error al registrar usuario', 400);
  }
};

/**
 * Login de usuario
 */
const login = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Aceptar tanto email como username
    const loginIdentifier = email || username;
    
    if (!loginIdentifier || !password) {
      return error(res, 'Email/usuario y contraseña son requeridos', 400);
    }

    let user = null;
    let isAdmin = false;

    // Verificar si es el admin
    if (loginIdentifier === ADMIN_USERNAME) {
      if (password === ADMIN_PASSWORD) {
        user = {
          id: 'user_admin',
          name: 'Administrador',
          email: 'admin@wattnbeaber.com',
          role: 'admin'
        };
        isAdmin = true;
      }
    } else {
      // Buscar en base de datos
      user = await User.findByEmail(loginIdentifier);
      
      if (user) {
        const isValid = await user.verifyPassword(password);
        if (!isValid) {
          user = null;
        }
      }
    }

    if (!user) {
      return error(res, 'Credenciales inválidas', 401);
    }

    // Generar token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = generateToken(tokenPayload);

    return success(res, {
      token,
      user: isAdmin ? user : user.toJSON()
    }, 'Login exitoso');

  } catch (err) {
    console.error('Error en login:', err);
    return error(res, 'Error al iniciar sesión', 500);
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
const getProfile = async (req, res) => {
  try {
    // Si es admin, retornar directamente
    if (req.user.role === 'admin') {
      return success(res, { user: req.user }, 'Perfil obtenido');
    }

    // Buscar usuario en DB
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return error(res, 'Usuario no encontrado', 404);
    }

    return success(res, {
      user: user.toJSON()
    }, 'Perfil obtenido exitosamente');
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    return error(res, 'Error al obtener perfil', 500);
  }
};

/**
 * Obtener lista de usuarios (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return error(res, 'No autorizado', 403);
    }

    const users = await User.findAll();
    
    return success(res, {
      users: [
        {
          id: 'user_admin',
          name: 'Administrador',
          email: 'admin@wattnbeaber.com',
          role: 'admin'
        },
        ...users.map(u => u.toJSON())
      ],
      total: users.length + 1
    }, 'Usuarios obtenidos');

  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    return error(res, 'Error al obtener usuarios', 500);
  }
};

/**
 * Actualizar perfil
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar, password } = req.body;
    
    if (req.user.role === 'admin') {
      return error(res, 'No se puede modificar el usuario admin', 403);
    }

    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (password) updates.password = password;

    const updatedUser = await User.update(req.user.id, updates);

    return success(res, {
      user: updatedUser.toJSON()
    }, 'Perfil actualizado exitosamente');

  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    return error(res, err.message || 'Error al actualizar perfil', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  updateProfile
};