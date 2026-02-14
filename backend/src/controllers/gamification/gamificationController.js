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

/**
 * ========================================
 * NUEVOS ENDPOINTS OPTIMIZADOS PARA FLUTTER
 * ========================================
 */

/**
 * Obtener dashboard completo (perfil + logros recientes + retos + racha)
 * Endpoint optimizado para pantalla principal de Flutter
 */
const getDashboard = async (req, res) => {
  try {
    const dashboard = Gamification.getDashboardSummary(req.user.id);

    return success(res, dashboard, 'Dashboard obtenido');

  } catch (err) {
    console.error('Error al obtener dashboard:', err);
    return error(res, 'Error al obtener dashboard', 500);
  }
};

/**
 * Obtener perfil completo con toda la información
 */
const getProfileComplete = async (req, res) => {
  try {
    const profile = Gamification.getProfileComplete(req.user.id);

    return success(res, { profile }, 'Perfil completo obtenido');

  } catch (err) {
    console.error('Error al obtener perfil completo:', err);
    return error(res, 'Error al obtener perfil completo', 500);
  }
};

/**
 * Obtener logros con progreso automático calculado
 */
const getAchievementsWithProgress = async (req, res) => {
  try {
    const achievements = Gamification.getUserAchievementsWithProgress(req.user.id);

    const completed = achievements.filter(a => a.completed === 1);
    const inProgress = achievements.filter(a => !a.completed && a.auto_progress > 0);
    const locked = achievements.filter(a => !a.completed && (!a.auto_progress || a.auto_progress === 0));

    return success(res, {
      achievements,
      summary: {
        total: achievements.length,
        completed: completed.length,
        in_progress: inProgress.length,
        locked: locked.length
      }
    }, 'Logros con progreso obtenidos');

  } catch (err) {
    console.error('Error al obtener logros con progreso:', err);
    return error(res, 'Error al obtener logros', 500);
  }
};

/**
 * Obtener retos con progreso actualizado
 */
const getChallengesWithProgress = async (req, res) => {
  try {
    const challenges = Gamification.getUserChallengesWithProgress(req.user.id);

    const active = challenges.filter(c => c.status === 'active');
    const completed = challenges.filter(c => c.status === 'completed');

    return success(res, {
      challenges,
      summary: {
        active: active.length,
        completed: completed.length,
        total: challenges.length
      }
    }, 'Retos con progreso obtenidos');

  } catch (err) {
    console.error('Error al obtener retos con progreso:', err);
    return error(res, 'Error al obtener retos', 500);
  }
};

/**
 * Obtener información de racha actual
 */
const getStreak = async (req, res) => {
  try {
    const streakInfo = Gamification.getStreakInfo(req.user.id);

    return success(res, { streak: streakInfo }, 'Información de racha obtenida');

  } catch (err) {
    console.error('Error al obtener racha:', err);
    return error(res, 'Error al obtener racha', 500);
  }
};

/**
 * Obtener leaderboard con opciones de ordenamiento
 */
const getLeaderboardOptimized = async (req, res) => {
  try {
    const { limit = 10, order_by = 'points' } = req.query;

    const leaderboard = Gamification.getLeaderboardOptimized(parseInt(limit), order_by);
    const rankContext = Gamification.getUserRankWithContext(req.user.id);

    return success(res, {
      leaderboard,
      user: rankContext
    }, 'Leaderboard obtenido');

  } catch (err) {
    console.error('Error al obtener leaderboard:', err);
    return error(res, 'Error al obtener leaderboard', 500);
  }
};

/**
 * Obtener logros desbloqueados recientemente
 */
const getRecentAchievements = async (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const achievements = Gamification.getRecentAchievements(req.user.id, parseInt(hours));

    return success(res, {
      achievements,
      count: achievements.length
    }, 'Logros recientes obtenidos');

  } catch (err) {
    console.error('Error al obtener logros recientes:', err);
    return error(res, 'Error al obtener logros recientes', 500);
  }
};

/**
 * Obtener retos disponibles para asignar
 */
const getAvailableChallenges = async (req, res) => {
  try {
    const available = Gamification.getAvailableChallenges(req.user.id);

    return success(res, {
      challenges: available,
      count: available.length
    }, 'Retos disponibles obtenidos');

  } catch (err) {
    console.error('Error al obtener retos disponibles:', err);
    return error(res, 'Error al obtener retos disponibles', 500);
  }
};

/**
 * Asignar reto a usuario
 */
const assignChallenge = async (req, res) => {
  try {
    const { challenge_id } = req.body;

    if (!challenge_id) {
      return error(res, 'challenge_id es requerido', 400);
    }

    const result = Gamification.assignChallengeToUser(req.user.id, challenge_id);

    return success(res, { challenge: result }, 'Reto asignado exitosamente', 201);

  } catch (err) {
    console.error('Error al asignar reto:', err);
    return error(res, err.message || 'Error al asignar reto', 500);
  }
};

/**
 * Procesar gamificación manualmente (para testing)
 */
const processGamification = async (req, res) => {
  try {
    const result = await Gamification.processGamification(req.user.id);

    return success(res, result, 'Gamificación procesada exitosamente');

  } catch (err) {
    console.error('Error al procesar gamificación:', err);
    return error(res, 'Error al procesar gamificación', 500);
  }
};

module.exports = {
  // Endpoints originales
  getProfile,
  getAchievements,
  getChallenges,
  startChallenge,
  getLeaderboard,
  getStats,

  // Nuevos endpoints optimizados
  getDashboard,
  getProfileComplete,
  getAchievementsWithProgress,
  getChallengesWithProgress,
  getStreak,
  getLeaderboardOptimized,
  getRecentAchievements,
  getAvailableChallenges,
  assignChallenge,
  processGamification
};
