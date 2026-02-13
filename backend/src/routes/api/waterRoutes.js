// src/routes/api/waterRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllSensors,
  getSensorById,
  getTotalConsumption,
  getConsumptionHistory
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

module.exports = router;