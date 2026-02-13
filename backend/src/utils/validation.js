// src/utils/validation.js
const { validationResult } = require('express-validator');

/**
 * Middleware para validar resultados de express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validadores comunes
 */
const validators = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },
  
  password: (value) => {
    if (value.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    return hasLetter && hasNumber;
  },
  
  deviceId: (value) => {
    // Formato: sonoff_XX o sensor_XX
    const regex = /^(sonoff|sensor)_[a-z0-9_]+$/i;
    return regex.test(value);
  },
  
  notEmpty: (value) => {
    return value && value.trim().length > 0;
  }
};

module.exports = {
  validate,
  validators
};
