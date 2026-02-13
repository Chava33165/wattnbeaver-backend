// src/controllers/gamification/gamificationController.js
const Gamification = require('../../models/Gamification');
const { success, error } = require('../../utils/response');

/**
 * Obtener perfil de gamificación del usuario
 */
const getProfile = async (req, res) => {
  try {
    let profile = Gamification.getProfile(req.user.id);
    
    // Si no existe, crear
    if (!profile) {
      Gamification.createProfile(req.user.id);
      profile = Gamification.getProfile(req.user.id);
    }

    const rank = Gamification.getUserRank(req.user.id);

    return success(res, {
      profile: {
        ...profile,
        rank
      }
    }, 'Perfil de gamificación obtenido');

  } catch (err) {
    console.error('Error al obtener perfil:', err);
    return error(res, 'Error al obtener perfil de gamificación', 500);
  }
};

/**
 * Obtener logros del usuario
 */
const getAchievements = async (req, res) => {
  try {
    const achievements = Gamification.getUserAchievements(req.user.id);

    const unlocked = achievements.filter(a => a.completed === 1).length;
    const total = achievements.length;

    return success(res, {
      achievements,
      summary: {
        unlocked,
        total,
        percentage: Math.round((unlocked / total) * 100)
      }
    }, 'Logros obtenidos');

  } catch (err) {
    console.error('Error al obtener logros:', err);
    return error(res, 'Error al obtener logros', 500);
  }
};

/**
 * Obtener retos del usuario
 */
const getChallenges = async (req, res) => {
  try {
    const challenges = Gamification.getUserChallenges(req.user.id);

    const active = challenges.filter(c => c.status === 'active').length;
    const completed = challenges.filter(c => c.status === 'completed').length;

    return success(res, {
      challenges,
      summary: {
        active,
        completed,
        total: challenges.length
      }
    }, 'Retos obtenidos');

  } catch (err) {
    console.error('Error al obtener retos:', err);
    return error(res, 'Error al obtener retos', 500);
  }
};

/**
 * Iniciar un reto
 */
const startChallenge = async (req, res) => {
  try {
    const { challenge_id } = req.body;

    if (!challenge_id) {
      return error(res, 'challenge_id es requerido', 400);
    }

    const result = Gamification.startChallenge(req.user.id, challenge_id);

    if (result.already_active) {
      return error(res, 'Ya tienes este reto activo', 409);
    }

    return success(res, result, 'Reto iniciado exitosamente', 201);

  } catch (err) {
    console.error('Error al iniciar reto:', err);
    return error(res, err.message || 'Error al iniciar reto', 500);
  }
};

/**
 * Obtener leaderboard
 */
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = Gamification.getLeaderboard(parseInt(limit));
    const myRank = Gamification.getUserRank(req.user.id);

    return success(res, {
      leaderboard,
      my_rank: myRank
    }, 'Leaderboard obtenido');

  } catch (err) {
    console.error('Error al obtener leaderboard:', err);
    return error(res, 'Error al obtener leaderboard', 500);
  }
};

/**
 * Obtener estadísticas generales
 */
const getStats = async (req, res) => {
  try {
    const profile = Gamification.getProfile(req.user.id);
    const achievements = Gamification.getUserAchievements(req.user.id);
    const challenges = Gamification.getUserChallenges(req.user.id);
    const rank = Gamification.getUserRank(req.user.id);

    const unlockedAchievements = achievements.filter(a => a.completed === 1).length;
    const activeChallenges = challenges.filter(c => c.status === 'active').length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;

    return success(res, {
      profile: {
        ...profile,
        rank
      },
      achievements: {
        unlocked: unlockedAchievements,
        total: achievements.length,
        percentage: Math.round((unlockedAchievements / achievements.length) * 100)
      },
      challenges: {
        active: activeChallenges,
        completed: completedChallenges
      }
    }, 'Estadísticas obtenidas');

  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    return error(res, 'Error al obtener estadísticas', 500);
  }
};

module.exports = {
  getProfile,
  getAchievements,
  getChallenges,
  startChallenge,
  getLeaderboard,
  getStats
};
