// src/middlewares/rateLimiter.js

// Almacenamiento simple en memoria (en producción usar Redis)
const requestCounts = new Map();

/**
 * Rate limiter simple
 */
const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Limpiar entradas antiguas
    const windowStart = now - windowMs;
    
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip);
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas peticiones. Intenta más tarde.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    
    next();
  };
};

module.exports = rateLimiter;