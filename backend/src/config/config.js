// src/config/config.js
require('dotenv').config();

module.exports = {
  // Servidor
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  
  // API
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || '/api'
  },
  
  // MQTT
  mqtt: {
    broker: process.env.MQTT_BROKER || 'localhost',
    port: parseInt(process.env.MQTT_PORT, 10) || 1883,
    username: process.env.MQTT_USERNAME || 'backend_user',
    password: process.env.MQTT_PASSWORD || 'backend_password',
    reconnectPeriod: 5000,
    connectTimeout: 30000
  },
  
  // Base de datos
  database: {
    path: process.env.DB_PATH || '../data/wattnbeaber.db'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    path: process.env.LOG_PATH || '../logs'
  },
  
  // Límites
  limits: {
    maxDevices: parseInt(process.env.MAX_DEVICES, 10) || 50,
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10) || 100
  },

  // Device API (para autenticación de ESP32 vía HTTPS)
  deviceApiKey: process.env.DEVICE_API_KEY || 'change-this-device-key',
  deviceRateLimit: parseInt(process.env.DEVICE_RATE_LIMIT, 10) || 60
};