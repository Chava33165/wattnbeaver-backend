// src/controllers/ingest/ingestController.js
const readingsService = require('../../services/readingsService');
const Device = require('../../models/Device');
const { success, error } = require('../../utils/response');

/**
 * Validar datos de sensor de agua
 */
function validateWaterData(data) {
  const errors = [];

  if (data.flow !== undefined && data.flow < 0) {
    errors.push('flow debe ser mayor o igual a 0');
  }

  if (data.total !== undefined && data.total < 0) {
    errors.push('total debe ser mayor o igual a 0');
  }

  return errors;
}

/**
 * Validar datos de sensor de energía
 */
function validateEnergyData(data) {
  const errors = [];

  if (data.power !== undefined && data.power < 0) {
    errors.push('power debe ser mayor o igual a 0');
  }

  if (data.voltage !== undefined && data.voltage !== 0 && (data.voltage < 90 || data.voltage > 250)) {
    errors.push('voltage debe estar entre 90V y 250V');
  }

  if (data.current !== undefined && data.current < 0) {
    errors.push('current debe ser mayor o igual a 0');
  }

  if (data.energy !== undefined && data.energy < 0) {
    errors.push('energy debe ser mayor o igual a 0');
  }

  return errors;
}

/**
 * Endpoint de ingesta de datos de agua (YF-201, etc.)
 * POST /api/v1/ingest/water
 */
const ingestWater = async (req, res) => {
  try {
    const { device_id, flow, total, timestamp } = req.body;

    // Validar campos requeridos
    if (!device_id) {
      return error(res, 'device_id es requerido', 400);
    }

    // Validar que al menos un campo de datos esté presente
    if (flow === undefined && total === undefined) {
      return error(res, 'Debe proporcionar al menos flow o total', 400);
    }

    // Validar rangos de datos
    const validationErrors = validateWaterData({ flow, total });
    if (validationErrors.length > 0) {
      return error(res, `Datos inválidos: ${validationErrors.join(', ')}`, 400);
    }

    // Si se autenticó con clave individual, el dispositivo ya está validado
    // Si se usó clave global, necesitamos validar que el device_id exista
    let device = req.device; // Ya viene del middleware si usó clave individual

    if (!device) {
      // Autenticación con clave global - validar device_id
      device = await Device.findByDeviceId(device_id);

      if (!device) {
        console.warn(`⚠️  Dispositivo no encontrado: ${device_id}`);
        return error(res, 'Dispositivo no encontrado', 404);
      }
    }

    // Verificar que el dispositivo sea de tipo agua
    if (device.device_type !== 'water') {
      console.warn(`⚠️  ${device_id} no es un dispositivo de tipo agua (es: ${device.device_type})`);
      return error(res, 'El dispositivo no es de tipo agua', 400);
    }

    // Preparar datos para guardar
    const readingData = {
      flow: flow !== undefined ? parseFloat(flow) : 0,
      total: total !== undefined ? parseFloat(total) : 0,
      timestamp: timestamp || new Date().toISOString()
    };

    // Guardar lectura usando el servicio existente
    // Usar device_id del dispositivo autenticado si existe (más confiable que el del body)
    const effectiveDeviceId = req.device ? req.device.device_id : device_id;
    const result = await readingsService.saveWaterReading(effectiveDeviceId, readingData);

    if (result === null) {
      return error(res, 'Error al guardar la lectura', 500);
    }

    console.log(`💧 Lectura de agua guardada: ${device_id} | Flow: ${readingData.flow} L/min | Total: ${readingData.total} L`);

    return success(res, {
      id: result,
      device_id: device_id,
      flow: readingData.flow,
      total: readingData.total,
      timestamp: readingData.timestamp
    }, 'Lectura de agua guardada correctamente');

  } catch (err) {
    console.error('❌ Error en ingestWater:', err);
    return error(res, 'Error interno al procesar la lectura', 500);
  }
};

/**
 * Endpoint de ingesta de datos de energía (PZEM-004T, Sonoff POW, etc.)
 * POST /api/v1/ingest/energy
 */
const ingestEnergy = async (req, res) => {
  try {
    const { device_id, power, voltage, current, energy, timestamp } = req.body;

    console.log(`🔍 [ingestEnergy] Recibido: device_id=${device_id}, power=${power}, voltage=${voltage}, current=${current}, energy=${energy}`);

    // Validar campos requeridos
    if (!device_id) {
      console.log(`❌ [ingestEnergy] Rechazado: device_id faltante`);
      return error(res, 'device_id es requerido', 400);
    }

    // Validar que al menos un campo de datos esté presente
    if (power === undefined && voltage === undefined && current === undefined && energy === undefined) {
      console.log(`❌ [ingestEnergy] Rechazado: sin campos de medición`);
      return error(res, 'Debe proporcionar al menos un campo de medición (power, voltage, current, energy)', 400);
    }

    // Validar rangos de datos
    const validationErrors = validateEnergyData({ power, voltage, current, energy });
    if (validationErrors.length > 0) {
      console.log(`❌ [ingestEnergy] Rechazado: validación fallida - ${validationErrors.join(', ')}`);
      return error(res, `Datos inválidos: ${validationErrors.join(', ')}`, 400);
    }

    console.log(`✅ [ingestEnergy] Validaciones pasadas, buscando dispositivo...`);


    // Si se autenticó con clave individual, el dispositivo ya está validado
    // Si se usó clave global, necesitamos validar que el device_id exista
    let device = req.device; // Ya viene del middleware si usó clave individual

    if (!device) {
      // Autenticación con clave global - validar device_id
      device = await Device.findByDeviceId(device_id);

      if (!device) {
        console.warn(`⚠️  Dispositivo no encontrado: ${device_id}`);
        return error(res, 'Dispositivo no encontrado', 404);
      }
    }

    // Verificar que el dispositivo sea de tipo energía
    if (device.device_type !== 'energy') {
      console.warn(`⚠️  ${device_id} no es un dispositivo de tipo energía (es: ${device.device_type})`);
      return error(res, 'El dispositivo no es de tipo energía', 400);
    }

    // Preparar datos para guardar
    const readingData = {
      power: power !== undefined ? parseFloat(power) : 0,
      voltage: voltage !== undefined ? parseFloat(voltage) : 0,
      current: current !== undefined ? parseFloat(current) : 0,
      energy: energy !== undefined ? parseFloat(energy) : 0,
      timestamp: timestamp || new Date().toISOString()
    };

    // Guardar lectura usando el servicio existente
    // Usar device_id del dispositivo autenticado si existe (más confiable que el del body)
    const effectiveDeviceId = req.device ? req.device.device_id : device_id;
    console.log(`💾 [ingestEnergy] Guardando lectura para device_id=${effectiveDeviceId}`);

    const result = await readingsService.saveEnergyReading(effectiveDeviceId, readingData);

    if (result === null) {
      console.log(`❌ [ingestEnergy] Error: saveEnergyReading devolvió null`);
      return error(res, 'Error al guardar la lectura', 500);
    }

    console.log(`⚡ Lectura de energía guardada: ${device_id} | Power: ${readingData.power}W | Voltage: ${readingData.voltage}V | Current: ${readingData.current}A`);

    return success(res, {
      id: result,
      device_id: device_id,
      power: readingData.power,
      voltage: readingData.voltage,
      current: readingData.current,
      energy: readingData.energy,
      timestamp: readingData.timestamp
    }, 'Lectura de energía guardada correctamente');

  } catch (err) {
    console.error('❌ Error en ingestEnergy:', err);
    return error(res, 'Error interno al procesar la lectura', 500);
  }
};

module.exports = {
  ingestWater,
  ingestEnergy
};
