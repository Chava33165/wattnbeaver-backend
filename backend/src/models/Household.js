// src/models/Household.js
const db = require('../services/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo de Hogares Compartidos
 */
class Household {
  /**
   * Crear hogar
   */
  static create(ownerId, householdData) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO households (id, name, address, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      householdData.name,
      householdData.address || null,
      ownerId,
      now,
      now
    );

    // Agregar al owner como miembro
    this.addMember(id, ownerId, 'owner');

    return this.findById(id);
  }

  /**
   * Buscar hogar por ID
   */
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM households WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Obtener hogares de un usuario
   */
  static findByUserId(userId) {
    const stmt = db.prepare(`
      SELECT h.*, hm.role
      FROM households h
      INNER JOIN household_members hm ON h.id = hm.household_id
      WHERE hm.user_id = ?
      ORDER BY h.created_at DESC
    `);
    
    return stmt.all(userId);
  }

  /**
   * Agregar miembro al hogar
   */
  static addMember(householdId, userId, role = 'member') {
    // Verificar que el hogar existe
    const household = this.findById(householdId);
    if (!household) {
      throw new Error('Hogar no encontrado');
    }

    // Verificar que no está ya agregado
    const existing = db.prepare(`
      SELECT * FROM household_members 
      WHERE household_id = ? AND user_id = ?
    `).get(householdId, userId);

    if (existing) {
      throw new Error('Usuario ya es miembro de este hogar');
    }

    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO household_members (id, household_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(id, householdId, userId, role);

    return this.getMember(householdId, userId);
  }

  /**
   * Obtener miembro
   */
  static getMember(householdId, userId) {
    const stmt = db.prepare(`
      SELECT hm.*, u.name, u.email
      FROM household_members hm
      INNER JOIN users u ON hm.user_id = u.id
      WHERE hm.household_id = ? AND hm.user_id = ?
    `);
    
    return stmt.get(householdId, userId);
  }

  /**
   * Obtener todos los miembros de un hogar
   */
  static getMembers(householdId) {
    const stmt = db.prepare(`
      SELECT hm.*, u.name, u.email
      FROM household_members hm
      INNER JOIN users u ON hm.user_id = u.id
      WHERE hm.household_id = ?
      ORDER BY hm.joined_at ASC
    `);
    
    return stmt.all(householdId);
  }

  /**
   * Verificar si un usuario es owner del hogar
   */
  static isOwner(householdId, userId) {
    const household = this.findById(householdId);
    return household && household.owner_id === userId;
  }

  /**
   * Verificar si un usuario es miembro del hogar
   */
  static isMember(householdId, userId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM household_members 
      WHERE household_id = ? AND user_id = ?
    `);
    
    const result = stmt.get(householdId, userId);
    return result.count > 0;
  }

  /**
   * Remover miembro
   */
  static removeMember(householdId, userId) {
    // No permitir remover al owner
    if (this.isOwner(householdId, userId)) {
      throw new Error('No se puede remover al propietario del hogar');
    }

    const stmt = db.prepare(`
      DELETE FROM household_members 
      WHERE household_id = ? AND user_id = ?
    `);

    const result = stmt.run(householdId, userId);
    return result.changes > 0;
  }

  /**
   * Actualizar hogar
   */
  static update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.address !== undefined) {
      fields.push('address = ?');
      values.push(updates.address);
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE households 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * Eliminar hogar
   */
  static delete(id) {
    // Primero eliminar todos los miembros
    db.prepare('DELETE FROM household_members WHERE household_id = ?').run(id);
    
    // Luego eliminar el hogar
    const stmt = db.prepare('DELETE FROM households WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  /**
   * Obtener dispositivos del hogar
   */
  static getDevices(householdId) {
    const stmt = db.prepare(`
      SELECT * FROM devices 
      WHERE household_id = ?
      ORDER BY created_at DESC
    `);
    
    return stmt.all(householdId);
  }

  /**
   * Vincular dispositivo al hogar
   */
  static linkDevice(householdId, deviceId) {
    const Device = require('./Device');
    return Device.update(deviceId, { household_id: householdId });
  }
}

module.exports = Household;
