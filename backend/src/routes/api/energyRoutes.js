// src/routes/api/energyRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  getDeviceById,
  getTotalConsumption,
  getConsumptionHistory,
  getWeeklyStatistics,
  controlDevice
} = require('../../controllers/energy/energyController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/energy/devices:
 *   get:
 *     summary: Obtener todos los dispositivos de energía
 *     tags: [Energy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de dispositivos
 */
router.get('/devices', authMiddleware, getAllDevices);

/**
 * @swagger
 * /api/v1/energy/devices/{id}:
 *   get:
 *     summary: Obtener dispositivo por ID
 *     tags: [Energy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/devices/:id', authMiddleware, getDeviceById);

/**
 * @swagger
 * /api/v1/energy/total:
 *   get:
 *     summary: Obtener consumo total de energía
 *     tags: [Energy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/total', authMiddleware, getTotalConsumption);

/**
 * @swagger
 * /api/v1/energy/history:
 *   get:
 *     summary: Obtener historial de consumo
 *     tags: [Energy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', authMiddleware, getConsumptionHistory);

/**
 * @swagger
 * /api/v1/energy/statistics/weekly:
 *   get:
 *     summary: Obtener estadísticas semanales de consumo de energía
 *     tags: [Energy]
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
 * /api/v1/energy/devices/{id}/control:
 *   post:
 *     summary: Controlar dispositivo (on/off)
 *     tags: [Energy]
 *     security:
 *       - bearerAuth: []
 */
router.post('/devices/:id/control', authMiddleware, controlDevice);

module.exports = router;