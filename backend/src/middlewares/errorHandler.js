// src/middlewares/errorHandler.js

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors
    });
  }
  
  // Error de base de datos
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      success: false,
      message: 'Conflicto con datos existentes'
    });
  }
  
  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFound
};