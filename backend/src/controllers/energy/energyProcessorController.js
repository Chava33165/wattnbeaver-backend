// src/controllers/energy/energyProcessorController.js
const energyProcessor = require('../../processors/energy/energyProcessor');
const { success, error } = require('../../utils/response');

/**
 * Obtener análisis de dispositivo
 */
const getDeviceAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '24h' } = req.query;

    const analysis = energyProcessor.processDeviceData(id, period);

    if (!analysis) {
      return error(res, 'No hay datos suficientes para el análisis', 404);
    }

    return success(res, analysis, 'Análisis completado');
  } catch (err) {
    console.error('Error en análisis de dispositivo:', err);
    return error(res, 'Error al procesar análisis', 500);
  }
};

/**
 * Obtener tendencias
 */
const getDeviceTrends = async (req, res) => {
  try {
    const { id } = req.params;
    const { interval = 'hour' } = req.query;

    const trends = energyProcessor.analyzeTrends(id, interval);

    if (!trends) {
      return error(res, 'No hay datos suficientes para tendencias', 404);
    }

    return success(res, trends, 'Tendencias obtenidas');
  } catch (err) {
    console.error('Error en tendencias:', err);
    return error(res, 'Error al obtener tendencias', 500);
  }
};

/**
 * Detectar picos de consumo
 */
const detectSpikes = async (req, res) => {
  try {
    const { id } = req.params;
    const { threshold = 1000 } = req.query;

    const spikes = energyProcessor.detectPowerSpikes(id, parseFloat(threshold));

    return success(res, spikes, 'Detección de picos completada');
  } catch (err) {
    console.error('Error al detectar picos:', err);
    return error(res, 'Error al detectar picos', 500);
  }
};

/**
 * Calcular costo
 */
const calculateCost = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '24h', cost_per_kwh = 2.5 } = req.query;

    const costAnalysis = energyProcessor.calculateEnergyCost(
      id,
      period,
      parseFloat(cost_per_kwh)
    );

    if (!costAnalysis) {
      return error(res, 'No hay datos para calcular costo', 404);
    }

    return success(res, costAnalysis, 'Costo calculado');
  } catch (err) {
    console.error('Error al calcular costo:', err);
    return error(res, 'Error al calcular costo', 500);
  }
};

/**
 * Comparar períodos
 */
const comparePeriods = async (req, res) => {
  try {
    const { id } = req.params;
    const { period1 = 'today', period2 = 'yesterday' } = req.query;

    const comparison = energyProcessor.comparePeriods(id, period1, period2);

    if (!comparison) {
      return error(res, 'No hay datos suficientes para comparación', 404);
    }

    return success(res, comparison, 'Comparación completada');
  } catch (err) {
    console.error('Error en comparación:', err);
    return error(res, 'Error al comparar períodos', 500);
  }
};

/**
 * Obtener resumen del procesador
 */
const getProcessorSummary = async (req, res) => {
  try {
    const summary = energyProcessor.getSummary();
    return success(res, summary, 'Resumen obtenido');
  } catch (err) {
    console.error('Error al obtener resumen:', err);
    return error(res, 'Error al obtener resumen', 500);
  }
};

module.exports = {
  getDeviceAnalysis,
  getDeviceTrends,
  detectSpikes,
  calculateCost,
  comparePeriods,
  getProcessorSummary
};
