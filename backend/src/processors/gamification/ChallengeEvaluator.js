// src/processors/gamification/ChallengeEvaluator.js
const moment = require('moment');
const db = require('../../services/database');
const Notification = require('../../models/Notification');

/**
 * Evaluador de Retos
 *
 * Evalúa el progreso de retos activos del usuario y verifica si los completó
 * Tipos de retos:
 * - energy_reduction: Reducir consumo energético X%
 * - water_reduction: Reducir consumo de agua X litros
 * - energy_limit: Mantener consumo bajo X kWh
 * - water_limit: Mantener consumo bajo X litros
 */
class ChallengeEvaluator {
  /**
   * Evaluar todos los retos activos de un usuario
   *
   * @param {string} userId - ID del usuario
   * @returns {object} - { updated: Array, completed: Array, expired: Array }
   */
  static evaluateAll(userId) {
    const result = {
      updated: [],
      completed: [],
      expired: []
    };

    // Obtener retos activos del usuario
    const activeChallenges = db.prepare(`
      SELECT uc.*, c.name, c.description, c.type, c.reward_points
      FROM user_challenges uc
      JOIN challenges c ON uc.challenge_id = c.id
      WHERE uc.user_id = ?
        AND uc.status = 'active'
    `).all(userId);

    for (const userChallenge of activeChallenges) {
      // Verificar si expiró
      if (this.isExpired(userChallenge)) {
        this.expireChallenge(userChallenge.id);
        result.expired.push({
          challenge_id: userChallenge.challenge_id,
          name: userChallenge.name
        });
        continue;
      }

      // Calcular progreso actual
      const currentValue = this.calculateProgress(userId, userChallenge);

      // Actualizar progreso en la base de datos
      this.updateProgress(userChallenge.id, currentValue);

      result.updated.push({
        challenge_id: userChallenge.challenge_id,
        name: userChallenge.name,
        current: currentValue,
        target: userChallenge.target_value,
        percentage: Math.min(100, (currentValue / userChallenge.target_value) * 100)
      });

      // Verificar si completó el reto
      if (currentValue >= userChallenge.target_value) {
        this.completeChallenge(userId, userChallenge);

        // Crear notificación
        Notification.createChallengeCompleted(userId, {
          id: userChallenge.challenge_id,
          name: userChallenge.name,
          reward_points: userChallenge.reward_points
        });

        result.completed.push({
          challenge_id: userChallenge.challenge_id,
          name: userChallenge.name,
          points_earned: userChallenge.reward_points
        });

        console.log(`🎯 Reto completado: ${userChallenge.name} por usuario ${userId}`);
      }
    }

    return result;
  }

  /**
   * Calcular progreso de un reto específico
   *
   * @param {string} userId - ID del usuario
   * @param {object} userChallenge - Objeto del reto del usuario
   * @returns {number} - Valor actual del progreso
   */
  static calculateProgress(userId, userChallenge) {
    const startDate = moment(userChallenge.start_date).format('YYYY-MM-DD');
    const endDate = userChallenge.end_date
      ? moment(userChallenge.end_date).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    switch (userChallenge.type) {
      case 'energy_reduction':
        return this.calculateEnergyReduction(userId, startDate, endDate);

      case 'water_reduction':
        return this.calculateWaterReduction(userId, startDate, endDate);

      case 'energy_limit':
        return this.checkEnergyLimit(userId, startDate, endDate, userChallenge.target_value);

      case 'water_limit':
        return this.checkWaterLimit(userId, startDate, endDate, userChallenge.target_value);

      default:
        console.warn(`⚠️  Tipo de reto desconocido: ${userChallenge.type}`);
        return 0;
    }
  }

  /**
   * Calcular reducción de energía durante el período del reto
   * Compara período del reto vs período anterior de igual duración
   */
  static calculateEnergyReduction(userId, startDate, endDate) {
    // Consumo durante el reto
    const currentPeriod = db.prepare(`
      SELECT COALESCE(SUM(energy), 0) as total
      FROM energy_readings
      WHERE user_id = ?
        AND DATE(timestamp) >= ?
        AND DATE(timestamp) <= ?
    `).get(userId, startDate, endDate);

    // Calcular duración del reto en días
    const duration = moment(endDate).diff(moment(startDate), 'days') + 1;

    // Consumo del período anterior (misma duración)
    const previousStart = moment(startDate).subtract(duration, 'days').format('YYYY-MM-DD');
    const previousEnd = moment(startDate).subtract(1, 'days').format('YYYY-MM-DD');

    const previousPeriod = db.prepare(`
      SELECT COALESCE(SUM(energy), 0) as total
      FROM energy_readings
      WHERE user_id = ?
        AND DATE(timestamp) >= ?
        AND DATE(timestamp) <= ?
    `).get(userId, previousStart, previousEnd);

    if (!previousPeriod || previousPeriod.total === 0) {
      return 0; // No hay datos de comparación
    }

    // Calcular porcentaje de reducción
    const reduction = ((previousPeriod.total - currentPeriod.total) / previousPeriod.total) * 100;

    return Math.max(0, reduction); // Solo valores positivos
  }

  /**
   * Calcular reducción de agua durante el período del reto
   */
  static calculateWaterReduction(userId, startDate, endDate) {
    // Consumo durante el reto
    const currentPeriod = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM water_readings
      WHERE user_id = ?
        AND DATE(timestamp) >= ?
        AND DATE(timestamp) <= ?
    `).get(userId, startDate, endDate);

    // Calcular duración del reto en días
    const duration = moment(endDate).diff(moment(startDate), 'days') + 1;

    // Consumo del período anterior
    const previousStart = moment(startDate).subtract(duration, 'days').format('YYYY-MM-DD');
    const previousEnd = moment(startDate).subtract(1, 'days').format('YYYY-MM-DD');

    const previousPeriod = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM water_readings
      WHERE user_id = ?
        AND DATE(timestamp) >= ?
        AND DATE(timestamp) <= ?
    `).get(userId, previousStart, previousEnd);

    if (!previousPeriod || previousPeriod.total === 0) {
      return 0;
    }

    // Calcular litros ahorrados
    const saved = previousPeriod.total - currentPeriod.total;

    return Math.max(0, saved);
  }

  /**
   * Verificar si se mantiene bajo límite de energía
   * Retorna días que ha estado bajo el límite
   */
  static checkEnergyLimit(userId, startDate, endDate, limitKWh) {
    // Obtener consumo diario durante el período
    const dailyConsumption = db.prepare(`
      SELECT DATE(timestamp) as date, SUM(energy) as total
      FROM energy_readings
      WHERE user_id = ?
        AND DATE(timestamp) >= ?
        AND DATE(timestamp) <= ?
      GROUP BY DATE(timestamp)
    `).all(userId, startDate, endDate);

    // Contar días que estuvo bajo el límite
    let daysUnderLimit = 0;

    for (const day of dailyConsumption) {
      if (day.total <= limitKWh) {
        daysUnderLimit++;
      }
    }

    return daysUnderLimit;
  }

  /**
   * Verificar si se mantiene bajo límite de agua
   */
  static checkWaterLimit(userId, startDate, endDate, limitLiters) {
    const dailyConsumption = db.prepare(`
      SELECT DATE(timestamp) as date, SUM(total) as total
      FROM water_readings
      WHERE user_id = ?
        AND DATE(timestamp) >= ?
        AND DATE(timestamp) <= ?
      GROUP BY DATE(timestamp)
    `).all(userId, startDate, endDate);

    let daysUnderLimit = 0;

    for (const day of dailyConsumption) {
      if (day.total <= limitLiters) {
        daysUnderLimit++;
      }
    }

    return daysUnderLimit;
  }

  /**
   * Verificar si un reto expiró
   */
  static isExpired(userChallenge) {
    if (!userChallenge.end_date) {
      return false; // Sin fecha de fin
    }

    const endDate = moment(userChallenge.end_date);
    const today = moment();

    return today.isAfter(endDate);
  }

  /**
   * Marcar reto como expirado
   */
  static expireChallenge(userChallengeId) {
    db.prepare(`
      UPDATE user_challenges
      SET status = 'expired'
      WHERE id = ?
    `).run(userChallengeId);

    console.log(`⏱️  Reto expirado: ${userChallengeId}`);
  }

  /**
   * Actualizar progreso de un reto
   */
  static updateProgress(userChallengeId, currentValue) {
    db.prepare(`
      UPDATE user_challenges
      SET current_value = ?
      WHERE id = ?
    `).run(currentValue, userChallengeId);
  }

  /**
   * Completar reto y otorgar recompensa
   */
  static completeChallenge(userId, userChallenge) {
    // Marcar como completado
    db.prepare(`
      UPDATE user_challenges
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userChallenge.id);

    // Otorgar puntos de recompensa
    this.addPoints(userId, userChallenge.reward_points);
  }

  /**
   * Agregar puntos al usuario
   */
  static addPoints(userId, points) {
    const AchievementEvaluator = require('./AchievementEvaluator');
    AchievementEvaluator.addPoints(userId, points);
  }

  /**
   * Asignar reto a usuario
   *
   * @param {string} userId - ID del usuario
   * @param {string} challengeId - ID del reto
   * @returns {object} - Reto del usuario creado
   */
  static assignChallenge(userId, challengeId) {
    const { v4: uuidv4 } = require('uuid');

    // Obtener información del reto
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
      throw new Error('Ya tienes este reto activo');
    }

    // Calcular fecha de fin
    const endDate = moment().add(challenge.duration_days, 'days').format('YYYY-MM-DD HH:mm:ss');

    // Crear reto de usuario
    const userChallengeId = uuidv4();

    db.prepare(`
      INSERT INTO user_challenges (id, user_id, challenge_id, current_value, target_value, status, end_date)
      VALUES (?, ?, ?, 0, ?, 'active', ?)
    `).run(userChallengeId, userId, challengeId, challenge.target_value, endDate);

    console.log(`🎯 Reto asignado: ${challenge.name} a usuario ${userId}`);

    return db.prepare('SELECT * FROM user_challenges WHERE id = ?').get(userChallengeId);
  }

  /**
   * Obtener resumen de retos del usuario
   */
  static getChallengeSummary(userId) {
    const active = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_challenges
      WHERE user_id = ? AND status = 'active'
    `).get(userId);

    const completed = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_challenges
      WHERE user_id = ? AND status = 'completed'
    `).get(userId);

    const expired = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_challenges
      WHERE user_id = ? AND status = 'expired'
    `).get(userId);

    return {
      active: active.count,
      completed: completed.count,
      expired: expired.count,
      total: active.count + completed.count + expired.count
    };
  }

  /**
   * Obtener retos disponibles para asignar
   */
  static getAvailableChallenges(userId) {
    // Obtener todos los retos
    const allChallenges = db.prepare('SELECT * FROM challenges').all();

    // Obtener retos activos del usuario
    const activeChallengeIds = db.prepare(`
      SELECT challenge_id
      FROM user_challenges
      WHERE user_id = ? AND status = 'active'
    `).all(userId).map(c => c.challenge_id);

    // Filtrar retos que no estén activos
    return allChallenges.filter(c => !activeChallengeIds.includes(c.id));
  }
}

module.exports = ChallengeEvaluator;
