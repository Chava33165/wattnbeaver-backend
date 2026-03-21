// src/routes/api/ingestRoutes.js
const express = require('express');
const router = express.Router();
const { deviceAuth, deviceRateLimiter } = require('../../middlewares/deviceAuth');
const { ingestWater, ingestEnergy } = require('../../controllers/ingest/ingestController');

/**
 * @swagger
 * /api/v1/ingest/water:
 *   post:
 *     summary: Ingestar datos de sensor de agua (YF-201, etc.)
 *     description: Endpoint para que dispositivos ESP32 envíen lecturas de sensores de flujo de agua vía HTTPS
 *     tags: [Ingest]
 *     security:
 *       - deviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *             properties:
 *               device_id:
 *                 type: string
 *                 description: ID único del dispositivo (debe existir en la base de datos)
 *                 example: "sensor_001"
 *               flow:
 *                 type: number
 *                 description: Flujo de agua en litros por minuto (L/min)
 *                 example: 2.5
 *               total:
 *                 type: number
 *                 description: Total acumulado en litros (L)
 *                 example: 100.0
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp de la lectura (opcional, se genera automáticamente si no se proporciona)
 *                 example: "2026-03-20T12:34:56Z"
 *     responses:
 *       200:
 *         description: Lectura guardada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lectura de agua guardada correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12345
 *                     device_id:
 *                       type: string
 *                       example: "sensor_001"
 *                     flow:
 *                       type: number
 *                       example: 2.5
 *                     total:
 *                       type: number
 *                       example: 100.0
 *                     timestamp:
 *                       type: string
 *                       example: "2026-03-20T12:34:56Z"
 *       400:
 *         description: Datos inválidos o dispositivo de tipo incorrecto
 *       401:
 *         description: API Key inválida o no proporcionada
 *       404:
 *         description: Dispositivo no encontrado
 *       429:
 *         description: Rate limit excedido (máximo 60 requests/minuto)
 */
router.post('/water', deviceAuth, deviceRateLimiter, ingestWater);

/**
 * @swagger
 * /api/v1/ingest/energy:
 *   post:
 *     summary: Ingestar datos de sensor de energía (PZEM-004T, Sonoff POW, etc.)
 *     description: Endpoint para que dispositivos ESP32 envíen lecturas de sensores de energía vía HTTPS
 *     tags: [Ingest]
 *     security:
 *       - deviceApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *             properties:
 *               device_id:
 *                 type: string
 *                 description: ID único del dispositivo (debe existir en la base de datos)
 *                 example: "sonoff_01"
 *               power:
 *                 type: number
 *                 description: Potencia en vatios (W)
 *                 example: 150.5
 *               voltage:
 *                 type: number
 *                 description: Voltaje en voltios (V) - debe estar entre 100-250V
 *                 example: 220.0
 *               current:
 *                 type: number
 *                 description: Corriente en amperios (A)
 *                 example: 0.68
 *               energy:
 *                 type: number
 *                 description: Energía acumulada en Wh
 *                 example: 1250.0
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp de la lectura (opcional, se genera automáticamente si no se proporciona)
 *                 example: "2026-03-20T12:34:56Z"
 *     responses:
 *       200:
 *         description: Lectura guardada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lectura de energía guardada correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12346
 *                     device_id:
 *                       type: string
 *                       example: "sonoff_01"
 *                     power:
 *                       type: number
 *                       example: 150.5
 *                     voltage:
 *                       type: number
 *                       example: 220.0
 *                     current:
 *                       type: number
 *                       example: 0.68
 *                     energy:
 *                       type: number
 *                       example: 1250.0
 *                     timestamp:
 *                       type: string
 *                       example: "2026-03-20T12:34:56Z"
 *       400:
 *         description: Datos inválidos o dispositivo de tipo incorrecto
 *       401:
 *         description: API Key inválida o no proporcionada
 *       404:
 *         description: Dispositivo no encontrado
 *       429:
 *         description: Rate limit excedido (máximo 60 requests/minuto)
 */
router.post('/energy', deviceAuth, deviceRateLimiter, ingestEnergy);

module.exports = router;
