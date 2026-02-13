// src/routes/api/deviceRoutes.js
const express = require('express');
const router = express.Router();
const {
  linkDevice,
  getMyDevices,
  getDeviceById,
  updateDevice,
  unlinkDevice,
  getDeviceStats
} = require('../../controllers/devices/deviceController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/devices/link:
 *   post:
 *     summary: Vincular nuevo dispositivo
 *     description: Asocia un dispositivo IoT (Sonoff o sensor) al usuario actual
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - device_name
 *               - device_type
 *             properties:
 *               device_id:
 *                 type: string
 *                 example: "sonoff_01"
 *               device_name:
 *                 type: string
 *                 example: "Refrigerador"
 *               device_type:
 *                 type: string
 *                 enum: [energy, water]
 *                 example: "energy"
 *               location:
 *                 type: string
 *                 example: "Cocina"
 *     responses:
 *       201:
 *         description: Dispositivo vinculado exitosamente
 *       409:
 *         description: Dispositivo ya vinculado
 */
router.post('/link', authMiddleware, linkDevice);

/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     summary: Obtener mis dispositivos
 *     description: Lista todos los dispositivos vinculados al usuario
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [energy, water]
 *         description: Filtrar por tipo de dispositivo
 *     responses:
 *       200:
 *         description: Lista de dispositivos
 */
router.get('/', authMiddleware, getMyDevices);

/**
 * @swagger
 * /api/v1/devices/stats:
 *   get:
 *     summary: Estadísticas de dispositivos
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', authMiddleware, getDeviceStats);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   get:
 *     summary: Obtener dispositivo por ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authMiddleware, getDeviceById);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   put:
 *     summary: Actualizar dispositivo
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authMiddleware, updateDevice);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   delete:
 *     summary: Desvincular dispositivo
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authMiddleware, unlinkDevice);

module.exports = router;