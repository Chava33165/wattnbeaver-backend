// src/controllers/mqtt/mqttController.js
const mqttService = require('../../services/mqttService');
const { success, error } = require('../../utils/response');

/**
 * Obtener estadísticas de MQTT
 */
const getMQTTStats = async (req, res) => {
  try {
    const stats = mqttService.getStats();
    return success(res, stats, 'Estadísticas de MQTT obtenidas');
  } catch (err) {
    console.error('Error al obtener stats MQTT:', err);
    return error(res, 'Error al obtener estadísticas', 500);
  }
};

/**
 * Publicar mensaje manual en MQTT
 */
const publishMessage = async (req, res) => {
  try {
    const { topic, message, qos, retain } = req.body;
    
    if (!topic || !message) {
      return error(res, 'Topic y mensaje son requeridos', 400);
    }
    
    const published = mqttService.publish(topic, message, {
      qos: qos || 1,
      retain: retain || false
    });
    
    if (!published) {
      return error(res, 'Error al publicar: MQTT no conectado', 500);
    }
    
    return success(res, {
      topic,
      message,
      published: true
    }, 'Mensaje publicado exitosamente');
  } catch (err) {
    console.error('Error al publicar mensaje:', err);
    return error(res, 'Error al publicar mensaje', 500);
  }
};

module.exports = {
  getMQTTStats,
  publishMessage
};
