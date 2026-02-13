// src/controllers/households/householdController.js
const Household = require('../../models/Household');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { success, error } = require('../../utils/response');

/**
 * Crear hogar
 */
const createHousehold = async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name) {
      return error(res, 'El nombre es requerido', 400);
    }

    const household = Household.create(req.user.id, { name, address });

    return success(res, { household }, 'Hogar creado exitosamente', 201);

  } catch (err) {
    console.error('Error al crear hogar:', err);
    return error(res, err.message || 'Error al crear hogar', 500);
  }
};

/**
 * Obtener mis hogares
 */
const getMyHouseholds = async (req, res) => {
  try {
    const households = Household.findByUserId(req.user.id);

    return success(res, {
      households,
      total: households.length
    }, 'Hogares obtenidos');

  } catch (err) {
    console.error('Error al obtener hogares:', err);
    return error(res, 'Error al obtener hogares', 500);
  }
};

/**
 * Obtener hogar por ID
 */
const getHouseholdById = async (req, res) => {
  try {
    const { id } = req.params;

    const household = Household.findById(id);

    if (!household) {
      return error(res, 'Hogar no encontrado', 404);
    }

    // Verificar que el usuario es miembro
    if (!Household.isMember(id, req.user.id)) {
      return error(res, 'No eres miembro de este hogar', 403);
    }

    const members = Household.getMembers(id);
    const devices = Household.getDevices(id);

    return success(res, {
      household,
      members,
      devices
    }, 'Hogar obtenido');

  } catch (err) {
    console.error('Error al obtener hogar:', err);
    return error(res, 'Error al obtener hogar', 500);
  }
};

/**
 * Invitar miembro
 */
const inviteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return error(res, 'Email es requerido', 400);
    }

    const household = Household.findById(id);

    if (!household) {
      return error(res, 'Hogar no encontrado', 404);
    }

    // Solo el owner puede invitar
    if (!Household.isOwner(id, req.user.id)) {
      return error(res, 'Solo el propietario puede invitar miembros', 403);
    }

    // Buscar usuario por email
    const user = await User.findByEmail(email);

    if (!user) {
      return error(res, 'Usuario no encontrado', 404);
    }

    // Agregar miembro
    const member = Household.addMember(id, user.id, role || 'member');

    // Notificar al usuario invitado
    Notification.create(user.id, {
      title: '🏠 Invitación a hogar',
      message: `Has sido invitado al hogar "${household.name}"`,
      type: 'household_invite',
      data: { household_id: id, household_name: household.name }
    });

    return success(res, { member }, 'Miembro invitado exitosamente', 201);

  } catch (err) {
    console.error('Error al invitar miembro:', err);
    
    if (err.message.includes('ya es miembro')) {
      return error(res, err.message, 409);
    }
    
    return error(res, err.message || 'Error al invitar miembro', 500);
  }
};

/**
 * Obtener miembros del hogar
 */
const getMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const household = Household.findById(id);

    if (!household) {
      return error(res, 'Hogar no encontrado', 404);
    }

    if (!Household.isMember(id, req.user.id)) {
      return error(res, 'No eres miembro de este hogar', 403);
    }

    const members = Household.getMembers(id);

    return success(res, {
      members,
      total: members.length
    }, 'Miembros obtenidos');

  } catch (err) {
    console.error('Error al obtener miembros:', err);
    return error(res, 'Error al obtener miembros', 500);
  }
};

/**
 * Remover miembro
 */
const removeMember = async (req, res) => {
  try {
    const { id, user_id } = req.params;

    const household = Household.findById(id);

    if (!household) {
      return error(res, 'Hogar no encontrado', 404);
    }

    // Solo el owner puede remover miembros
    if (!Household.isOwner(id, req.user.id)) {
      return error(res, 'Solo el propietario puede remover miembros', 403);
    }

    const removed = Household.removeMember(id, user_id);

    if (!removed) {
      return error(res, 'Miembro no encontrado', 404);
    }

    return success(res, null, 'Miembro removido exitosamente');

  } catch (err) {
    console.error('Error al remover miembro:', err);
    return error(res, err.message || 'Error al remover miembro', 500);
  }
};

/**
 * Actualizar hogar
 */
const updateHousehold = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    const household = Household.findById(id);

    if (!household) {
      return error(res, 'Hogar no encontrado', 404);
    }

    if (!Household.isOwner(id, req.user.id)) {
      return error(res, 'Solo el propietario puede actualizar el hogar', 403);
    }

    const updated = Household.update(id, { name, address });

    return success(res, { household: updated }, 'Hogar actualizado');

  } catch (err) {
    console.error('Error al actualizar hogar:', err);
    return error(res, err.message || 'Error al actualizar hogar', 500);
  }
};

/**
 * Eliminar hogar
 */
const deleteHousehold = async (req, res) => {
  try {
    const { id } = req.params;

    const household = Household.findById(id);

    if (!household) {
      return error(res, 'Hogar no encontrado', 404);
    }

    if (!Household.isOwner(id, req.user.id)) {
      return error(res, 'Solo el propietario puede eliminar el hogar', 403);
    }

    Household.delete(id);

    return success(res, null, 'Hogar eliminado exitosamente');

  } catch (err) {
    console.error('Error al eliminar hogar:', err);
    return error(res, 'Error al eliminar hogar', 500);
  }
};

module.exports = {
  createHousehold,
  getMyHouseholds,
  getHouseholdById,
  inviteMember,
  getMembers,
  removeMember,
  updateHousehold,
  deleteHousehold
};
