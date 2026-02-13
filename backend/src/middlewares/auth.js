// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware de autenticación JWT
 */
const authMiddleware = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado. Use: Authorization: Bearer <token>'
      });
    }
    
    const token = authHeader.substring(7); // Remover 'Bearer '
    
    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'user'
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor, inicia sesión nuevamente.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user'
      };
    }
    
    next();
  } catch (error) {
    // Si hay error, continuar sin usuario autenticado
    next();
  }
};

/**
 * Middleware para verificar rol de admin
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador.'
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminOnly
};