// src/models/Goal.js
const db = require('../services/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * Modelo de Metas de Ahorro
 */
class Goal {
  /**
   * Crear tabla de metas si no existe
   */
  static initTable() {
    db.db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_value REAL NOT NULL,
        current_value REAL DEFAULT 0,
        unit TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        completed_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    db.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_goals_user 
      ON goals(user_id, status);
    `);
  }

  /**
   * Crear meta
   */
  static create(userId, goalData) {
    this.initTable();

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO goals (
        id, user_id, name, description, type, target_type, 
        target_value, unit, start_date, end_date, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      goalData.name,
      goalData.description || null,
      goalData.type, // 'energy' o 'water'
      goalData.target_type, // 'reduction', 'limit', 'below'
      goalData.target_value,
      goalData.unit, // 'kwh', 'liters', 'percentage'
      goalData.start_date || now,
      goalData.end_date,
      'active',
      now,
      now
    );

    return this.findById(id);
  }

  /**
   * Buscar meta por ID
   */
  static findById(id) {
    this.initTable();
    
    const stmt = db.prepare('SELECT * FROM goals WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Obtener metas de un usuario
   */
  static findByUserId(userId, options = {}) {
    this.initTable();

    const { status = null, type = null, limit = 50 } = options;

    let query = 'SELECT * FROM goals WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Actualizar progreso de meta
   */
  static updateProgress(id, currentValue) {
    this.initTable();

    const goal = this.findById(id);
    
    if (!goal) {
      throw new Error('Meta no encontrada');
    }

    // Verificar si se completó
    let completed = false;
    let status = goal.status;
    let completedAt = null;

    if (goal.target_type === 'reduction') {
      // Meta de reducción (ej: reducir 15%)
      completed = currentValue >= goal.target_value;
    } else if (goal.target_type === 'limit') {
      // Meta de límite (ej: no pasar de 100 kWh)
      completed = currentValue <= goal.target_value;
    } else if (goal.target_type === 'below') {
      // Meta de estar por debajo (ej: mantener bajo 50 kWh)
      completed = currentValue < goal.target_value;
    }

    if (completed && status === 'active') {
      status = 'completed';
      completedAt = new Date().toISOString();
    }

    const stmt = db.prepare(`
      UPDATE goals 
      SET current_value = ?,
          status = ?,
          completed_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(currentValue, status, completedAt, id);

    // Si se completó, notificar al usuario
    if (completed && completedAt) {
      const Notification = require('./Notification');
      Notification.create(goal.user_id, {
        title: '🎯 ¡Meta completada!',
        message: `Has completado tu meta: ${goal.name}`,
        type: 'goal_completed',
        data: { goal_id: id, goal_name: goal.name }
      });

      // Dar puntos de gamificación
      const Gamification = require('./Gamification');
      Gamification.addPoints(goal.user_id, 150, `Meta completada: ${goal.name}`);
    }

    return this.findById(id);
  }

  /**
   * Calcular progreso automáticamente
   */
  static calculateProgress(userId, goalId) {
    this.initTable();

    const goal = this.findById(goalId);
    
    if (!goal) {
      throw new Error('Meta no encontrada');
    }

    if (goal.user_id !== userId) {
      throw new Error('No autorizado');
    }

    // Obtener consumo actual según el tipo de meta
    const now = moment();
    const startDate = moment(goal.start_date);
    const endDate = moment(goal.end_date);

    let currentValue = 0;

    if (goal.type === 'energy') {
      const stmt = db.prepare(`
        SELECT SUM(energy) as total
        FROM energy_readings
        WHERE user_id = ? 
          AND timestamp >= ? 
          AND timestamp <= ?
      `);
      
      const result = stmt.get(userId, startDate.toISOString(), now.toISOString());
      currentValue = result?.total || 0;

    } else if (goal.type === 'water') {
      const stmt = db.prepare(`
        SELECT SUM(total) as total
        FROM water_readings
        WHERE user_id = ? 
          AND timestamp >= ? 
          AND timestamp <= ?
      `);
      
      const result = stmt.get(userId, startDate.toISOString(), now.toISOString());
      currentValue = result?.total || 0;
    }

    // Si es meta de reducción, calcular porcentaje
    if (goal.target_type === 'reduction') {
      // Obtener consumo del período anterior
      const periodDuration = endDate.diff(startDate, 'days');
      const prevStart = moment(startDate).subtract(periodDuration, 'days');
      const prevEnd = moment(startDate);

      let previousValue = 0;

      if (goal.type === 'energy') {
        const stmt = db.prepare(`
          SELECT SUM(energy) as total
          FROM energy_readings
          WHERE user_id = ? 
            AND timestamp >= ? 
            AND timestamp < ?
        `);
        
        const result = stmt.get(userId, prevStart.toISOString(), prevEnd.toISOString());
        previousValue = result?.total || 0;
      } else if (goal.type === 'water') {
        const stmt = db.prepare(`
          SELECT SUM(total) as total
          FROM water_readings
          WHERE user_id = ? 
            AND timestamp >= ? 
            AND timestamp < ?
        `);
        
        const result = stmt.get(userId, prevStart.toISOString(), prevEnd.toISOString());
        previousValue = result?.total || 0;
      }

      // Calcular porcentaje de reducción
      if (previousValue > 0) {
        const reduction = ((previousValue - currentValue) / previousValue) * 100;
        currentValue = Math.max(0, reduction); // No permitir valores negativos
      }
    }

    return this.updateProgress(goalId, currentValue);
  }

  /**
   * Obtener estadísticas de metas
   */
  static getStats(userId) {
    this.initTable();

    const totalStmt = db.prepare(`
      SELECT COUNT(*) as count FROM goals WHERE user_id = ?
    `);
    
    const activeStmt = db.prepare(`
      SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = 'active'
    `);
    
    const completedStmt = db.prepare(`
      SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = 'completed'
    `);

    return {
      total: totalStmt.get(userId).count,
      active: activeStmt.get(userId).count,
      completed: completedStmt.get(userId).count
    };
  }

  /**
   * Cancelar meta
   */
  static cancel(id) {
    this.initTable();

    const stmt = db.prepare(`
      UPDATE goals 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
    return this.findById(id);
  }
}

module.exports = Goal;
