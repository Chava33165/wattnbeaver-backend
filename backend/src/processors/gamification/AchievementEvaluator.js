// src/processors/gamification/AchievementEvaluator.js
const moment = require('moment');
const db = require('../../services/database');
const Notification = require('../../models/Notification');

/**
 * Evaluador de Logros
 *
 * Evalúa qué logros debe desbloquear un usuario basándose en:
 * - Días activos en la plataforma
 * - Porcentaje de reducción de consumo
 * - Rachas consecutivas
 * - Ausencia de fugas de agua
 */
class AchievementEvaluator {
  /**
   * Evaluar todos los logros pendientes de un usuario
   *
   * @param {string} userId - ID del usuario
   * @returns {Array} - Lista de logros desbloqueados en esta evaluación
   */
  static evaluateAll(userId) {
    const unlockedAchievements = [];

    // Obtener logros disponibles que el usuario NO tiene completados
    const pendingAchievements = db.prepare(`
      SELECT a.*
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      WHERE ua.id IS NULL OR ua.completed = 0
    `).all(userId);

    // Evaluar cada logro pendiente
    for (const achievement of pendingAchievements) {
      const evaluation = this.evaluateAchievement(userId, achievement);

      if (evaluation.unlocked) {
        // Registrar logro desbloqueado
        this.unlockAchievement(userId, achievement);

        // Crear notificación
        Notification.createAchievementUnlocked(userId, achievement);

        unlockedAchievements.push({
          achievement_id: achievement.id,
          name: achievement.name,
          icon: achievement.icon,
          color: achievement.color,
          points: achievement.points,
          progress: evaluation.progress,
          target: evaluation.target
        });

        console.log(`🏆 Logro desbloqueado: ${achievement.name} para usuario ${userId}`);
      }
    }

    return unlockedAchievements;
  }

  /**
   * Evaluar un logro específico
   *
   * @param {string} userId - ID del usuario
   * @param {object} achievement - Objeto del logro
   * @returns {object} - { unlocked: boolean, progress: number, target: number }
   */
  static evaluateAchievement(userId, achievement) {
    // Parsear el requirement (formato: "tipo:valor")
    const [type, valueStr] = achievement.requirement.split(':');
    const targetValue = parseFloat(valueStr);

    let currentValue = 0;
    let unlocked = false;

    switch (type) {
      case 'days_active':
        currentValue = this.getDaysActive(userId);
        unlocked = currentValue >= targetValue;
        break;

      case 'reduce_consumption':
        currentValue = this.getConsumptionReduction(userId);
        unlocked = currentValue >= targetValue;
        break;

      case 'streak_days':
        currentValue = this.getCurrentStreak(userId);
        unlocked = currentValue >= targetValue;
        break;

      case 'no_leaks':
        currentValue = this.getDaysWithoutLeaks(userId);
        unlocked = currentValue >= targetValue;
        break;

      default:
        console.warn(`⚠️  Tipo de requirement desconocido: ${type}`);
        break;
    }

    // Actualizar progreso aunque no esté desbloqueado
    this.updateProgress(userId, achievement.id, currentValue);

    return {
      unlocked,
      progress: currentValue,
      target: targetValue
    };
  }

  /**
   * Calcular días activos del usuario
   * (Días desde la creación de su cuenta)
   */
  static getDaysActive(userId) {
    const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId);

    if (!user) return 0;

    const createdDate = moment(user.created_at);
    const today = moment();

    return today.diff(createdDate, 'days');
  }

  /**
   * Calcular reducción de consumo en la última semana
   * (Comparar semana actual vs semana anterior)
   */
  static getConsumptionReduction(userId) {
    // Consumo de esta semana (últimos 7 días)
    const thisWeek = db.prepare(`
      SELECT COALESCE(SUM(energy), 0) as total
      FROM energy_readings
      WHERE user_id = ?
        AND DATE(timestamp) >= DATE('now', '-7 days')
    `).get(userId);

    // Consumo de semana anterior (días 8-14 hacia atrás)
    const lastWeek = db.prepare(`
      SELECT COALESCE(SUM(energy), 0) as total
      FROM energy_readings
      WHERE user_id = ?
        AND DATE(timestamp) >= DATE('now', '-14 days')
        AND DATE(timestamp) < DATE('now', '-7 days')
    `).get(userId);

    if (!lastWeek || lastWeek.total === 0) {
      return 0; // No hay datos suficientes
    }

    // Calcular porcentaje de reducción
    const reduction = ((lastWeek.total - thisWeek.total) / lastWeek.total) * 100;

    return Math.max(0, reduction); // Solo valores positivos (reducción)
  }

  /**
   * Obtener racha actual del usuario
   */
  static getCurrentStreak(userId) {
    const profile = db.prepare(`
      SELECT current_streak FROM user_gamification WHERE user_id = ?
    `).get(userId);

    return profile?.current_streak || 0;
  }

  /**
   * Calcular días consecutivos sin fugas de agua
   */
  static getDaysWithoutLeaks(userId) {
    // Buscar la alerta de fuga más reciente
    const lastLeak = db.prepare(`
      SELECT created_at
      FROM alerts
      WHERE user_id = ?
        AND type = 'water_leak'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    if (!lastLeak) {
      // Nunca ha tenido fugas, contar desde registro
      const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId);
      if (!user) return 0;

      const createdDate = moment(user.created_at);
      const today = moment();
      return today.diff(createdDate, 'days');
    }

    // Calcular días desde última fuga
    const leakDate = moment(lastLeak.created_at);
    const today = moment();

    return today.diff(leakDate, 'days');
  }

  /**
   * Desbloquear logro para el usuario
   */
  static unlockAchievement(userId, achievement) {
    const { v4: uuidv4 } = require('uuid');

    // Verificar si ya existe registro
    const existing = db.prepare(`
      SELECT * FROM user_achievements
      WHERE user_id = ? AND achievement_id = ?
    `).get(userId, achievement.id);

    if (existing) {
      // Actualizar a completado
      db.prepare(`
        UPDATE user_achievements
        SET completed = 1,
            completed_at = CURRENT_TIMESTAMP,
            progress = 100
        WHERE user_id = ? AND achievement_id = ?
      `).run(userId, achievement.id);
    } else {
      // Crear nuevo registro
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id, progress, completed, completed_at)
        VALUES (?, ?, ?, 100, 1, CURRENT_TIMESTAMP)
      `).run(uuidv4(), userId, achievement.id);
    }

    // Actualizar puntos del usuario
    this.addPoints(userId, achievement.points);
  }

  /**
   * Actualizar progreso de un logro
   */
  static updateProgress(userId, achievementId, currentValue) {
    const { v4: uuidv4 } = require('uuid');

    const existing = db.prepare(`
      SELECT * FROM user_achievements
      WHERE user_id = ? AND achievement_id = ?
    `).get(userId, achievementId);

    if (existing && existing.completed === 1) {
      return; // Ya completado, no actualizar
    }

    const progress = Math.min(100, Math.round(currentValue));

    if (existing) {
      db.prepare(`
        UPDATE user_achievements
        SET progress = ?
        WHERE user_id = ? AND achievement_id = ?
      `).run(progress, userId, achievementId);
    } else {
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id, progress, completed)
        VALUES (?, ?, ?, ?, 0)
      `).run(uuidv4(), userId, achievementId, progress);
    }
  }

  /**
   * Agregar puntos al usuario y verificar subida de nivel
   */
  static addPoints(userId, points) {
    // Verificar si existe perfil
    const profile = db.prepare('SELECT * FROM user_gamification WHERE user_id = ?').get(userId);

    if (!profile) {
      // Crear perfil si no existe
      db.prepare(`
        INSERT INTO user_gamification (user_id, total_points, current_level)
        VALUES (?, ?, 1)
      `).run(userId, points);
      return;
    }

    const newTotal = profile.total_points + points;
    const currentLevel = profile.current_level;
    const newLevel = this.calculateLevel(newTotal);

    // Actualizar puntos y nivel
    db.prepare(`
      UPDATE user_gamification
      SET total_points = ?, current_level = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(newTotal, newLevel, userId);

    // Si subió de nivel, crear notificación
    if (newLevel > currentLevel) {
      Notification.createLevelUp(userId, newLevel, newTotal);
      console.log(`⬆️  Usuario ${userId} subió a nivel ${newLevel}`);
    }
  }

  /**
   * Calcular nivel basado en puntos totales
   *
   * Sistema de niveles:
   * - Nivel 1: 0-99 puntos
   * - Nivel 2: 100-249 puntos
   * - Nivel 3: 250-499 puntos
   * - Nivel 4: 500-999 puntos
   * - Nivel 5: 1000-1999 puntos
   * - Y así sucesivamente (cada nivel requiere más puntos)
   */
  static calculateLevel(points) {
    if (points < 100) return 1;
    if (points < 250) return 2;
    if (points < 500) return 3;
    if (points < 1000) return 4;
    if (points < 2000) return 5;
    if (points < 3500) return 6;
    if (points < 5500) return 7;
    if (points < 8000) return 8;
    if (points < 11000) return 9;
    if (points < 15000) return 10;

    // Para niveles superiores: cada 5000 puntos = 1 nivel
    return 10 + Math.floor((points - 15000) / 5000);
  }

  /**
   * Obtener puntos necesarios para el siguiente nivel
   */
  static getPointsForNextLevel(currentLevel) {
    const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

    if (currentLevel < thresholds.length) {
      return thresholds[currentLevel];
    }

    // Para niveles superiores
    return 15000 + ((currentLevel - 10) * 5000);
  }

  /**
   * Obtener resumen de logros del usuario
   */
  static getAchievementSummary(userId) {
    const total = db.prepare('SELECT COUNT(*) as count FROM achievements').get();

    const completed = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_achievements
      WHERE user_id = ? AND completed = 1
    `).get(userId);

    const inProgress = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_achievements
      WHERE user_id = ? AND completed = 0
    `).get(userId);

    return {
      total: total.count,
      completed: completed.count,
      inProgress: inProgress.count,
      locked: total.count - completed.count - inProgress.count
    };
  }
}

module.exports = AchievementEvaluator;
