const { success, error } = require('../../utils/response');
const db = require('../../services/database');

/**
 * Obtener todos los sensores de agua (del usuario)
 */
const getAllSensors = async (req, res) => {
  try {
    const userId = req.user.id;

    const sensors = db.prepare(`
      SELECT * FROM devices 
      WHERE user_id = ? AND device_type = 'water'
    `).all(userId);

    return success(res, {
      sensors: sensors,
      total: sensors.length
    }, 'Sensores obtenidos exitosamente');
  } catch (err) {
    console.error('Error al obtener sensores:', err);
    return error(res, 'Error al obtener sensores', 500);
  }
};

/**
 * Obtener sensor por ID (del usuario)
 */
const getSensorById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const sensor = db.prepare(`
      SELECT * FROM devices 
      WHERE user_id = ? AND device_id = ? AND device_type = 'water'
    `).get(userId, id);
    
    if (!sensor) {
      return error(res, 'Sensor no encontrado', 404);
    }
    
    return success(res, { sensor }, 'Sensor obtenido exitosamente');
  } catch (err) {
    console.error('Error al obtener sensor:', err);
    return error(res, 'Error al obtener sensor', 500);
  }
};

/**
 * Obtener consumo total de agua (solo dispositivos del usuario)
 */
const getTotalConsumption = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Obtener dispositivos del usuario
    const userDevices = db.prepare(`
      SELECT device_id FROM devices 
      WHERE user_id = ? AND device_type = 'water' AND status = 'active'
    `).all(userId);

    if (userDevices.length === 0) {
      return success(res, {
        totalFlow: '0.00',
        totalVolume: '0.00',
        sensorCount: 0,
        onlineSensors: 0
      }, 'Sin dispositivos de agua');
    }

    const deviceIds = userDevices.map(d => d.device_id);

    // 2. Obtener últimas lecturas
    const placeholders = deviceIds.map(() => '?').join(',');
    const latestReadings = db.prepare(`
      SELECT 
        device_id,
        flow,
        total,
        timestamp
      FROM water_readings
      WHERE device_id IN (${placeholders})
        AND timestamp > datetime('now', '-5 minutes')
      ORDER BY timestamp DESC
    `).all(...deviceIds);

    // 3. Calcular totales
    const uniqueDevices = {};
    latestReadings.forEach(reading => {
      if (!uniqueDevices[reading.device_id]) {
        uniqueDevices[reading.device_id] = reading;
      }
    });

    const readings = Object.values(uniqueDevices);
    const totalFlow = readings.reduce((sum, r) => sum + (r.flow || 0), 0);
    const totalVolume = readings.reduce((sum, r) => sum + (r.total || 0), 0);

    return success(res, {
      totalFlow: totalFlow.toFixed(2),
      totalVolume: totalVolume.toFixed(2),
      sensorCount: deviceIds.length,
      onlineSensors: readings.length
    }, 'Consumo total de agua calculado');
  } catch (err) {
    console.error('Error al calcular consumo de agua:', err);
    return error(res, 'Error al calcular consumo', 500);
  }
};

/**
 * Obtener historial de consumo de agua
 */
const getConsumptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'day' } = req.query;

    const userDevices = db.prepare(`
      SELECT device_id FROM devices 
      WHERE user_id = ? AND device_type = 'water'
    `).all(userId);

    if (userDevices.length === 0) {
      return success(res, { data: [] }, 'Sin dispositivos');
    }

    const deviceIds = userDevices.map(d => d.device_id);
    const placeholders = deviceIds.map(() => '?').join(',');

    let timeFilter = "datetime('now', '-24 hours')";
    if (period === 'week') timeFilter = "datetime('now', '-7 days')";
    if (period === 'month') timeFilter = "datetime('now', '-30 days')";

    const history = db.prepare(`
      SELECT 
        strftime('%Y-%m-%dT%H:00:00', timestamp) as hour,
        AVG(flow) as avg_flow,
        SUM(total) as total_volume
      FROM water_readings
      WHERE device_id IN (${placeholders})
        AND timestamp > ${timeFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `).all(...deviceIds);

    return success(res, { data: history }, 'Historial obtenido');
  } catch (err) {
    console.error('Error al obtener historial de agua:', err);
    return error(res, 'Error al obtener historial', 500);
  }
};

module.exports = {
  getAllSensors,
  getSensorById,
  getTotalConsumption,
  getConsumptionHistory
};