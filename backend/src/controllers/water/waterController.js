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

    // 2. Obtener últimas lecturas (para flow actual)
    const placeholders = deviceIds.map(() => '?').join(',');
    const latestReadings = db.prepare(`
      SELECT
        device_id,
        flow,
        total,
        timestamp
      FROM water_readings
      WHERE device_id IN (${placeholders})
        AND datetime(timestamp) > datetime('now', '-5 minutes')
      ORDER BY timestamp DESC
    `).all(...deviceIds);

    // 3. Calcular flow actual (últimas lecturas)
    const uniqueDevices = {};
    latestReadings.forEach(reading => {
      if (!uniqueDevices[reading.device_id]) {
        uniqueDevices[reading.device_id] = reading;
      }
    });

    const readings = Object.values(uniqueDevices);
    const totalFlow = readings.reduce((sum, r) => sum + (r.flow || 0), 0);

    // 4. Calcular consumo del día (MAX - MIN de cada sensor)
    const volumeToday = db.prepare(`
      SELECT
        COALESCE(SUM(daily_consumption), 0) as total_volume
      FROM (
        SELECT
          device_id,
          MAX(total) - MIN(total) as daily_consumption
        FROM water_readings
        WHERE device_id IN (${placeholders})
          AND date(timestamp) = date('now')
        GROUP BY device_id
      )
    `).get(...deviceIds);

    const totalVolume = volumeToday?.total_volume || 0;

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

    // NOTA: total es ACUMULATIVO, por eso usamos MAX - MIN
    const history = db.prepare(`
      SELECT
        strftime('%Y-%m-%dT%H:00:00', timestamp) as hour,
        AVG(flow) as avg_flow,
        MAX(total) - MIN(total) as total_volume,
        COUNT(*) as readings_count
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

/**
 * Obtener estadísticas semanales de consumo de agua (por día)
 * Filtra por usuario logueado
 */
const getWeeklyStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Validar fechas
    if (!startDate || !endDate) {
      return error(res, 'Se requieren startDate y endDate (formato: YYYY-MM-DD)', 400);
    }

    // Obtener dispositivos del usuario
    const userDevices = db.prepare(`
      SELECT device_id FROM devices
      WHERE user_id = ? AND device_type = 'water'
    `).all(userId);

    if (userDevices.length === 0) {
      return success(res, { data: [], period: { startDate, endDate }, totalDays: 0 }, 'Sin dispositivos de agua');
    }

    const deviceIds = userDevices.map(d => d.device_id);
    const placeholders = deviceIds.map(() => '?').join(',');

    // Obtener estadísticas agrupadas por día
    // NOTA: total es ACUMULATIVO, por eso usamos MAX - MIN
    const statistics = db.prepare(`
      SELECT
        date(w.timestamp) as fecha,
        CASE cast(strftime('%w', w.timestamp) as integer)
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as dia_semana,
        COUNT(*) as num_lecturas,
        ROUND(AVG(w.flow), 3) as flujo_promedio_lmin,
        ROUND(MAX(w.flow), 3) as flujo_maximo_lmin,
        ROUND(MIN(w.total), 3) as litros_inicio,
        ROUND(MAX(w.total), 3) as litros_fin,
        ROUND(MAX(w.total) - MIN(w.total), 3) as consumo_dia_litros
      FROM water_readings w
      WHERE w.device_id IN (${placeholders})
        AND date(w.timestamp) >= date(?)
        AND date(w.timestamp) <= date(?)
      GROUP BY date(w.timestamp)
      ORDER BY fecha ASC
    `).all(...deviceIds, startDate, endDate);

    // Validaciones y warnings
    const warnings = [];
    statistics.forEach(stat => {
      // Warning si el consumo diario es muy alto (>500L)
      if (stat.consumo_dia_litros > 500) {
        warnings.push({
          fecha: stat.fecha,
          tipo: 'consumo_alto',
          mensaje: `Consumo de ${stat.consumo_dia_litros}L parece muy alto. Verificar posible fuga.`,
          valor: stat.consumo_dia_litros
        });
      }

      // Warning si el flujo es anormalmente alto (>30 L/min)
      if (stat.flujo_maximo_lmin > 30) {
        warnings.push({
          fecha: stat.fecha,
          tipo: 'flujo_alto',
          mensaje: `Flujo máximo de ${stat.flujo_maximo_lmin} L/min es muy alto. Verificar sensor YF-201.`,
          valor: stat.flujo_maximo_lmin
        });
      }
    });

    return success(res, {
      data: statistics,
      period: { startDate, endDate },
      totalDays: statistics.length,
      warnings: warnings.length > 0 ? warnings : undefined
    }, 'Estadísticas semanales obtenidas exitosamente');

  } catch (err) {
    console.error('Error al obtener estadísticas semanales de agua:', err);
    return error(res, 'Error al obtener estadísticas', 500);
  }
};

module.exports = {
  getAllSensors,
  getSensorById,
  getTotalConsumption,
  getConsumptionHistory,
  getWeeklyStatistics
};