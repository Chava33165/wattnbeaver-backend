// src/models/Gamification.js
const db = require('../services/database');
const GamificationProcessor = require('../processors/gamification/GamificationProcessor');
const AchievementEvaluator = require('../processors/gamification/AchievementEvaluator');
const ChallengeEvaluator = require('../processors/gamification/ChallengeEvaluator');
const StreakCalculator = require('../processors/gamification/StreakCalculator');

/**
 * Modelo de Gamificación
 *
 * Este modelo ahora utiliza los procesadores automáticos de gamificación
 * para evaluar logros, retos y rachas de forma inteligente
 */
class Gamification {
  /**
   * Obtener perfil de gamificación de un usuario
   */
  static getProfile(userId) {
    const stmt = db.prepare(`
      SELECT * FROM user_gamification 
      WHERE user_id = ?
    `);
    
    return stmt.get(userId);
  }

  /**
   * Crear perfil de gamificación (se crea automáticamente al registrar usuario)
   */
  static createProfile(userId) {
    const stmt = db.prepare(`
      INSERT INTO user_gamification (user_id, total_points, current_level, current_streak, best_streak)
      VALUES (?, 0, 1, 0, 0)
    `);
    
    stmt.run(userId);
  }

  /**
   * Agregar puntos a un usuario
   */
  static addPoints(userId, points, reason = null) {
    const profile = this.getProfile(userId);
    
    if (!profile) {
      this.createProfile(userId);
    }

    const newPoints = (profile?.total_points || 0) + points;
    const newLevel = this.calculateLevel(newPoints);

    const stmt = db.prepare(`
      UPDATE user_gamification 
      SET total_points = ?, 
          current_level = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(newPoints, newLevel, userId);

    console.log(`🎯 Usuario ${userId} ganó ${points} puntos. Total: ${newPoints} (Nivel ${newLevel})`);

    return {
      points_earned: points,
      total_points: newPoints,
      new_level: newLevel,
      reason
    };
  }

  /**
   * Calcular nivel basado en puntos
   * Nivel 1: 0-99 puntos
   * Nivel 2: 100-299 puntos
   * Nivel 3: 300-599 puntos
   * etc.
   */
  static calculateLevel(points) {
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    if (points < 2100) return 6;
    if (points < 2800) return 7;
    if (points < 3600) return 8;
    if (points < 4500) return 9;
    return 10; // Nivel máximo
  }

  /**
   * Actualizar racha
   */
  static updateStreak(userId, isSuccess) {
    const profile = this.getProfile(userId);
    
    if (!profile) {
      this.createProfile(userId);
      return;
    }

    let newStreak = isSuccess ? profile.current_streak + 1 : 0;
    let newBestStreak = Math.max(profile.best_streak, newStreak);

    const stmt = db.prepare(`
      UPDATE user_gamification 
      SET current_streak = ?,
          best_streak = ?,
          last_activity_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(newStreak, newBestStreak, userId);

    // Recompensar rachas largas
    if (newStreak === 7) {
      this.addPoints(userId, 100, 'Racha de 7 días');
    } else if (newStreak === 30) {
      this.addPoints(userId, 500, 'Racha de 30 días');
    }

    return { current_streak: newStreak, best_streak: newBestStreak };
  }

  /**
   * Obtener todos los logros
   */
  static getAllAchievements() {
    const stmt = db.prepare('SELECT * FROM achievements ORDER BY points ASC');
    return stmt.all();
  }

  /**
   * Obtener logros de un usuario
   */
  static getUserAchievements(userId) {
    const stmt = db.prepare(`
      SELECT 
        a.*,
        ua.progress,
        ua.completed,
        ua.completed_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY ua.completed DESC, a.points ASC
    `);
    
    return stmt.all(userId);
  }

  /**
   * Desbloquear logro
   */
  static unlockAchievement(userId, achievementId) {
    // Verificar si ya está desbloqueado
    const existing = db.prepare(`
      SELECT * FROM user_achievements 
      WHERE user_id = ? AND achievement_id = ? AND completed = 1
    `).get(userId, achievementId);

    if (existing) {
      return { already_unlocked: true };
    }

    // Obtener información del logro
    const achievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(achievementId);
    
    if (!achievement) {
      throw new Error('Logro no encontrado');
    }

    // Marcar como completado
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_achievements 
      (id, user_id, achievement_id, progress, completed, completed_at)
      VALUES (?, ?, ?, 100, 1, CURRENT_TIMESTAMP)
    `);

    const id = `ua_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    stmt.run(id, userId, achievementId);

    // Agregar puntos
    this.addPoints(userId, achievement.points, `Logro: ${achievement.name}`);

    console.log(`🏆 Usuario ${userId} desbloqueó: ${achievement.name} (+${achievement.points} puntos)`);

    return {
      unlocked: true,
      achievement: achievement,
      points_earned: achievement.points
    };
  }

  /**
   * Actualizar progreso de logro
   */
  static updateAchievementProgress(userId, achievementId, progress) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_achievements 
      (id, user_id, achievement_id, progress, completed, completed_at)
      VALUES (
        COALESCE((SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?), ?),
        ?, ?, ?, 
        CASE WHEN ? >= 100 THEN 1 ELSE 0 END,
        CASE WHEN ? >= 100 THEN CURRENT_TIMESTAMP ELSE NULL END
      )
    `);

    const id = `ua_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    stmt.run(userId, achievementId, id, userId, achievementId, progress, progress, progress);

    // Si se completó, desbloquear
    if (progress >= 100) {
      return this.unlockAchievement(userId, achievementId);
    }

    return { progress: progress };
  }

  /**
   * Obtener retos activos de un usuario
   */
  static getUserChallenges(userId) {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        uc.current_value,
        uc.status,
        uc.start_date,
        uc.end_date,
        uc.completed_at,
        CAST((uc.current_value * 100.0 / uc.target_value) AS INTEGER) as progress_percent
      FROM challenges c
      LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = ?
      WHERE uc.status IS NULL OR uc.status IN ('active', 'completed')
      ORDER BY uc.status ASC, c.reward_points DESC
    `);
    
    return stmt.all(userId);
  }

  /**
   * Iniciar reto para usuario
   */
  static startChallenge(userId, challengeId) {
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId);
    
    if (!challenge) {
      throw new Error('Reto no encontrado');
    }

    // Verificar si ya tiene este reto activo
    const existing = db.prepare(`
      SELECT * FROM user_challenges 
      WHERE user_id = ? AND challenge_id = ? AND status = 'active'
    `).get(userId, challengeId);

    if (existing) {
      return { already_active: true };
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + challenge.duration_days);

    const stmt = db.prepare(`
      INSERT INTO user_challenges 
      (id, user_id, challenge_id, current_value, target_value, status, start_date, end_date)
      VALUES (?, ?, ?, 0, ?, 'active', CURRENT_TIMESTAMP, ?)
    `);

    const id = `uc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    stmt.run(id, userId, challengeId, challenge.target_value, endDate.toISOString());

    return {
      started: true,
      challenge: challenge,
      end_date: endDate
    };
  }

  /**
   * Actualizar progreso de reto
   */
  static updateChallengeProgress(userId, challengeId, currentValue) {
    const userChallenge = db.prepare(`
      SELECT * FROM user_challenges 
      WHERE user_id = ? AND challenge_id = ? AND status = 'active'
    `).get(userId, challengeId);

    if (!userChallenge) {
      return { not_found: true };
    }

    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId);
    const completed = currentValue >= userChallenge.target_value;

    const stmt = db.prepare(`
      UPDATE user_challenges 
      SET current_value = ?,
          status = ?,
          completed_at = ?
      WHERE user_id = ? AND challenge_id = ? AND status = 'active'
    `);

    stmt.run(
      currentValue,
      completed ? 'completed' : 'active',
      completed ? new Date().toISOString() : null,
      userId,
      challengeId
    );

    // Si se completó, dar recompensa
    if (completed) {
      this.addPoints(userId, challenge.reward_points, `Reto completado: ${challenge.name}`);
      
      console.log(`🎯 Usuario ${userId} completó reto: ${challenge.name} (+${challenge.reward_points} puntos)`);
      
      return {
        completed: true,
        reward_points: challenge.reward_points
      };
    }

    return { progress: currentValue };
  }

  /**
   * Obtener leaderboard (tabla de posiciones)
   */
  static getLeaderboard(limit = 10) {
    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        ug.total_points,
        ug.current_level,
        ug.current_streak,
        ug.best_streak,
        ROW_NUMBER() OVER (ORDER BY ug.total_points DESC) as rank
      FROM users u
      INNER JOIN user_gamification ug ON u.id = ug.user_id
      ORDER BY ug.total_points DESC
      LIMIT ?
    `);
    
    return stmt.all(limit);
  }

  /**
   * Obtener posición de un usuario en el leaderboard
   */
  static getUserRank(userId) {
    const stmt = db.prepare(`
      SELECT rank FROM (
        SELECT
          u.id,
          ROW_NUMBER() OVER (ORDER BY ug.total_points DESC) as rank
        FROM users u
        INNER JOIN user_gamification ug ON u.id = ug.user_id
      )
      WHERE id = ?
    `);

    const result = stmt.get(userId);
    return result ? result.rank : null;
  }

  /**
   * ========================================
   * MÉTODOS CON PROCESADORES AUTOMÁTICOS
   * ========================================
   */

  /**
   * Procesar gamificación automática completa para un usuario
   * (Se ejecuta cuando llegan nuevas lecturas de IoT)
   */
  static async processGamification(userId) {
    return await GamificationProcessor.processUser(userId);
  }

  /**
   * Obtener perfil completo optimizado para Flutter
   */
  static getProfileComplete(userId) {
    return GamificationProcessor.getUserProfile(userId);
  }

  /**
   * Obtener logros con evaluación automática de progreso
   */
  static getUserAchievementsWithProgress(userId) {
    // Obtener todos los logros con progreso
    const achievements = this.getUserAchievements(userId);

    // Actualizar progreso automáticamente
    for (const achievement of achievements) {
      if (!achievement.completed) {
        const evaluation = AchievementEvaluator.evaluateAchievement(userId, achievement);
        achievement.auto_progress = evaluation.progress;
        achievement.target_value = evaluation.target;
        achievement.completion_percentage = Math.min(100, Math.round((evaluation.progress / evaluation.target) * 100));
      }
    }

    return achievements;
  }

  /**
   * Obtener retos activos con progreso actualizado
   */
  static getUserChallengesWithProgress(userId) {
    // Evaluar todos los retos
    const evaluation = ChallengeEvaluator.evaluateAll(userId);

    // Obtener retos actualizados
    return this.getUserChallenges(userId);
  }

  /**
   * Obtener información de racha actual
   */
  static getStreakInfo(userId) {
    const streakInfo = StreakCalculator.calculateStreak(userId);
    const profile = this.getProfile(userId);

    return {
      current_streak: streakInfo.currentStreak,
      best_streak: profile?.best_streak || 0,
      last_activity_date: streakInfo.lastActivityDate,
      should_increment: streakInfo.shouldIncrement,
      milestone: StreakCalculator.getStreakMilestone(streakInfo.currentStreak)
    };
  }

  /**
   * Evaluar y actualizar racha diaria
   */
  static async evaluateDailyStreak(userId) {
    return await StreakCalculator.evaluateDailyStreak(userId);
  }

  /**
   * Obtener logros desbloqueados recientemente
   */
  static getRecentAchievements(userId, hours = 24) {
    return GamificationProcessor.getRecentAchievements(userId, hours);
  }

  /**
   * Obtener retos completados recientemente
   */
  static getRecentChallenges(userId, hours = 24) {
    return GamificationProcessor.getRecentChallenges(userId, hours);
  }

  /**
   * Obtener leaderboard optimizado
   */
  static getLeaderboardOptimized(limit = 10, orderBy = 'points') {
    return GamificationProcessor.getLeaderboard(limit, orderBy);
  }

  /**
   * Obtener ranking del usuario con contexto
   */
  static getUserRankWithContext(userId) {
    const rank = GamificationProcessor.getUserRank(userId);
    const profile = this.getProfile(userId);
    const leaderboard = this.getLeaderboardOptimized(10);

    return {
      user_rank: rank,
      total_points: profile?.total_points || 0,
      current_level: profile?.current_level || 1,
      top_10: leaderboard
    };
  }

  /**
   * Obtener estadísticas del sistema
   */
  static getSystemStats() {
    return GamificationProcessor.getSystemStats();
  }

  /**
   * Asignar reto a usuario
   */
  static assignChallengeToUser(userId, challengeId) {
    return ChallengeEvaluator.assignChallenge(userId, challengeId);
  }

  /**
   * Obtener retos disponibles para el usuario
   */
  static getAvailableChallenges(userId) {
    return ChallengeEvaluator.getAvailableChallenges(userId);
  }

  /**
   * Obtener resumen completo para dashboard de Flutter
   */
  static getDashboardSummary(userId) {
    const profile = this.getProfileComplete(userId);
    const recentAchievements = this.getRecentAchievements(userId, 24);
    const recentChallenges = this.getRecentChallenges(userId, 24);
    const streakInfo = this.getStreakInfo(userId);
    const rank = GamificationProcessor.getUserRank(userId);

    return {
      profile,
      streak: streakInfo,
      rank,
      recent_achievements: recentAchievements,
      recent_challenges: recentChallenges,
      has_new_content: recentAchievements.length > 0 || recentChallenges.length > 0
    };
  }
}

module.exports = Gamification;
