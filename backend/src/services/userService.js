// src/services/userService.js
/**
 * Servicio de gestión de usuarios
 * Centraliza la lógica de usuarios
 */

class UserService {
  constructor() {
    // Por ahora usa memoria
    // En Fase 3.4 se conectará a la base de datos
    this.users = new Map();
  }

  /**
   * Verificar si un email existe
   */
  async emailExists(email) {
    const emailLower = email.toLowerCase().trim();
    return this.users.has(emailLower);
  }

  /**
   * Agregar usuario
   */
  async addUser(user) {
    const emailLower = user.email.toLowerCase().trim();
    this.users.set(emailLower, user);
    return user;
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email) {
    const emailLower = email.toLowerCase().trim();
    return this.users.get(emailLower);
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId) {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        return user;
      }
    }
    return null;
  }

  /**
   * Obtener todos los usuarios
   */
  async getAllUsers() {
    return Array.from(this.users.values());
  }

  /**
   * Actualizar usuario
   */
  async updateUser(userId, updates) {
    const user = await this.getUserById(userId);
    if (!user) return null;

    Object.assign(user, updates);
    user.updated_at = new Date().toISOString();
    
    return user;
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(userId) {
    for (const [email, user] of this.users.entries()) {
      if (user.id === userId) {
        this.users.delete(email);
        return true;
      }
    }
    return false;
  }

  /**
   * Estadísticas de usuarios
   */
  async getStats() {
    return {
      totalUsers: this.users.size,
      registeredToday: 0, // TODO: calcular
      activeUsers: this.users.size
    };
  }
}

// Singleton instance
const userService = new UserService();

module.exports = userService;
