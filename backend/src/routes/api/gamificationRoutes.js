// src/routes/api/gamificationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProfile,
  getAchievements,
  getChallenges,
  startChallenge,
  getLeaderboard,
  getStats
} = require('../../controllers/gamification/gamificationController');
const { authMiddleware } = require('../../middlewares/auth');

/**
 * @swagger
 * /api/v1/gamification/profile:
 *   get:
 *     summary: Obtener perfil de gamificación
 *     description: Puntos, nivel, racha del usuario actual
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @swagger
 * /api/v1/gamification/achievements:
 *   get:
 *     summary: Obtener logros
 *     description: Logros desbloqueados y pendientes
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 */
router.get('/achievements', authMiddleware, getAchievements);

/**
 * @swagger
 * /api/v1/gamification/challenges:
 *   get:
 *     summary: Obtener retos
 *     description: Retos activos y completados
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 */
router.get('/challenges', authMiddleware, getChallenges);

/**
 * @swagger
 * /api/v1/gamification/challenges/start:
 *   post:
 *     summary: Iniciar un reto
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 */
router.post('/challenges/start', authMiddleware, startChallenge);

/**
 * @swagger
 * /api/v1/gamification/leaderboard:
 *   get:
 *     summary: Tabla de posiciones
 *     description: Top usuarios por puntos
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 */
router.get('/leaderboard', authMiddleware, getLeaderboard);

/**
 * @swagger
 * /api/v1/gamification/stats:
 *   get:
 *     summary: Estadísticas de gamificación
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', authMiddleware, getStats);

module.exports = router;
