// src/routes/api/alertRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getAlertStats,
  createAlert,
  cleanOldAlerts
} = require('../../controllers/alerts/alertController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/alerts:
 *   get:
 *     summary: Obtener todas las alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authMiddleware, getAllAlerts);

/**
 * @swagger
 * /api/v1/alerts/{id}:
 *   get:
 *     summary: Obtener alerta por ID
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authMiddleware, getAlertById);

/**
 * @swagger
 * /api/v1/alerts/{id}/acknowledge:
 *   post:
 *     summary: Reconocer alerta
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/acknowledge', authMiddleware, acknowledgeAlert);

/**
 * @swagger
 * /api/v1/alerts/{id}/resolve:
 *   post:
 *     summary: Resolver alerta
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/resolve', authMiddleware, resolveAlert);

/**
 * @swagger
 * /api/v1/alerts/stats:
 *   get:
 *     summary: Estadísticas de alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats/summary', authMiddleware, getAlertStats);

/**
 * @swagger
 * /api/v1/alerts:
 *   post:
 *     summary: Crear alerta manual
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authMiddleware, createAlert);

/**
 * @swagger
 * /api/v1/alerts/clean:
 *   delete:
 *     summary: Limpiar alertas antiguas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/clean', authMiddleware, cleanOldAlerts);

module.exports = router;