// src/routes/api/waterRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllSensors,
  getSensorById,
  getTotalConsumption,
  getConsumptionHistory,
  getWeeklyStatistics,
  getSensorReadings,
  getSensorStatsToday
} = require('../../controllers/water/waterController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/water/sensors:
 *   get:
 *     summary: Obtener todos los sensores de agua
 *     tags: [Water]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sensors', authMiddleware, getAllSensors);

/**
 * @swagger
 * /api/v1/water/sensors/{id}:
 *   get:
 *     summary: Obtener sensor por ID
 *     tags: [Water]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sensors/:id', authMiddleware, getSensorById);

/**
 * @swagger
 * /api/v1/water/total:
 *   get:
 *     summary: Obtener consumo total de agua
 *     tags: [Water]
 *     security:
 *       - bearerAuth: []
 */
router.get('/total', authMiddleware, getTotalConsumption);

/**
 * @swagger
 * /api/v1/water/history:
 *   get:
 *     summary: Obtener historial de consumo de agua
 *     tags: [Water]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', authMiddleware, getConsumptionHistory);

/**
 * @swagger
 * /api/v1/water/statistics/weekly:
 *   get:
 *     summary: Obtener estadísticas semanales de consumo de agua
 *     tags: [Water]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-16"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-22"
 *     responses:
 *       200:
 *         description: Estadísticas semanales con validaciones
 */
router.get('/statistics/weekly', authMiddleware, getWeeklyStatistics);

/**
 * @swagger
 * /api/v1/water/sensors/{id}/readings:
 *   get:
 *     summary: Obtener lecturas recientes de un sensor de agua
 *     tags: [Water]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "yf201_01"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
router.get('/sensors/:id/readings', authMiddleware, getSensorReadings);

/**
 * @swagger
 * /api/v1/water/sensors/{id}/stats/today:
 *   get:
 *     summary: Estadísticas del día para un sensor de agua
 *     tags: [Water]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "yf201_01"
 */
router.get('/sensors/:id/stats/today', authMiddleware, getSensorStatsToday);

module.exports = router;