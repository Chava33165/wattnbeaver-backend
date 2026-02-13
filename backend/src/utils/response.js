// src/utils/response.js

/**
 * Respuesta exitosa estándar
 */
const success = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta de error estándar
 */
const error = (res, message = 'Error en la operación', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  success,
  error
};