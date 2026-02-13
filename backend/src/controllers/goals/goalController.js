// src/controllers/goals/goalController.js
const Goal = require('../../models/Goal');
const { success, error } = require('../../utils/response');

/**
 * Crear meta
 */
const createGoal = async (req, res) => {
  try {
    const { name, description, type, target_type, target_value, unit, end_date } = req.body;

    // Validaciones
    if (!name || !type || !target_type || !target_value || !unit || !end_date) {
      return error(res, 'Campos requeridos: name, type, target_type, target_value, unit, end_date', 400);
    }

    if (!['energy', 'water'].includes(type)) {
      return error(res, 'type debe ser "energy" o "water"', 400);
    }

    if (!['reduction', 'limit', 'below'].includes(target_type)) {
      return error(res, 'target_type debe ser "reduction", "limit" o "below"', 400);
    }

    const goal = Goal.create(req.user.id, {
      name,
      description,
      type,
      target_type,
      target_value: parseFloat(target_value),
      unit,
      end_date
    });

    return success(res, { goal }, 'Meta creada exitosamente', 201);

  } catch (err) {
    console.error('Error al crear meta:', err);
    return error(res, err.message || 'Error al crear meta', 500);
  }
};

/**
 * Obtener metas del usuario
 */
const getGoals = async (req, res) => {
  try {
    const { status, type } = req.query;

    const goals = Goal.findByUserId(req.user.id, { status, type });
    const stats = Goal.getStats(req.user.id);

    return success(res, {
      goals,
      stats
    }, 'Metas obtenidas');

  } catch (err) {
    console.error('Error al obtener metas:', err);
    return error(res, 'Error al obtener metas', 500);
  }
};

/**
 * Obtener meta por ID
 */
const getGoalById = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = Goal.findById(id);

    if (!goal) {
      return error(res, 'Meta no encontrada', 404);
    }

    if (goal.user_id !== req.user.id) {
      return error(res, 'No autorizado', 403);
    }

    return success(res, { goal }, 'Meta obtenida');

  } catch (err) {
    console.error('Error al obtener meta:', err);
    return error(res, 'Error al obtener meta', 500);
  }
};

/**
 * Actualizar progreso de meta
 */
const updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_value } = req.body;

    const goal = Goal.findById(id);

    if (!goal) {
      return error(res, 'Meta no encontrada', 404);
    }

    if (goal.user_id !== req.user.id) {
      return error(res, 'No autorizado', 403);
    }

    let updated;

    if (current_value !== undefined) {
      // Actualización manual
      updated = Goal.updateProgress(id, parseFloat(current_value));
    } else {
      // Cálculo automático basado en consumos reales
      updated = Goal.calculateProgress(req.user.id, id);
    }

    return success(res, { goal: updated }, 'Progreso actualizado');

  } catch (err) {
    console.error('Error al actualizar progreso:', err);
    return error(res, err.message || 'Error al actualizar progreso', 500);
  }
};

/**
 * Cancelar meta
 */
const cancelGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = Goal.findById(id);

    if (!goal) {
      return error(res, 'Meta no encontrada', 404);
    }

    if (goal.user_id !== req.user.id) {
      return error(res, 'No autorizado', 403);
    }

    const cancelled = Goal.cancel(id);

    return success(res, { goal: cancelled }, 'Meta cancelada');

  } catch (err) {
    console.error('Error al cancelar meta:', err);
    return error(res, 'Error al cancelar meta', 500);
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoalProgress,
  cancelGoal
};

