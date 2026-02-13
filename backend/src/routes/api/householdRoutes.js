// src/routes/api/householdRoutes.js
const express = require('express');
const router = express.Router();
const {
  createHousehold,
  getMyHouseholds,
  getHouseholdById,
  inviteMember,
  getMembers,
  removeMember,
  updateHousehold,
  deleteHousehold
} = require('../../controllers/households/householdController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/households:
 *   post:
 *     summary: Crear hogar compartido
 *     tags: [Households]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Casa de los Pérez"
 *               address:
 *                 type: string
 */
router.post('/', authMiddleware, createHousehold);

/**
 * @swagger
 * /api/v1/households:
 *   get:
 *     summary: Obtener mis hogares
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authMiddleware, getMyHouseholds);

/**
 * @swagger
 * /api/v1/households/{id}:
 *   get:
 *     summary: Obtener hogar por ID
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authMiddleware, getHouseholdById);

/**
 * @swagger
 * /api/v1/households/{id}:
 *   put:
 *     summary: Actualizar hogar
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authMiddleware, updateHousehold);

/**
 * @swagger
 * /api/v1/households/{id}:
 *   delete:
 *     summary: Eliminar hogar
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authMiddleware, deleteHousehold);

/**
 * @swagger
 * /api/v1/households/{id}/invite:
 *   post:
 *     summary: Invitar miembro al hogar
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [member, viewer]
 */
router.post('/:id/invite', authMiddleware, inviteMember);

/**
 * @swagger
 * /api/v1/households/{id}/members:
 *   get:
 *     summary: Obtener miembros del hogar
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/members', authMiddleware, getMembers);

/**
 * @swagger
 * /api/v1/households/{id}/members/{user_id}:
 *   delete:
 *     summary: Remover miembro del hogar
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/members/:user_id', authMiddleware, removeMember);

module.exports = router;
