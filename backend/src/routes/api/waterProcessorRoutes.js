// src/routes/api/waterProcessorRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSensorAnalysis,
  detectLeaks,
  analyzePatterns,
  calculateCost,
  getProcessorSummary
} = require('../../controllers/water/waterProcessorController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/water/analysis/{id}:
 *   get:
 *     summary: Análisis detallado de sensor
 *     tags: [Water Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analysis/:id', authMiddleware, getSensorAnalysis);

/**
 * @swagger
 * /api/v1/water/leaks/{id}:
 *   get:
 *     summary: Detectar fugas
 *     tags: [Water Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/leaks/:id', authMiddleware, detectLeaks);

/**
 * @swagger
 * /api/v1/water/patterns/{id}:
 *   get:
 *     summary: Analizar patrones de consumo
 *     tags: [Water Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/patterns/:id', authMiddleware, analyzePatterns);

/**
 * @swagger
 * /api/v1/water/cost/{id}:
 *   get:
 *     summary: Calcular costo de agua
 *     tags: [Water Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cost/:id', authMiddleware, calculateCost);

/**
 * @swagger
 * /api/v1/water/processor/summary:
 *   get:
 *     summary: Resumen del procesador
 *     tags: [Water Processing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/processor/summary', authMiddleware, getProcessorSummary);

module.exports = router;