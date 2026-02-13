// src/routes/api/mqttRoutes.js
const express = require('express');
const router = express.Router();
const { getMQTTStats, publishMessage } = require('../../controllers/mqtt/mqttController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/mqtt/stats:
 *   get:
 *     summary: Obtener estadísticas de MQTT
 *     description: Retorna información sobre la conexión MQTT y mensajes procesados
 *     tags: [MQTT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/stats', authMiddleware, getMQTTStats);

/**
 * @swagger
 * /api/v1/mqtt/publish:
 *   post:
 *     summary: Publicar mensaje en MQTT
 *     description: Publicar un mensaje manual en un topic MQTT
 *     tags: [MQTT]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - message
 *             properties:
 *               topic:
 *                 type: string
 *                 example: "wattnbeaber/energy/sonoff_01/command"
 *               message:
 *                 type: object
 *                 example: {"command": "on"}
 *               qos:
 *                 type: integer
 *                 default: 1
 *                 enum: [0, 1, 2]
 *               retain:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Mensaje publicado exitosamente
 */
router.post('/publish', authMiddleware, publishMessage);

module.exports = router;
