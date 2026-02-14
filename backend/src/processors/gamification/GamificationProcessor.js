// src/processors/gamification/GamificationProcessor.js
const StreakCalculator = require('./StreakCalculator');
const AchievementEvaluator = require('./AchievementEvaluator');
const ChallengeEvaluator = require('./ChallengeEvaluator');
const db = require('../../services/database');

/**
 * Procesador Principal de Gamificación
 *
 * Orquesta todos los evaluadores y procesa la gamificación automática
 * cuando llegan nuevas lecturas de IoT
 */
class GamificationProcessor {
  /**
   * Procesar gamificación completa para un usuario
   * (Se ejecuta cuando llegan nuevas lecturas)
   *
   * @param {string} userId - ID del usuario
   * @param {object} options - Opciones de procesamiento
   * @returns {object} - Resultado completo del procesamiento
   */
  static async processUser(userId, options = {}) {
    const {
      skipStreak = false,
      skipAchievements = false,
      skipChallenges = false
    } = options;

    console.log(`🎮 Iniciando procesamiento de gamificación para usuario ${userId}...`);

    const result = {
      userId,
      timestamp: new Date().toISOString(),
      streak: null,
      achievements: null,
      challenges: null,
      profile: null,
      notifications: []
    };

    try {
      // Asegurar que el usuario tiene perfil de gamificación
      this.ensureUserProfile(userId);

      // 1. Evaluar racha diaria
      if (!skipStreak) {
        result.streak = await StreakCalculator.evaluateDailyStreak(userId);

        // Si alcanzó un hito de racha, crear notificación
        if (result.streak.milestone && result.streak.milestone.reached) {
          result.notifications.push({
            type: 'streak_milestone',
            data: result.streak.milestone
          });
        }
      }

      // 2. Evaluar logros pendientes
      if (!skipAchievements) {
        result.achievements = AchievementEvaluator.evaluateAll(userId);

        // Agregar logros desbloqueados a notificaciones
        if (result.achievements.length > 0) {
          result.notifications.push({
            type: 'achievements_unlocked',
            count: result.achievements.length,
            achievements: result.achievements
          });
        }
      }

      // 3. Evaluar retos activos
      if (!skipChallenges) {
        result.challenges = ChallengeEvaluator.evaluateAll(userId);

        // Agregar retos completados a notificaciones
        if (result.challenges.completed.length > 0) {
          result.notifications.push({
            type: 'challenges_completed',
            count: result.challenges.completed.length,
            challenges: result.challenges.completed
          });
        }
      }

      // 4. Obtener perfil actualizado del usuario
      result.profile = this.getUserProfile(userId);

      console.log(`✅ Procesamiento completado para ${userId}: ` +
        `Racha: ${result.streak?.currentStreak || 0} días, ` +
        `Logros: ${result.achievements?.length || 0} nuevos, ` +
        `Retos: ${result.challenges?.completed?.length || 0} completados`);

      return result;

    } catch (error) {
      console.error(`❌ Error procesando gamificación para ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Procesar gamificación para múltiples usuarios
   * (Útil para procesamiento batch)
   */
  static async processMultipleUsers(userIds, options = {}) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.processUser(userId, options);
        results.push(result);
      } catch (error) {
        console.error(`Error procesando usuario ${userId}:`, error);
        results.push({
          userId,
          error: error.message,
          success: false
        });
      }
    }

    return results;
  }

  /**
   * Asegurar que el usuario tiene un perfil de gamificación
   */
  static ensureUserProfile(userId) {
    const existing = db.prepare('SELECT * FROM user_gamification WHERE user_id = ?').get(userId);

    if (!existing) {
      db.prepare(`
        INSERT INTO user_gamification (user_id, total_points, current_level, current_streak, best_streak)
        VALUES (?, 0, 1, 0, 0)
      `).run(userId);

      console.log(`👤 Perfil de gamificación creado para usuario ${userId}`);
    }
  }

  /**
   * Obtener perfil completo de gamificación del usuario
   */
  static getUserProfile(userId) {
    const profile = db.prepare('SELECT * FROM user_gamification WHERE user_id = ?').get(userId);

    if (!profile) {
      return null;
    }

    // Obtener resumen de logros
    const achievementSummary = AchievementEvaluator.getAchievementSummary(userId);

    // Obtener resumen de retos
    const challengeSummary = ChallengeEvaluator.getChallengeSummary(userId);

    // Calcular puntos para siguiente nivel
    const pointsForNext = AchievementEvaluator.getPointsForNextLevel(profile.current_level);
    const pointsToNext = pointsForNext - profile.total_points;

    return {
      user_id: profile.user_id,
      level: profile.current_level,
      total_points: profile.total_points,
      points_to_next_level: Math.max(0, pointsToNext),
      current_streak: profile.current_streak,
      best_streak: profile.best_streak,
      last_activity_date: profile.last_activity_date,
      achievements: achievementSummary,
      challenges: challengeSummary
    };
  }

  /**
   * Obtener logros desbloqueados recientemente (últimas 24h)
   */
  static getRecentAchievements(userId, hours = 24) {
    const achievements = db.prepare(`
      SELECT a.*, ua.completed_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
        AND ua.completed = 1
        AND datetime(ua.completed_at) >= datetime('now', '-' || ? || ' hours')
      ORDER BY ua.completed_at DESC
    `).all(userId, hours);

    return achievements;
  }

  /**
   * Obtener retos completados recientemente
   */
  static getRecentChallenges(userId, hours = 24) {
    const challenges = db.prepare(`
      SELECT c.*, uc.completed_at, uc.current_value, uc.target_value
      FROM user_challenges uc
      JOIN challenges c ON uc.challenge_id = c.id
      WHERE uc.user_id = ?
        AND uc.status = 'completed'
        AND datetime(uc.completed_at) >= datetime('now', '-' || ? || ' hours')
      ORDER BY uc.completed_at DESC
    `).all(userId, hours);

    return challenges;
  }

  /**
   * Obtener estadísticas de gamificación del sistema
   */
  static getSystemStats() {
    const totalUsers = db.prepare(`
      SELECT COUNT(*) as count FROM user_gamification
    `).get();

    const totalPoints = db.prepare(`
      SELECT COALESCE(SUM(total_points), 0) as total FROM user_gamification
    `).get();

    const avgLevel = db.prepare(`
      SELECT COALESCE(AVG(current_level), 0) as avg FROM user_gamification
    `).get();

    const totalAchievements = db.prepare(`
      SELECT COUNT(*) as count FROM user_achievements WHERE completed = 1
    `).get();

    const totalChallenges = db.prepare(`
      SELECT COUNT(*) as count FROM user_challenges WHERE status = 'completed'
    `).get();

    const topStreak = db.prepare(`
      SELECT MAX(best_streak) as max FROM user_gamification
    `).get();

    return {
      total_users: totalUsers.count,
      total_points_awarded: totalPoints.total,
      average_level: parseFloat(avgLevel.avg.toFixed(2)),
      total_achievements_unlocked: totalAchievements.count,
      total_challenges_completed: totalChallenges.count,
      highest_streak: topStreak.max || 0
    };
  }

  /**
   * Obtener ranking de usuarios (leaderboard)
   *
   * @param {number} limit - Cantidad de usuarios a retornar
   * @param {string} orderBy - Campo de ordenamiento (points, level, streak)
   * @returns {Array} - Lista de usuarios ordenados
   */
  static getLeaderboard(limit = 10, orderBy = 'points') {
    let orderClause = 'total_points DESC';

    if (orderBy === 'level') {
      orderClause = 'current_level DESC, total_points DESC';
    } else if (orderBy === 'streak') {
      orderClause = 'best_streak DESC, current_streak DESC';
    }

    const leaderboard = db.prepare(`
      SELECT
        ug.user_id,
        u.name,
        u.avatar,
        ug.total_points,
        ug.current_level,
        ug.current_streak,
        ug.best_streak
      FROM user_gamification ug
      JOIN users u ON ug.user_id = u.id
      ORDER BY ${orderClause}
      LIMIT ?
    `).all(limit);

    return leaderboard.map((user, index) => ({
      rank: index + 1,
      user_id: user.user_id,
      name: user.name,
      avatar: user.avatar,
      points: user.total_points,
      level: user.current_level,
      current_streak: user.current_streak,
      best_streak: user.best_streak
    }));
  }

  /**
   * Obtener posición del usuario en el ranking
   */
  static getUserRank(userId) {
    // Contar cuántos usuarios tienen más puntos
    const rank = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM user_gamification
      WHERE total_points > (
        SELECT total_points FROM user_gamification WHERE user_id = ?
      )
    `).get(userId);

    return rank?.rank || null;
  }

  /**
   * Procesar gamificación diaria para todos los usuarios
   * (Se puede ejecutar mediante cron job a medianoche)
   */
  static async processDailyBatch() {
    console.log('🌙 Iniciando procesamiento diario de gamificación...');

    const allUsers = db.prepare('SELECT user_id FROM user_gamification').all();
    const userIds = allUsers.map(u => u.user_id);

    console.log(`   📊 Procesando ${userIds.length} usuarios...`);

    const results = await this.processMultipleUsers(userIds, {
      skipChallenges: false // Procesar todo
    });

    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    console.log(`✅ Procesamiento diario completado: ${successful} exitosos, ${failed} fallidos`);

    return {
      total: userIds.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Resetear racha si el usuario no cumplió objetivo hoy
   * (Se puede ejecutar mediante cron job)
   */
  static async checkAndResetStreaks() {
    console.log('🔥 Verificando rachas de usuarios...');

    const allUsers = db.prepare('SELECT user_id FROM user_gamification').all();

    for (const { user_id } of allUsers) {
      try {
        const streakInfo = StreakCalculator.calculateStreak(user_id);

        // Si la racha debe resetearse pero no se ha hecho
        if (streakInfo.shouldReset) {
          StreakCalculator.updateStreak(user_id, false); // No cumplió objetivo
          console.log(`   🔄 Racha reseteada para usuario ${user_id}`);
        }
      } catch (error) {
        console.error(`Error verificando racha para ${user_id}:`, error);
      }
    }

    console.log('✅ Verificación de rachas completada');
  }
}

module.exports = GamificationProcessor;
