// src/models/User.js
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const BaseModel = require('./BaseModel');
const db = require('../services/database');

/**
 * Modelo de Usuario con conexión a SQLite
 */
class User extends BaseModel {
  constructor(data) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.role = data.role || 'user';
    this.avatar = data.avatar || null;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Crear usuario en la base de datos
   */
  static async create(userData) {
    // Validaciones
    if (!userData.name || !userData.email || !userData.password) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }

    if (!this.isValidEmail(userData.email)) {
      throw new Error('Email inválido');
    }

    if (!this.isValidPassword(userData.password)) {
      throw new Error('Contraseña debe tener mínimo 8 caracteres, una letra y un número');
    }

    // Verificar si el email ya existe
    const existing = await this.findByEmail(userData.email);
    if (existing) {
      throw new Error('El email ya está registrado');
    }

    // Hash de contraseña
    const password_hash = await bcrypt.hash(userData.password, 10);

    const userId = uuidv4();
    const now = new Date().toISOString();

    // Insertar en la base de datos
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      this.sanitize(userData.name),
      userData.email.toLowerCase().trim(),
      password_hash,
      userData.role || 'user',
      now,
      now
    );

    // Crear perfil de gamificación
    const stmtGamification = db.prepare(`
      INSERT INTO user_gamification (user_id, total_points, current_level, current_streak, best_streak)
      VALUES (?, 0, 1, 0, 0)
    `);
    stmtGamification.run(userId);

    return this.findById(userId);
  }

  /**
   * Buscar usuario por email
   */
  static async findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email.toLowerCase().trim());
    
    return row ? new User(row) : null;
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(userId) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(userId);
    
    return row ? new User(row) : null;
  }

  /**
   * Obtener todos los usuarios
   */
  static async findAll() {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    const rows = stmt.all();
    
    return rows.map(row => new User(row));
  }

  /**
   * Actualizar usuario
   */
  static async update(userId, updates) {
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(this.sanitize(updates.name));
    }

    if (updates.avatar) {
      fields.push('avatar = ?');
      values.push(updates.avatar);
    }

    if (updates.password) {
      if (!this.isValidPassword(updates.password)) {
        throw new Error('Contraseña debe tener mínimo 8 caracteres, una letra y un número');
      }
      const password_hash = await bcrypt.hash(updates.password, 10);
      fields.push('password_hash = ?');
      values.push(password_hash);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(userId);

    const stmt = db.prepare(`
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(userId);
  }

  /**
   * Eliminar usuario
   */
  static async delete(userId) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(userId);
    
    return result.changes > 0;
  }

  /**
   * Verificar contraseña
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }

  /**
   * Convertir a JSON seguro (sin contraseña)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      avatar: this.avatar,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;