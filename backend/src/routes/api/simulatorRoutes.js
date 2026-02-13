// src/routes/api/simulatorRoutes.js
const express = require('express');
const router = express.Router();
const dataSimulator = require('../../services/dataSimulator');
const { success, error } = require('../../utils/response');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/simulator/start:
 *   post:
 *     summary: Iniciar simulador de datos
 *     description: Inicia la generación automática de datos simulados para pruebas
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interval:
 *                 type: integer
 *                 description: Intervalo en milisegundos entre generación de datos
 *                 default: 5000
 *                 example: 3000
 *     responses:
 *       200:
 *         description: Simulador iniciado exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/start', authMiddleware, (req, res) => {
  try {
    const { interval = 5000 } = req.body;
    dataSimulator.start(parseInt(interval));
    return success(res, dataSimulator.getStatus(), 'Simulador iniciado');
  } catch (err) {
    console.error('Error al iniciar simulador:', err);
    return error(res, 'Error al iniciar simulador', 500);
  }
});

/**
 * @swagger
 * /api/v1/simulator/stop:
 *   post:
 *     summary: Detener simulador de datos
 *     description: Detiene la generación automática de datos simulados
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Simulador detenido exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/stop', authMiddleware, (req, res) => {
  try {
    dataSimulator.stop();
    return success(res, dataSimulator.getStatus(), 'Simulador detenido');
  } catch (err) {
    console.error('Error al detener simulador:', err);
    return error(res, 'Error al detener simulador', 500);
  }
});

/**
 * @swagger
 * /api/v1/simulator/status:
 *   get:
 *     summary: Obtener estado del simulador
 *     description: Retorna información sobre el estado actual del simulador (corriendo o detenido)
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del simulador obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isRunning:
 *                       type: boolean
 *                       description: Si el simulador está corriendo
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Dispositivos simulados
 *                     sensors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Sensores simulados
 *                     energyBufferSize:
 *                       type: integer
 *                       description: Cantidad de datos de energía en buffer
 *                     waterBufferSize:
 *                       type: integer
 *                       description: Cantidad de datos de agua en buffer
 *                     alertsCount:
 *                       type: integer
 *                       description: Cantidad de alertas generadas
 *       401:
 *         description: No autenticado
 */
router.get('/status', authMiddleware, (req, res) => {
  try {
    return success(res, dataSimulator.getStatus(), 'Estado del simulador');
  } catch (err) {
    console.error('Error al obtener estado:', err);
    return error(res, 'Error al obtener estado', 500);
  }
});

module.exports = router;