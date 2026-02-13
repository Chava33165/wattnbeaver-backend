// src/models/Notification.js
const db = require('../services/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo de Notificaciones
 */
class Notification {
  /**
   * Crear tabla de notificaciones si no existe
   */
  static initTable() {
    db.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        read_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    db.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user 
      ON notifications(user_id, created_at);
    `);
  }

  /**
   * Crear notificación
   */
  static create(userId, notificationData) {
    this.initTable();

    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      notificationData.title,
      notificationData.message,
      notificationData.type,
      notificationData.data ? JSON.stringify(notificationData.data) : null
    );

    return this.findById(id);
  }

  /**
   * Buscar notificación por ID
   */
  static findById(id) {
    this.initTable();
    
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
    this.initTable();

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
    this.initTable();

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
    this.initTable();

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
    this.initTable();

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
    this.initTable();

    const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  /**
   * Limpiar notificaciones antiguas
   */
  static cleanOld(daysToKeep = 30) {
    this.initTable();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const stmt = db.prepare(`
      DELETE FROM notifications 
      WHERE created_at < ? AND read = 1
    `);

    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }
}

module.exports = Notification;
