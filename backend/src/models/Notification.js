// src/models/Notification.js
const db = require('../services/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo de Notificaciones
 */
class Notification {
  /**
   * Crear tabla de notificaciones si no existe
   * (Ya se crea en database.js, este método es legacy)
   */
  static initTable() {
    // Tabla ahora se crea en database.js con columna icon incluida
    // Este método se mantiene por compatibilidad pero ya no es necesario
  }

  /**
   * Crear notificación
   */
  static create(userId, notificationData) {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, data, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      notificationData.title,
      notificationData.message,
      notificationData.type,
      notificationData.data ? JSON.stringify(notificationData.data) : null,
      notificationData.icon || null
    );

    console.log(`📬 Notificación creada para usuario ${userId}: ${notificationData.title}`);

    return this.findById(id);
  }

  /**
   * Buscar notificación por ID
   */
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM notifications WHERE id = ?');
    const notification = stmt.get(id);

    if (notification && notification.data) {
      notification.data = JSON.parse(notification.data);
    }

    return notification;
  }

  /**
   * Obtener notificaciones de un usuario
   */
  static findByUserId(userId, options = {}) {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unreadOnly) {
      query += ' AND read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const notifications = stmt.all(...params);

    return notifications.map(n => {
      if (n.data) {
        n.data = JSON.parse(n.data);
      }
      return n;
    });
  }

  /**
   * Marcar como leída
   */
  static markAsRead(id) {
    const stmt = db.prepare(`
      UPDATE notifications
      SET read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
    return this.findById(id);
  }

  /**
   * Marcar todas como leídas
   */
  static markAllAsRead(userId) {
    const stmt = db.prepare(`
      UPDATE notifications
      SET read = 1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND read = 0
    `);

    const result = stmt.run(userId);
    return result.changes;
  }

  /**
   * Contar no leídas
   */
  static countUnread(userId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND read = 0
    `);

    const result = stmt.get(userId);
    return result.count;
  }

  /**
   * Eliminar notificación
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }

  /**
   * Limpiar notificaciones antiguas
   */
  static cleanOld(daysToKeep = 30) {

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const stmt = db.prepare(`
      DELETE FROM notifications 
      WHERE created_at < ? AND read = 1
    `);

    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }

  /**
   * ========================================
   * MÉTODOS ESPECÍFICOS DE GAMIFICACIÓN
   * ========================================
   */

  /**
   * Crear notificación de logro desbloqueado
   */
  static createAchievementUnlocked(userId, achievement) {
    return this.create(userId, {
      type: 'achievement',
      title: '¡Nuevo Logro Desbloqueado!',
      message: `Has conseguido: ${achievement.name} ${achievement.icon}`,
      icon: achievement.icon,
      data: {
        achievement_id: achievement.id,
        points_earned: achievement.points,
        color: achievement.color
      }
    });
  }

  /**
   * Crear notificación de subida de nivel
   */
  static createLevelUp(userId, newLevel, totalPoints) {
    return this.create(userId, {
      type: 'level_up',
      title: '¡Subiste de Nivel!',
      message: `Ahora eres Nivel ${newLevel} 🎉`,
      icon: '⬆️',
      data: {
        new_level: newLevel,
        total_points: totalPoints
      }
    });
  }

  /**
   * Crear notificación de reto completado
   */
  static createChallengeCompleted(userId, challenge) {
    return this.create(userId, {
      type: 'challenge',
      title: '¡Reto Completado!',
      message: `Completaste: ${challenge.name} 🏆`,
      icon: '🎯',
      data: {
        challenge_id: challenge.id,
        points_earned: challenge.reward_points
      }
    });
  }

  /**
   * Crear notificación de racha
   */
  static createStreak(userId, days) {
    let icon = '🔥';
    let title = `Racha de ${days} días`;

    if (days === 7) {
      title = '¡Una Semana de Racha!';
      icon = '🔥🔥';
    } else if (days === 30) {
      title = '¡Un Mes de Racha!';
      icon = '🔥🔥🔥';
    }

    return this.create(userId, {
      type: 'streak',
      title: title,
      message: `Llevas ${days} días consecutivos ahorrando`,
      icon: icon,
      data: {
        streak_days: days
      }
    });
  }

  /**
   * Obtener notificaciones recientes (últimas X horas)
   */
  static getRecent(userId, hours = 24) {
    const stmt = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
        AND datetime(created_at) >= datetime('now', '-' || ? || ' hours')
      ORDER BY created_at DESC
    `);

    const notifications = stmt.all(userId, hours);

    return notifications.map(n => {
      if (n.data) {
        n.data = JSON.parse(n.data);
      }
      return n;
    });
  }
}

module.exports = Notification;
