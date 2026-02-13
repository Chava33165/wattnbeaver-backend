// src/controllers/notifications/notificationController.js
const Notification = require('../../models/Notification');
const { success, error } = require('../../utils/response');

/**
 * Obtener notificaciones del usuario
 */
const getNotifications = async (req, res) => {
  try {
    const { unread_only, limit, offset } = req.query;

    const options = {
      unreadOnly: unread_only === 'true',
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    };

    const notifications = Notification.findByUserId(req.user.id, options);
    const unreadCount = Notification.countUnread(req.user.id);

    return success(res, {
      notifications,
      unread_count: unreadCount,
      total: notifications.length
    }, 'Notificaciones obtenidas');

  } catch (err) {
    console.error('Error al obtener notificaciones:', err);
    return error(res, 'Error al obtener notificaciones', 500);
  }
};

/**
 * Marcar notificación como leída
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = Notification.findById(id);

    if (!notification) {
      return error(res, 'Notificación no encontrada', 404);
    }

    // Verificar que pertenece al usuario
    if (notification.user_id !== req.user.id) {
      return error(res, 'No autorizado', 403);
    }

    const updated = Notification.markAsRead(id);

    return success(res, { notification: updated }, 'Notificación marcada como leída');

  } catch (err) {
    console.error('Error al marcar notificación:', err);
    return error(res, 'Error al marcar notificación', 500);
  }
};

/**
 * Marcar todas como leídas
 */
const markAllAsRead = async (req, res) => {
  try {
    const count = Notification.markAllAsRead(req.user.id);

    return success(res, {
      marked: count
    }, `${count} notificaciones marcadas como leídas`);

  } catch (err) {
    console.error('Error al marcar todas:', err);
    return error(res, 'Error al marcar notificaciones', 500);
  }
};

/**
 * Crear notificación manual (testing)
 */
const createNotification = async (req, res) => {
  try {
    const { title, message, type, data } = req.body;

    if (!title || !message || !type) {
      return error(res, 'title, message y type son requeridos', 400);
    }

    const notification = Notification.create(req.user.id, {
      title,
      message,
      type,
      data
    });

    return success(res, { notification }, 'Notificación creada', 201);

  } catch (err) {
    console.error('Error al crear notificación:', err);
    return error(res, 'Error al crear notificación', 500);
  }
};

/**
 * Eliminar notificación
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = Notification.findById(id);

    if (!notification) {
      return error(res, 'Notificación no encontrada', 404);
    }

    if (notification.user_id !== req.user.id) {
      return error(res, 'No autorizado', 403);
    }

    Notification.delete(id);

    return success(res, null, 'Notificación eliminada');

  } catch (err) {
    console.error('Error al eliminar notificación:', err);
    return error(res, 'Error al eliminar notificación', 500);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification
};
