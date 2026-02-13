// src/services/readingsService.js
const db = require('./database');
const Device = require('../models/Device');

/**
 * Servicio para gestionar lecturas de energía y agua
 */
class ReadingsService {
  /**
   * Guardar lectura de energía
   */
  async saveEnergyReading(deviceId, data) {
    try {
      // Verificar que el dispositivo existe
      const device = await Device.findByDeviceId(deviceId);
      
      if (!device) {
        console.warn(`⚠️  Dispositivo no encontrado: ${deviceId}`);
        return null;
      }

      // Verificar que sea un dispositivo de energía
      if (device.device_type !== 'energy') {
        console.warn(`⚠️  ${deviceId} no es un dispositivo de energía`);
        return null;
      }

      // Insertar lectura
      const stmt = db.prepare(`
        INSERT INTO energy_readings (device_id, user_id, power, voltage, current, energy, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        deviceId,
        device.user_id,
        data.power || 0,
        data.voltage || 0,
        data.current || 0,
        data.energy || 0,
        data.timestamp || new Date().toISOString()
      );

      return result.lastInsertRowid;
    } catch (error) {
      console.error('❌ Error al guardar lectura de energía:', error);
      return null;
    }
  }

  /**
   * Guardar lectura de agua
   */
  async saveWaterReading(deviceId, data) {
    try {
      // Verificar que el dispositivo existe
      const device = await Device.findByDeviceId(deviceId);
      
      if (!device) {
        console.warn(`⚠️  Dispositivo no encontrado: ${deviceId}`);
        return null;
      }

      // Verificar que sea un dispositivo de agua
      if (device.device_type !== 'water') {
        console.warn(`⚠️  ${deviceId} no es un dispositivo de agua`);
        return null;
      }

      // Insertar lectura
      const stmt = db.prepare(`
        INSERT INTO water_readings (device_id, user_id, flow, total, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        deviceId,
        device.user_id,
        data.flow || 0,
        data.total || 0,
        data.timestamp || new Date().toISOString()
      );

      return result.lastInsertRowid;
    } catch (error) {
      console.error('❌ Error al guardar lectura de agua:', error);
      return null;
    }
  }

  /**
   * Obtener lecturas de energía
   */
  getEnergyReadings(userId, deviceId = null, limit = 100, offset = 0) {
    let query = `
      SELECT * FROM energy_readings 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Obtener lecturas de agua
   */
  getWaterReadings(userId, deviceId = null, limit = 100, offset = 0) {
    let query = `
      SELECT * FROM water_readings 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Obtener estadísticas de energía por rango de fechas
   */
  getEnergyStats(userId, deviceId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        COUNT(*) as count,
        AVG(power) as avg_power,
        MAX(power) as max_power,
        MIN(power) as min_power,
        SUM(energy) as total_energy
      FROM energy_readings 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  /**
   * Obtener estadísticas de agua por rango de fechas
   */
  getWaterStats(userId, deviceId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        COUNT(*) as count,
        AVG(flow) as avg_flow,
        MAX(flow) as max_flow,
        MIN(flow) as min_flow,
        SUM(total) as total_volume
      FROM water_readings 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  /**
   * Limpiar lecturas antiguas (más de X días)
   */
  cleanOldReadings(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    // Limpiar lecturas de energía
    const stmtEnergy = db.prepare(`
      DELETE FROM energy_readings 
      WHERE timestamp < ?
    `);
    const resultEnergy = stmtEnergy.run(cutoffISO);

    // Limpiar lecturas de agua
    const stmtWater = db.prepare(`
      DELETE FROM water_readings 
      WHERE timestamp < ?
    `);
    const resultWater = stmtWater.run(cutoffISO);

    console.log(`🧹 Limpieza de lecturas antiguas (>${daysToKeep} días):`);
    console.log(`   - Energía: ${resultEnergy.changes} registros eliminados`);
    console.log(`   - Agua: ${resultWater.changes} registros eliminados`);

    return {
      energy: resultEnergy.changes,
      water: resultWater.changes
    };
  }

  /**
   * Obtener resumen de lecturas
   */
  getSummary() {
    const energyCount = db.prepare('SELECT COUNT(*) as count FROM energy_readings').get();
    const waterCount = db.prepare('SELECT COUNT(*) as count FROM water_readings').get();

    return {
      energy_readings: energyCount.count,
      water_readings: waterCount.count,
      total: energyCount.count + waterCount.count
    };
  }
}

// Singleton instance
const readingsService = new ReadingsService();

module.exports = readingsService;