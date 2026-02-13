// src/routes/index.js
const express = require('express');
const router = express.Router();
const config = require('../config/config');

// Importar rutas existentes
const authRoutes = require('./auth/authRoutes');
const energyRoutes = require('./api/energyRoutes');
const waterRoutes = require('./api/waterRoutes');

const simulatorRoutes = require('./api/simulatorRoutes');
const mqttRoutes = require('./api/mqttRoutes');
const deviceRoutes = require('./api/deviceRoutes');
const gamificationRoutes = require('./api/gamificationRoutes');


// Importar nuevas rutas de procesamiento
const energyProcessorRoutes = require('./api/energyProcessorRoutes');
const waterProcessorRoutes = require('./api/waterProcessorRoutes');
const alertRoutes = require('./api/alertRoutes');

const reportRoutes = require('./api/reportRoutes');
const notificationRoutes = require('./api/notificationRoutes');
const goalRoutes = require('./api/goalRoutes');
const householdRoutes = require('./api/householdRoutes');



// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de energía (básicas + procesamiento)
router.use('/energy', energyRoutes);
router.use('/energy', energyProcessorRoutes);

// Rutas de agua (básicas + procesamiento)
router.use('/water', waterRoutes);
router.use('/water', waterProcessorRoutes);

// Rutas de alertas
router.use('/alerts', alertRoutes);

// Rutas del simulador (disponible en desarrollo Y producción para pruebas)
router.use('/simulator', simulatorRoutes);

// Rutas de MQTT
router.use('/mqtt', mqttRoutes);

// Rutas de dispositivos
router.use('/devices', deviceRoutes);

// Rutas de gamificación
router.use('/gamification', gamificationRoutes);


// Rutas de reportes
router.use('/reports', reportRoutes);

// Rutas de notificaciones
router.use('/notifications', notificationRoutes);

// Rutas de metas
router.use('/goals', goalRoutes);

// Rutas de hogares
router.use('/households', householdRoutes);


module.exports = router;