// src/routes/api/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  exportReport
} = require('../../controllers/reports/reportController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/reports/daily:
 *   get:
 *     summary: Reporte diario
 *     description: Consumo de energía y agua del día actual o fecha específica
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha del reporte (YYYY-MM-DD). Por defecto es hoy.
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 */
router.get('/daily', authMiddleware, getDailyReport);

/**
 * @swagger
 * /api/v1/reports/weekly:
 *   get:
 *     summary: Reporte semanal
 *     description: Consumo por día de la semana actual o específica
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: week_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Inicio de la semana (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 */
router.get('/weekly', authMiddleware, getWeeklyReport);

/**
 * @swagger
 * /api/v1/reports/monthly:
 *   get:
 *     summary: Reporte mensual
 *     description: Consumo por semana del mes actual o específico
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Mes (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Año (ej. 2026)
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 */
router.get('/monthly', authMiddleware, getMonthlyReport);

/**
 * @swagger
 * /api/v1/reports/export/{period}/{format}:
 *   get:
 *     summary: Exportar reporte
 *     description: Exportar reporte en formato JSON o CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *     responses:
 *       200:
 *         description: Reporte exportado
 */
router.get('/export/:period/:format', authMiddleware, exportReport);

module.exports = router;
