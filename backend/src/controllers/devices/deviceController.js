// src/controllers/devices/deviceController.js
const Device = require('../../models/Device');
const { success, error } = require('../../utils/response');
const db = require('../../services/database');

/**
 * Vincular nuevo dispositivo
 */
const linkDevice = async (req, res) => {
  try {
    const { device_id, device_name, device_type, location, household_id } = req.body;

    // Validar campos requeridos
    if (!device_id || !device_name || !device_type) {
      return error(res, 'device_id, device_name y device_type son requeridos', 400);
    }

    // Crear dispositivo vinculado al usuario
    const device = await Device.create(req.user.id, {
      device_id,
      device_name,
      device_type,
      location,
      household_id
    });

    return success(res, {
      device: device.toJSON()
    }, 'Dispositivo vinculado exitosamente', 201);

  } catch (err) {
    console.error('Error al vincular dispositivo:', err);
    
    if (err.message.includes('ya está vinculado')) {
      return error(res, err.message, 409);
    }
    
    return error(res, err.message || 'Error al vincular dispositivo', 400);
  }
};

/**
 * Obtener todos los dispositivos del usuario
 */
const getMyDevices = async (req, res) => {
  try {
    const { type } = req.query;

    const devices = await Device.findByUserId(req.user.id, type);
    const stats = await Device.getStats(req.user.id);

    const devicesWithReadings = devices.map(d => {
      const json = d.toJSON();
      let current_reading = null;

      if (d.device_type === 'energy') {
        const row = db.prepare(`
          SELECT power, voltage, current, energy, timestamp
          FROM energy_readings
          WHERE device_id = ?
          ORDER BY timestamp DESC
          LIMIT 1
        `).get(d.device_id);
        current_reading = row || null;
      } else if (d.device_type === 'water') {
        const row = db.prepare(`
          SELECT flow, total, timestamp
          FROM water_readings
          WHERE device_id = ?
          ORDER BY timestamp DESC
          LIMIT 1
        `).get(d.device_id);
        current_reading = row || null;
      }

      return { ...json, current_reading };
    });

    return success(res, {
      devices: devicesWithReadings,
      stats,
      total: devices.length
    }, 'Dispositivos obtenidos');

  } catch (err) {
    console.error('Error al obtener dispositivos:', err);
    return error(res, 'Error al obtener dispositivos', 500);
  }
};

/**
 * Obtener dispositivo por ID
 */
const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id);

    if (!device) {
      return error(res, 'Dispositivo no encontrado', 404);
    }

    // Verificar que el dispositivo pertenezca al usuario
    if (device.user_id !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'No tienes permiso para ver este dispositivo', 403);
    }

    return success(res, {
      device: device.toJSON()
    }, 'Dispositivo obtenido');

  } catch (err) {
    console.error('Error al obtener dispositivo:', err);
    return error(res, 'Error al obtener dispositivo', 500);
  }
};

/**
 * Actualizar dispositivo
 */
const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { device_name, location, status } = req.body;

    // Buscar dispositivo
    const device = await Device.findById(id);

    if (!device) {
      return error(res, 'Dispositivo no encontrado', 404);
    }

    // Verificar permisos
    if (device.user_id !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'No tienes permiso para modificar este dispositivo', 403);
    }

    // Actualizar
    const updatedDevice = await Device.update(id, {
      device_name,
      location,
      status
    });

    return success(res, {
      device: updatedDevice.toJSON()
    }, 'Dispositivo actualizado exitosamente');

  } catch (err) {
    console.error('Error al actualizar dispositivo:', err);
    return error(res, err.message || 'Error al actualizar dispositivo', 500);
  }
};

/**
 * Desvincular dispositivo
 */
const unlinkDevice = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar dispositivo
    const device = await Device.findById(id);

    if (!device) {
      return error(res, 'Dispositivo no encontrado', 404);
    }

    // Verificar permisos
    if (device.user_id !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'No tienes permiso para desvincular este dispositivo', 403);
    }

    // Eliminar
    await Device.delete(id);

    return success(res, null, 'Dispositivo desvinculado exitosamente');

  } catch (err) {
    console.error('Error al desvincular dispositivo:', err);
    return error(res, 'Error al desvincular dispositivo', 500);
  }
};

/**
 * Obtener estadísticas de dispositivos
 */
const getDeviceStats = async (req, res) => {
  try {
    const stats = await Device.getStats(req.user.id);

    return success(res, stats, 'Estadísticas obtenidas');

  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    return error(res, 'Error al obtener estadísticas', 500);
  }
};

/**
 * Rotar API Key de un dispositivo
 */
const rotateApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar dispositivo
    const device = await Device.findById(id);

    if (!device) {
      return error(res, 'Dispositivo no encontrado', 404);
    }

    // Verificar permisos
    if (device.user_id !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'No tienes permiso para modificar este dispositivo', 403);
    }

    // Rotar la API key
    const updatedDevice = await Device.rotateApiKey(id);

    console.log(`🔄 API Key rotada para dispositivo: ${device.device_id}`);

    return success(res, {
      device: updatedDevice.toJSON(),
      warning: 'API Key rotada exitosamente. Actualiza la configuración de tu ESP32 con la nueva clave.'
    }, 'API Key rotada exitosamente');

  } catch (err) {
    console.error('Error al rotar API key:', err);
    return error(res, 'Error al rotar API key', 500);
  }
};

module.exports = {
  linkDevice,
  getMyDevices,
  getDeviceById,
  updateDevice,
  unlinkDevice,
  getDeviceStats,
  rotateApiKey
};