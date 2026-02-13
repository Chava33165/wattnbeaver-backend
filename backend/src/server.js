// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const config = require('./config/config');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');
const { swaggerUi, specs } = require('./config/swagger');
const mqttService = require('./services/mqttService');
const databaseService = require('./services/database');

// ========================================
// INICIALIZACIÓN DE SERVICIOS
// (Antes de crear la app)
// ========================================

// 1. Inicializar base de datos PRIMERO
try {
  console.log('🔧 Inicializando servicios...');
  databaseService.initialize();
  databaseService.seedDatabase();
} catch (error) {
  console.error('❌ Error al inicializar base de datos:', error);
  process.exit(1);
}

// 2. Iniciar servicio MQTT
try {
  mqttService.connect();
} catch (error) {
  console.error('❌ Error al iniciar MQTT:', error);
  // No salir aquí, permitir que la API funcione sin MQTT
}

// ========================================
// CREAR APLICACIÓN EXPRESS
// ========================================

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors());
app.use(compression());

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter(config.limits.maxRequestsPerMinute, 60000));

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WattBeaber API Docs'
}));

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WattBeaber API - Sistema de Monitoreo Energético e Hídrico',
    version: config.api.version,
    documentation: `/api-docs`,
    endpoints: {
      health: `${config.api.prefix}/${config.api.version}/health`,
      auth: `${config.api.prefix}/${config.api.version}/auth`,
      energy: `${config.api.prefix}/${config.api.version}/energy`,
      water: `${config.api.prefix}/${config.api.version}/water`,
      alerts: `${config.api.prefix}/${config.api.version}/alerts`,
      devices: `${config.api.prefix}/${config.api.version}/devices`,
      gamification: `${config.api.prefix}/${config.api.version}/gamification`
    },
    timestamp: new Date().toISOString()
  });
});

// Rutas API
app.use(`${config.api.prefix}/${config.api.version}`, routes);

// Manejo de errores (DEBE IR AL FINAL)
app.use(notFound);
app.use(errorHandler);

// ========================================
// INICIAR SERVIDOR
// ========================================

const server = app.listen(config.port, config.host, () => {
  console.log('========================================');
  console.log('🚀 WattBeaber API Server');
  console.log('========================================');
  console.log(`📡 Servidor: http://${config.host}:${config.port}`);
  console.log(`📚 Documentación: http://localhost:${config.port}/api-docs`);
  console.log(`🌍 Entorno: ${config.env}`);
  console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);
  console.log('========================================');
});

// ========================================
// MANEJO DE ERRORES Y SHUTDOWN
// ========================================

// Errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Señales de terminación
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido');
  gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT recibido (Ctrl+C)');
  gracefulShutdown('SIGINT');
});

/**
 * Función de cierre ordenado
 */
function gracefulShutdown(signal) {
  console.log(`⏳ Iniciando cierre ordenado (${signal})...`);
  
  // 1. Desconectar MQTT
  try {
    mqttService.disconnect();
    console.log('✅ MQTT desconectado');
  } catch (err) {
    console.error('❌ Error al desconectar MQTT:', err);
  }
  
  // 2. Cerrar base de datos
  try {
    databaseService.close();
    console.log('✅ Base de datos cerrada');
  } catch (err) {
    console.error('❌ Error al cerrar base de datos:', err);
  }
  
  // 3. Cerrar servidor HTTP
  server.close(() => {
    console.log('✅ Servidor HTTP cerrado');
    console.log('👋 Proceso finalizado correctamente');
    process.exit(0);
  });
  
  // Forzar cierre después de 10 segundos si no responde
  setTimeout(() => {
    console.error('⚠️  Forzando cierre después de 10 segundos');
    process.exit(1);
  }, 10000);
}

module.exports = app;