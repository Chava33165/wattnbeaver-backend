// src/routes/api/goalRoutes.js
const express = require('express');
const router = express.Router();
const {
  createGoal,
  getGoals,
  getGoalById,
  updateGoalProgress,
  cancelGoal
} = require('../../controllers/goals/goalController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/goals:
 *   post:
 *     summary: Crear meta de ahorro
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - target_type
 *               - target_value
 *               - unit
 *               - end_date
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Reducir consumo 15%"
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [energy, water]
 *               target_type:
 *                 type: string
 *                 enum: [reduction, limit, below]
 *               target_value:
 *                 type: number
 *                 example: 15
 *               unit:
 *                 type: string
 *                 example: "percentage"
 *               end_date:
 *                 type: string
 *                 format: date-time
 */
router.post('/', authMiddleware, createGoal);

/**
 * @swagger
 * /api/v1/goals:
 *   get:
 *     summary: Obtener mis metas
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [energy, water]
 */
router.get('/', authMiddleware, getGoals);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   get:
 *     summary: Obtener meta por ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authMiddleware, getGoalById);

/**
 * @swagger
 * /api/v1/goals/{id}/progress:
 *   put:
 *     summary: Actualizar progreso de meta
 *     description: Si no se envía current_value, se calcula automáticamente
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               current_value:
 *                 type: number
 */
router.put('/:id/progress', authMiddleware, updateGoalProgress);

/**
 * @swagger
 * /api/v1/goals/{id}/cancel:
 *   put:
 *     summary: Cancelar meta
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/cancel', authMiddleware, cancelGoal);

module.exports = router;
