// src/models/Device.js
const { v4: uuidv4 } = require('uuid');
const BaseModel = require('./BaseModel');
const db = require('../services/database');

/**
 * Modelo de Dispositivo
 */
class Device extends BaseModel {
  constructor(data) {
    super();
    this.id = data.id;
    this.user_id = data.user_id;
    this.household_id = data.household_id;
    this.device_id = data.device_id;
    this.device_name = data.device_name;
    this.device_type = data.device_type;
    this.location = data.location;
    this.status = data.status;
    this.api_key = data.api_key;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Vincular dispositivo a usuario
   */
  static async create(userId, deviceData) {
    // Validaciones
    if (!deviceData.device_id || !deviceData.device_name || !deviceData.device_type) {
      throw new Error('device_id, device_name y device_type son requeridos');
    }

    // Validar device_type
    if (!['energy', 'water'].includes(deviceData.device_type)) {
      throw new Error('device_type debe ser "energy" o "water"');
    }

    // Verificar si el device_id ya está vinculado
    const existing = await this.findByDeviceId(deviceData.device_id);
    if (existing) {
      throw new Error(`El dispositivo ${deviceData.device_id} ya está vinculado a otro usuario`);
    }

    const id = uuidv4();
    const apiKey = uuidv4(); // Generar API key única para el dispositivo
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO devices (id, user_id, household_id, device_id, device_name, device_type, location, status, api_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      deviceData.household_id || null,
      deviceData.device_id,
      this.sanitize(deviceData.device_name),
      deviceData.device_type,
      deviceData.location ? this.sanitize(deviceData.location) : null,
      'active',
      apiKey,
      now,
      now
    );

    return this.findById(id);
  }

  /**
   * Buscar dispositivo por ID interno
   */
  static async findById(id) {
    const stmt = db.prepare('SELECT * FROM devices WHERE id = ?');
    const row = stmt.get(id);
    
    return row ? new Device(row) : null;
  }

  /**
   * Buscar dispositivo por device_id (ID del hardware)
   */
  static async findByDeviceId(deviceId) {
    const stmt = db.prepare('SELECT * FROM devices WHERE device_id = ?');
    const row = stmt.get(deviceId);

    return row ? new Device(row) : null;
  }

  /**
   * Buscar dispositivo por API Key individual
   */
  static async findByApiKey(apiKey) {
    const stmt = db.prepare('SELECT * FROM devices WHERE api_key = ?');
    const row = stmt.get(apiKey);

    return row ? new Device(row) : null;
  }

  /**
   * Obtener todos los dispositivos de un usuario
   */
  static async findByUserId(userId, deviceType = null) {
    let query = 'SELECT * FROM devices WHERE user_id = ?';
    const params = [userId];

    if (deviceType) {
      query += ' AND device_type = ?';
      params.push(deviceType);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => new Device(row));
  }

  /**
   * Obtener dispositivos por household
   */
  static async findByHouseholdId(householdId, deviceType = null) {
    let query = 'SELECT * FROM devices WHERE household_id = ?';
    const params = [householdId];

    if (deviceType) {
      query += ' AND device_type = ?';
      params.push(deviceType);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => new Device(row));
  }

  /**
   * Actualizar dispositivo
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.device_name) {
      fields.push('device_name = ?');
      values.push(this.sanitize(updates.device_name));
    }

    if (updates.location !== undefined) {
      fields.push('location = ?');
      values.push(updates.location ? this.sanitize(updates.location) : null);
    }

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE devices 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  }

  /**
   * Desvincular dispositivo
   */
  static async delete(id) {
    const stmt = db.prepare('DELETE FROM devices WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  /**
   * Verificar si un usuario es dueño de un dispositivo
   */
  static async isOwner(userId, deviceId) {
    const device = await this.findByDeviceId(deviceId);
    return device && device.user_id === userId;
  }

  /**
   * Obtener estadísticas de dispositivos
   */
  static async getStats(userId) {
    const stmt = db.prepare(`
      SELECT
        device_type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM devices
      WHERE user_id = ?
      GROUP BY device_type
    `);

    const rows = stmt.all(userId);

    const stats = {
      total: 0,
      energy: 0,
      water: 0,
      active: 0
    };

    rows.forEach(row => {
      stats.total += row.count;
      stats.active += row.active;
      stats[row.device_type] = row.count;
    });

    return stats;
  }

  /**
   * Rotar API Key de un dispositivo
   * Útil cuando una clave se compromete o se pierde
   */
  static async rotateApiKey(id) {
    const newApiKey = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE devices
      SET api_key = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(newApiKey, now, id);

    return this.findById(id);
  }

  /**
   * Convertir a JSON
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      household_id: this.household_id,
      device_id: this.device_id,
      device_name: this.device_name,
      device_type: this.device_type,
      location: this.location,
      status: this.status,
      api_key: this.api_key, // Crítico para aprovisionamiento WiFiManager
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Device;