// src/processors/gamification/StreakCalculator.js
const moment = require('moment');
const db = require('../../services/database');

/**
 * Calculador de Rachas
 *
 * Calcula si el usuario mantiene una racha de días consecutivos
 * ahorrando energía o agua
 */
class StreakCalculator {
  /**
   * Calcular racha actual del usuario
   *
   * @param {string} userId - ID del usuario
   * @returns {object} - { currentStreak, lastActivityDate, shouldIncrement }
   */
  static calculateStreak(userId) {
    // Obtener perfil de gamificación
    const profile = db.prepare(`
      SELECT * FROM user_gamification WHERE user_id = ?
    `).get(userId);

    if (!profile) {
      return {
        currentStreak: 0,
        lastActivityDate: null,
        shouldIncrement: false
      };
    }

    const today = moment().format('YYYY-MM-DD');
    const lastActivity = profile.last_activity_date
      ? moment(profile.last_activity_date).format('YYYY-MM-DD')
      : null;

    // Si no hay actividad previa, empezar racha
    if (!lastActivity) {
      return {
        currentStreak: 0,
        lastActivityDate: null,
        shouldIncrement: true,
        isNew: true
      };
    }

    // Si la última actividad fue hoy, mantener racha
    if (lastActivity === today) {
      return {
        currentStreak: profile.current_streak,
        lastActivityDate: lastActivity,
        shouldIncrement: false,
        isToday: true
      };
    }

    // Si la última actividad fue ayer, incrementar racha
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    if (lastActivity === yesterday) {
      return {
        currentStreak: profile.current_streak,
        lastActivityDate: lastActivity,
        shouldIncrement: true,
        isContinuation: true
      };
    }

    // Si pasaron más de 1 día, resetear racha
    return {
      currentStreak: profile.current_streak,
      lastActivityDate: lastActivity,
      shouldIncrement: false,
      shouldReset: true
    };
  }

  /**
   * Actualizar racha del usuario
   *
   * @param {string} userId - ID del usuario
   * @param {boolean} metGoal - Si cumplió el objetivo del día
   * @returns {object} - Información de la racha actualizada
   */
  static updateStreak(userId, metGoal = true) {
    const streakInfo = this.calculateStreak(userId);
    const today = moment().format('YYYY-MM-DD HH:mm:ss');

    let newStreak = streakInfo.currentStreak;
    let updated = false;

    // Si cumplió el objetivo
    if (metGoal) {
      if (streakInfo.shouldIncrement) {
        newStreak = streakInfo.currentStreak + 1;
        updated = true;
      } else if (streakInfo.shouldReset) {
        newStreak = 1; // Empezar nueva racha
        updated = true;
      } else if (streakInfo.isNew) {
        newStreak = 1; // Primera racha
        updated = true;
      }
    }
    // Si NO cumplió el objetivo, resetear racha
    else {
      if (streakInfo.currentStreak > 0) {
        newStreak = 0;
        updated = true;
      }
    }

    // Actualizar en base de datos
    if (updated) {
      const profile = db.prepare('SELECT * FROM user_gamification WHERE user_id = ?').get(userId);
      const newBestStreak = Math.max(profile?.best_streak || 0, newStreak);

      db.prepare(`
        UPDATE user_gamification
        SET current_streak = ?,
            best_streak = ?,
            last_activity_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(newStreak, newBestStreak, today, userId);

      console.log(`🔥 Racha actualizada para ${userId}: ${newStreak} días (mejor: ${newBestStreak})`);
    }

    return {
      previousStreak: streakInfo.currentStreak,
      currentStreak: newStreak,
      bestStreak: Math.max(streakInfo.currentStreak, newStreak),
      updated,
      metGoal,
      milestone: this.getStreakMilestone(newStreak)
    };
  }

  /**
   * Verificar si alcanzó un hito de racha (7, 14, 30 días)
   */
  static getStreakMilestone(streak) {
    const milestones = [3, 7, 14, 21, 30, 60, 90, 100];

    if (milestones.includes(streak)) {
      return {
        reached: true,
        days: streak,
        message: this.getStreakMessage(streak)
      };
    }

    return { reached: false };
  }

  /**
   * Mensaje motivacional según la racha
   */
  static getStreakMessage(days) {
    if (days === 3) return '¡3 días seguidos! Vas por buen camino 🌱';
    if (days === 7) return '¡Una semana completa! Increíble 🔥';
    if (days === 14) return '¡2 semanas! Estás en fuego 🔥🔥';
    if (days === 21) return '¡3 semanas! Eres imparable 💪';
    if (days === 30) return '¡Un mes entero! Eres un campeón 🏆';
    if (days === 60) return '¡2 meses! Leyenda absoluta 👑';
    if (days === 90) return '¡3 meses! Maestro del ahorro ⭐';
    if (days === 100) return '¡100 días! Eres inspiración para todos 🎖️';

    return `${days} días de racha 🔥`;
  }

  /**
   * Verificar si el usuario cumplió objetivo hoy
   * (Comparar consumo de hoy vs promedio de últimos 7 días)
   */
  static async checkDailyGoal(userId) {
    // Obtener consumo de energía de hoy
    const todayEnergy = db.prepare(`
      SELECT COALESCE(SUM(energy), 0) as total
      FROM energy_readings
      WHERE user_id = ?
        AND DATE(timestamp) = DATE('now')
    `).get(userId);

    // Obtener promedio de últimos 7 días (excluyendo hoy)
    const avgEnergy = db.prepare(`
      SELECT COALESCE(AVG(daily_total), 0) as average
      FROM (
        SELECT DATE(timestamp) as date, SUM(energy) as daily_total
        FROM energy_readings
        WHERE user_id = ?
          AND DATE(timestamp) >= DATE('now', '-7 days')
          AND DATE(timestamp) < DATE('now')
        GROUP BY DATE(timestamp)
      )
    `).get(userId);

    // Si hoy consumió menos o igual que el promedio, cumplió el objetivo
    const metGoal = todayEnergy.total <= avgEnergy.average;

    return {
      metGoal,
      todayConsumption: todayEnergy.total,
      averageConsumption: avgEnergy.average,
      difference: avgEnergy.average - todayEnergy.total,
      percentChange: avgEnergy.average > 0
        ? ((todayEnergy.total - avgEnergy.average) / avgEnergy.average * 100).toFixed(1)
        : 0
    };
  }

  /**
   * Evaluar y actualizar racha diariamente
   */
  static async evaluateDailyStreak(userId) {
    const goalCheck = await this.checkDailyGoal(userId);
    const streakUpdate = this.updateStreak(userId, goalCheck.metGoal);

    return {
      ...goalCheck,
      ...streakUpdate
    };
  }
}

module.exports = StreakCalculator;
