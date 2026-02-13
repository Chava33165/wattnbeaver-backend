const { success, error } = require('../../utils/response');
const db = require('../../services/database');
const mqttService = require('../../services/mqttService');

/**
 * Obtener todos los dispositivos de energía (del usuario)
 */
const getAllDevices = async (req, res) => {
  try {
    const userId = req.user.id;

    const devices = db.prepare(`
      SELECT * FROM devices 
      WHERE user_id = ? AND device_type = 'energy'
    `).all(userId);

    return success(res, {
      devices: devices,
      total: devices.length
    }, 'Dispositivos obtenidos exitosamente');
  } catch (err) {
    console.error('Error al obtener dispositivos:', err);
    return error(res, 'Error al obtener dispositivos', 500);
  }
};

/**
 * Obtener dispositivo por ID (del usuario)
 */
const getDeviceById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const device = db.prepare(`
      SELECT * FROM devices 
      WHERE user_id = ? AND device_id = ? AND device_type = 'energy'
    `).get(userId, id);
    
    if (!device) {
      return error(res, 'Dispositivo no encontrado', 404);
    }
    
    return success(res, { device }, 'Dispositivo obtenido exitosamente');
  } catch (err) {
    console.error('Error al obtener dispositivo:', err);
    return error(res, 'Error al obtener dispositivo', 500);
  }
};

/**
 * Obtener consumo total de energía (solo dispositivos del usuario)
 */
const getTotalConsumption = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Obtener dispositivos del usuario
    const userDevices = db.prepare(`
      SELECT device_id FROM devices 
      WHERE user_id = ? AND device_type = 'energy' AND status = 'active'
    `).all(userId);

    if (userDevices.length === 0) {
      return success(res, {
        totalPower: '0.00',
        totalEnergy: '0.000',
        deviceCount: 0,
        onlineDevices: 0
      }, 'Sin dispositivos de energía');
    }

    const deviceIds = userDevices.map(d => d.device_id);

    // 2. Obtener últimas lecturas de esos dispositivos
    const placeholders = deviceIds.map(() => '?').join(',');
    const latestReadings = db.prepare(`
      SELECT 
        device_id,
        power,
        energy,
        timestamp
      FROM energy_readings
      WHERE device_id IN (${placeholders})
        AND timestamp > datetime('now', '-5 minutes')
      ORDER BY timestamp DESC
    `).all(...deviceIds);

    // 3. Calcular totales (una lectura por dispositivo)
    const uniqueDevices = {};
    latestReadings.forEach(reading => {
      if (!uniqueDevices[reading.device_id]) {
        uniqueDevices[reading.device_id] = reading;
      }
    });

    const readings = Object.values(uniqueDevices);
    const totalPower = readings.reduce((sum, r) => sum + (r.power || 0), 0);
    const totalEnergy = readings.reduce((sum, r) => sum + (r.energy || 0), 0);

    return success(res, {
      totalPower: totalPower.toFixed(2),
      totalEnergy: totalEnergy.toFixed(3),
      deviceCount: deviceIds.length,
      onlineDevices: readings.length
    }, 'Consumo total calculado');
  } catch (err) {
    console.error('Error al calcular consumo:', err);
    return error(res, 'Error al calcular consumo', 500);
  }
};

/**
 * Obtener historial de consumo
 */
const getConsumptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'day' } = req.query;

    // Obtener dispositivos del usuario
    const userDevices = db.prepare(`
      SELECT device_id FROM devices 
      WHERE user_id = ? AND device_type = 'energy'
    `).all(userId);

    if (userDevices.length === 0) {
      return success(res, { data: [] }, 'Sin dispositivos');
    }

    const deviceIds = userDevices.map(d => d.device_id);
    const placeholders = deviceIds.map(() => '?').join(',');

    // Determinar período
    let timeFilter = "datetime('now', '-24 hours')";
    if (period === 'week') timeFilter = "datetime('now', '-7 days')";
    if (period === 'month') timeFilter = "datetime('now', '-30 days')";

    // Obtener historial
    const history = db.prepare(`
      SELECT 
        strftime('%Y-%m-%dT%H:00:00', timestamp) as hour,
        AVG(power) as avg_power,
        SUM(energy) as total_energy
      FROM energy_readings
      WHERE device_id IN (${placeholders})
        AND timestamp > ${timeFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `).all(...deviceIds);

    return success(res, { data: history }, 'Historial obtenido');
  } catch (err) {
    console.error('Error al obtener historial:', err);
    return error(res, 'Error al obtener historial', 500);
  }
};

/**
 * Controlar dispositivo (encender/apagar)
 */
const controlDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { action } = req.body; // 'on' o 'off' o 'toggle'
    
    // Verificar que el dispositivo pertenece al usuario
    const device = db.prepare(`
      SELECT * FROM devices 
      WHERE user_id = ? AND device_id = ? AND device_type = 'energy'
    `).get(userId, id);
    
    if (!device) {
      return error(res, 'Dispositivo no encontrado', 404);
    }
    
    if (!['on', 'off', 'toggle'].includes(action)) {
      return error(res, 'Acción inválida. Use "on", "off" o "toggle"', 400);
    }
    
    // Publicar comando a MQTT
    const published = mqttService.sendEnergyCommand(id, action);
    
    if (!published) {
      return error(res, 'Error al enviar comando: MQTT no conectado', 500);
    }
    
    return success(res, {
      device_id: id,
      action: action,
      status: 'command_sent',
      timestamp: new Date().toISOString()
    }, `Comando "${action}" enviado exitosamente a ${id}`);
  } catch (err) {
    console.error('Error al controlar dispositivo:', err);
    return error(res, 'Error al controlar dispositivo', 500);
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  getTotalConsumption,
  getConsumptionHistory,
  controlDevice
};