// src/models/BaseModel.js
/**
 * Clase base para modelos
 * Contiene métodos comunes de validación
 */
class BaseModel {
  /**
   * Validar email
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validar contraseña
   * Mínimo 8 caracteres, al menos una letra y un número
   */
  static isValidPassword(password) {
    if (password.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
  }

  /**
   * Sanitizar string (prevenir inyecciones)
   */
  static sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
  }

  /**
   * Generar ID único
   */
  static generateId(prefix = '') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = BaseModel;
