// src/routes/api/energyProcessorRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDeviceAnalysis,
  getDeviceTrends,
  detectSpikes,
  calculateCost,
  comparePeriods,
  getProcessorSummary
} = require('../../controllers/energy/energyProcessorController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/energy/analysis/{id}:
 *   get:
 *     summary: Análisis detallado de dispositivo
 *     tags: [Energy Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analysis/:id', authMiddleware, getDeviceAnalysis);

/**
 * @swagger
 * /api/v1/energy/trends/{id}:
 *   get:
 *     summary: Tendencias de consumo
 *     tags: [Energy Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trends/:id', authMiddleware, getDeviceTrends);

/**
 * @swagger
 * /api/v1/energy/spikes/{id}:
 *   get:
 *     summary: Detectar picos de consumo
 *     tags: [Energy Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/spikes/:id', authMiddleware, detectSpikes);

/**
 * @swagger
 * /api/v1/energy/cost/{id}:
 *   get:
 *     summary: Calcular costo de energía
 *     tags: [Energy Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cost/:id', authMiddleware, calculateCost);

/**
 * @swagger
 * /api/v1/energy/compare/{id}:
 *   get:
 *     summary: Comparar períodos
 *     tags: [Energy Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/compare/:id', authMiddleware, comparePeriods);

/**
 * @swagger
 * /api/v1/energy/processor/summary:
 *   get:
 *     summary: Resumen del procesador
 *     tags: [Energy Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/processor/summary', authMiddleware, getProcessorSummary);

module.exports = router;