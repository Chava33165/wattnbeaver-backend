// src/middlewares/deviceAuth.js
const config = require('../config/config');
const Device = require('../models/Device');

// Rate limiter específico para dispositivos (más restrictivo)
const deviceRequestCounts = new Map();

/**
 * Middleware de autenticación para dispositivos IoT
 * Soporta dos modos:
 * 1. API Key individual por dispositivo (X-Device-Api-Key) - PRIORIDAD
 * 2. API Key global compartida (X-Device-Key) - FALLBACK
 */
const deviceAuth = async (req, res, next) => {
  try {
    const individualKey = req.headers['x-device-api-key'];
    const globalKey = req.headers['x-device-key'];

    // Intentar autenticación con clave individual primero
    if (individualKey) {
      const device = await Device.findByApiKey(individualKey);

      if (!device) {
        console.warn(`⚠️  Intento fallido con API Key individual: ${individualKey.substring(0, 8)}...`);
        logFailedAttempt(req, 'individual_key_invalid');
        return res.status(401).json({
          success: false,
          message: 'API Key individual inválida'
        });
      }

      // Autenticación exitosa con clave individual
      req.device = device;
      req.authMethod = 'individual';

      console.log(`✅ Autenticado: ${device.device_id} (clave individual)`);
      return next();
    }

    // Fallback: Intentar con clave global
    if (globalKey) {
      if (globalKey !== config.deviceApiKey) {
        console.warn(`⚠️  Intento fallido con API Key global inválida`);
        logFailedAttempt(req, 'global_key_invalid');
        return res.status(401).json({
          success: false,
          message: 'API Key global inválida'
        });
      }

      // Autenticación exitosa con clave global
      // El dispositivo se validará en el controlador por device_id
      req.authMethod = 'global';

      console.log(`✅ Autenticado con clave global (fallback)`);
      return next();
    }

    // Sin ninguna clave proporcionada
    console.warn(`⚠️  Intento de acceso sin API Key desde IP: ${getClientIp(req)}`);
    logFailedAttempt(req, 'no_key_provided');

    return res.status(401).json({
      success: false,
      message: 'API Key requerida. Use X-Device-Api-Key (individual) o X-Device-Key (global)'
    });

  } catch (error) {
    console.error('❌ Error en deviceAuth middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno de autenticación'
    });
  }
};

/**
 * Rate limiter específico para dispositivos IoT
 * Límite: 60 requests por minuto (1 por segundo)
 */
const deviceRateLimiter = (req, res, next) => {
  const identifier = req.device?.device_id || getClientIp(req);
  const now = Date.now();
  const windowMs = 60000; // 1 minuto
  const maxRequests = config.deviceRateLimit || 60;

  if (!deviceRequestCounts.has(identifier)) {
    deviceRequestCounts.set(identifier, []);
  }

  const requests = deviceRequestCounts.get(identifier);
  const windowStart = now - windowMs;

  // Filtrar requests dentro de la ventana de tiempo
  const recentRequests = requests.filter(time => time > windowStart);

  if (recentRequests.length >= maxRequests) {
    console.warn(`⚠️  Rate limit excedido para dispositivo: ${identifier}`);
    return res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Límite: 1 request por segundo.',
      retryAfter: 60
    });
  }

  recentRequests.push(now);
  deviceRequestCounts.set(identifier, recentRequests);

  next();
};

/**
 * Logging de intentos fallidos de autenticación
 */
function logFailedAttempt(req, reason) {
  const ip = getClientIp(req);
  const timestamp = new Date().toISOString();
  const deviceId = req.body?.device_id || 'unknown';

  console.log(`🔒 [${timestamp}] Intento fallido:`, {
    reason,
    ip,
    device_id: deviceId,
    user_agent: req.headers['user-agent']
  });

  // TODO: En producción, guardar en tabla de logs de seguridad
  // para detectar patrones de ataque
}

/**
 * Obtener IP real del cliente (considerando proxies)
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
}

/**
 * Limpiar registros antiguos de rate limiting
 * Ejecutar periódicamente para evitar memory leaks
 */
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000;

  for (const [identifier, requests] of deviceRequestCounts.entries()) {
    const recentRequests = requests.filter(time => time > now - windowMs);

    if (recentRequests.length === 0) {
      deviceRequestCounts.delete(identifier);
    } else {
      deviceRequestCounts.set(identifier, recentRequests);
    }
  }
}, 5 * 60 * 1000); // Limpiar cada 5 minutos

module.exports = {
  deviceAuth,
  deviceRateLimiter
};
