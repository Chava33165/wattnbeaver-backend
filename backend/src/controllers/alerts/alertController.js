// src/controllers/alerts/alertController.js
const alertManager = require('../../processors/alerts/alertManager');
const { success, error } = require('../../utils/response');

/**
 * Obtener todas las alertas
 */
const getAllAlerts = async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      severity: req.query.severity,
      device_id: req.query.device_id,
      acknowledged: req.query.acknowledged === 'true' ? true : 
                    req.query.acknowledged === 'false' ? false : undefined,
      resolved: req.query.resolved === 'true' ? true :
                req.query.resolved === 'false' ? false : undefined,
      since: req.query.since,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const alerts = alertManager.getAllAlerts(filters);

    return success(res, {
      alerts,
      total: alerts.length,
      filters
    }, 'Alertas obtenidas');
  } catch (err) {
    console.error('Error al obtener alertas:', err);
    return error(res, 'Error al obtener alertas', 500);
  }
};

/**
 * Obtener alerta por ID
 */
const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = alertManager.getAlertById(id);

    if (!alert) {
      return error(res, 'Alerta no encontrada', 404);
    }

    return success(res, { alert }, 'Alerta obtenida');
  } catch (err) {
    console.error('Error al obtener alerta:', err);
    return error(res, 'Error al obtener alerta', 500);
  }
};

/**
 * Reconocer alerta
 */
const acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = alertManager.acknowledgeAlert(id);

    if (!alert) {
      return error(res, 'Alerta no encontrada', 404);
    }

    return success(res, { alert }, 'Alerta reconocida');
  } catch (err) {
    console.error('Error al reconocer alerta:', err);
    return error(res, 'Error al reconocer alerta', 500);
  }
};

/**
 * Resolver alerta
 */
const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    
    const alert = alertManager.resolveAlert(id, resolution);

    if (!alert) {
      return error(res, 'Alerta no encontrada', 404);
    }

    return success(res, { alert }, 'Alerta resuelta');
  } catch (err) {
    console.error('Error al resolver alerta:', err);
    return error(res, 'Error al resolver alerta', 500);
  }
};

/**
 * Obtener estadísticas de alertas
 */
const getAlertStats = async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const stats = alertManager.getAlertStats(period);

    return success(res, stats, 'Estadísticas obtenidas');
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    return error(res, 'Error al obtener estadísticas', 500);
  }
};

/**
 * Crear alerta manual
 */
const createAlert = async (req, res) => {
  try {
    const { type, device_id, message, severity, data } = req.body;

    if (!type || !device_id || !message) {
      return error(res, 'Tipo, device_id y mensaje son requeridos', 400);
    }

    const alert = alertManager.createAlert(type, device_id, message, severity, data);

    return success(res, { alert }, 'Alerta creada', 201);
  } catch (err) {
    console.error('Error al crear alerta:', err);
    return error(res, 'Error al crear alerta', 500);
  }
};

/**
 * Limpiar alertas antiguas
 */
const cleanOldAlerts = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    alertManager.cleanOldAlerts(parseInt(days));

    return success(res, null, `Alertas antiguas de más de ${days} días eliminadas`);
  } catch (err) {
    console.error('Error al limpiar alertas:', err);
    return error(res, 'Error al limpiar alertas', 500);
  }
};

module.exports = {
  getAllAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getAlertStats,
  createAlert,
  cleanOldAlerts
};
