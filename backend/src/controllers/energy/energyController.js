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

    // 2. Obtener últimas lecturas de esos dispositivos (últimos 5 min)
    const placeholders = deviceIds.map(() => '?').join(',');
    const latestReadings = db.prepare(`
      SELECT
        device_id,
        power,
        timestamp
      FROM energy_readings
      WHERE device_id IN (${placeholders})
        AND datetime(timestamp) > datetime('now', '-5 minutes')
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

    // 4. Calcular energía total del día usando AVG(power) × tiempo
    const energyToday = db.prepare(`
      SELECT
        SUM(avg_power * hours_elapsed) / 1000.0 as total_energy_kwh
      FROM (
        SELECT
          device_id,
          AVG(power) as avg_power,
          (julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24 as hours_elapsed
        FROM energy_readings
        WHERE device_id IN (${placeholders})
          AND date(timestamp) = date('now')
        GROUP BY device_id
      )
    `).get(...deviceIds);

    const totalEnergy = energyToday?.total_energy_kwh || 0;

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
    // NOTA: Calculamos energía usando AVG(power) × tiempo_real en vez del campo energy del sensor
    // Calculamos el tiempo real transcurrido entre MIN y MAX timestamp de cada bucket
    // Energía (kWh) = Potencia promedio (W) × Horas transcurridas / 1000
    const history = db.prepare(`
      SELECT
        strftime('%Y-%m-%dT%H:00:00', timestamp) as hour,
        ROUND(AVG(power), 2) as avg_power,
        ROUND((julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24, 4) as hours_elapsed,
        ROUND((AVG(power) * (julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24) / 1000.0, 6) as total_energy,
        COUNT(*) as readings_count,
        datetime(MIN(timestamp), 'localtime') as first_reading,
        datetime(MAX(timestamp), 'localtime') as last_reading
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
 * Obtener estadísticas semanales de consumo de energía (por día)
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
      WHERE user_id = ? AND device_type = 'energy'
    `).all(userId);

    if (userDevices.length === 0) {
      return success(res, { data: [], period: { startDate, endDate }, totalDays: 0 }, 'Sin dispositivos de energía');
    }

    const deviceIds = userDevices.map(d => d.device_id);
    const placeholders = deviceIds.map(() => '?').join(',');

    // Obtener estadísticas agrupadas por día
    // NOTA: energy es ACUMULATIVO, por eso usamos MAX - MIN
    // NOTA 2: También calculamos energía desde potencia porque el campo energy del Sonoff suele tener errores
    const statistics = db.prepare(`
      SELECT
        date(e.timestamp) as fecha,
        CASE cast(strftime('%w', e.timestamp) as integer)
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as dia_semana,
        COUNT(*) as num_lecturas,
        ROUND(AVG(e.power), 2) as potencia_promedio_w,
        ROUND(MAX(e.power), 2) as potencia_maxima_w,
        ROUND(AVG(e.voltage), 1) as voltaje_promedio_v,
        ROUND(AVG(e.current), 3) as corriente_promedio_a,
        ROUND(MIN(e.energy), 3) as energia_inicio_kwh,
        ROUND(MAX(e.energy), 3) as energia_fin_kwh,
        ROUND(MAX(e.energy) - MIN(e.energy), 3) as consumo_sensor_kwh,
        ROUND((julianday(MAX(e.timestamp)) - julianday(MIN(e.timestamp))) * 24, 2) as horas_transcurridas
      FROM energy_readings e
      WHERE e.device_id IN (${placeholders})
        AND date(e.timestamp) >= date(?)
        AND date(e.timestamp) <= date(?)
      GROUP BY date(e.timestamp)
      ORDER BY fecha ASC
    `).all(...deviceIds, startDate, endDate);

    // Calcular energía desde potencia (más preciso)
    const statisticsWithCalculated = statistics.map(stat => {
      // Energía = Potencia × Tiempo
      // kWh = (Watts × Horas) / 1000
      const consumo_calculado_kwh = (stat.potencia_promedio_w * stat.horas_transcurridas) / 1000;

      return {
        ...stat,
        consumo_calculado_kwh: parseFloat(consumo_calculado_kwh.toFixed(4)),
        // Usar el calculado como valor principal (más confiable)
        consumo_dia_kwh: parseFloat(consumo_calculado_kwh.toFixed(4))
      };
    });

    // Validaciones y warnings
    const warnings = [];
    statisticsWithCalculated.forEach(stat => {
      // Warning si el consumo diario es anormalmente alto
      if (stat.consumo_dia_kwh > 10) {
        warnings.push({
          fecha: stat.fecha,
          tipo: 'consumo_alto',
          mensaje: `Consumo de ${stat.consumo_dia_kwh} kWh parece anormalmente alto para un dispositivo doméstico.`,
          valor: stat.consumo_dia_kwh
        });
      }

      // Warning si el voltaje está fuera de rango (127V ±15%)
      if (stat.voltaje_promedio_v < 90 || stat.voltaje_promedio_v > 145) {
        warnings.push({
          fecha: stat.fecha,
          tipo: 'voltaje_anormal',
          mensaje: `Voltaje de ${stat.voltaje_promedio_v}V fuera de rango normal (90-145V para México)`,
          valor: stat.voltaje_promedio_v
        });
      }

      // Warning si la potencia promedio es muy baja
      if (stat.potencia_promedio_w > 0 && stat.potencia_promedio_w < 50) {
        warnings.push({
          fecha: stat.fecha,
          tipo: 'potencia_baja',
          mensaje: `Potencia de ${stat.potencia_promedio_w}W muy baja. Dispositivo probablemente en standby o apagado.`,
          valor: stat.potencia_promedio_w
        });
      }

      // Warning si hay gran discrepancia entre sensor y cálculo
      const discrepancia = Math.abs(stat.consumo_sensor_kwh - stat.consumo_calculado_kwh);
      if (discrepancia > 1) {
        warnings.push({
          fecha: stat.fecha,
          tipo: 'sensor_descalibrado',
          mensaje: `Discrepancia de ${discrepancia.toFixed(2)} kWh entre sensor (${stat.consumo_sensor_kwh}) y cálculo (${stat.consumo_calculado_kwh}). El sensor Sonoff POW puede estar descalibrado.`,
          sensor_kwh: stat.consumo_sensor_kwh,
          calculado_kwh: stat.consumo_calculado_kwh,
          diferencia: discrepancia
        });
      }
    });

    return success(res, {
      data: statisticsWithCalculated,
      period: { startDate, endDate },
      totalDays: statisticsWithCalculated.length,
      warnings: warnings.length > 0 ? warnings : undefined,
      nota: 'consumo_dia_kwh usa el cálculo basado en potencia×tiempo (más preciso). consumo_sensor_kwh es el valor directo del sensor.'
    }, 'Estadísticas semanales obtenidas exitosamente');

  } catch (err) {
    console.error('Error al obtener estadísticas semanales:', err);
    return error(res, 'Error al obtener estadísticas', 500);
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
  getWeeklyStatistics,
  controlDevice
};