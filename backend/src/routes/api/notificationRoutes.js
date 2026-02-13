// src/routes/api/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification
} = require('../../controllers/notifications/notificationController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Obtener notificaciones
 *     description: Lista de notificaciones del usuario
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *         description: Solo no leídas
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Cantidad de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset para paginación
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/', authMiddleware, getNotifications);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Crear notificación (testing)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               data:
 *                 type: object
 */
router.post('/', authMiddleware, createNotification);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Marcar notificación como leída
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id/read', authMiddleware, markAsRead);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Marcar todas como leídas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put('/read-all', authMiddleware, markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Eliminar notificación
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
