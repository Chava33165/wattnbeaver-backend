// src/controllers/water/waterProcessorController.js
const waterProcessor = require('../../processors/water/waterProcessor');
const { success, error } = require('../../utils/response');

/**
 * Obtener análisis de sensor
 */
const getSensorAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '24h' } = req.query;

    const analysis = waterProcessor.processSensorData(id, period);

    if (!analysis) {
      return error(res, 'No hay datos suficientes para el análisis', 404);
    }

    return success(res, analysis, 'Análisis completado');
  } catch (err) {
    console.error('Error en análisis de sensor:', err);
    return error(res, 'Error al procesar análisis', 500);
  }
};

/**
 * Detectar fugas
 */
const detectLeaks = async (req, res) => {
  try {
    const { id } = req.params;
    const { threshold_minutes = 30, min_flow = 1 } = req.query;

    const leakDetection = waterProcessor.detectLeaks(
      id,
      parseInt(threshold_minutes),
      parseFloat(min_flow)
    );

    return success(res, leakDetection, 'Detección de fugas completada');
  } catch (err) {
    console.error('Error al detectar fugas:', err);
    return error(res, 'Error al detectar fugas', 500);
  }
};

/**
 * Analizar patrones de consumo
 */
const analyzePatterns = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;

    const patterns = waterProcessor.analyzeConsumptionPatterns(id, parseInt(days));

    if (!patterns) {
      return error(res, 'No hay datos suficientes para análisis de patrones', 404);
    }

    return success(res, patterns, 'Patrones analizados');
  } catch (err) {
    console.error('Error al analizar patrones:', err);
    return error(res, 'Error al analizar patrones', 500);
  }
};

/**
 * Calcular costo de agua
 */
const calculateCost = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '24h', cost_per_liter = 0.05 } = req.query;

    const costAnalysis = waterProcessor.calculateWaterCost(
      id,
      period,
      parseFloat(cost_per_liter)
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
 * Obtener resumen del procesador
 */
const getProcessorSummary = async (req, res) => {
  try {
    const summary = waterProcessor.getSummary();
    return success(res, summary, 'Resumen obtenido');
  } catch (err) {
    console.error('Error al obtener resumen:', err);
    return error(res, 'Error al obtener resumen', 500);
  }
};

module.exports = {
  getSensorAnalysis,
  detectLeaks,
  analyzePatterns,
  calculateCost,
  getProcessorSummary
};
