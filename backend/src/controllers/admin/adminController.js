const os = require('os');
const fs = require('fs');
const User = require('../../models/User');
const GamificationProcessor = require('../../processors/gamification/GamificationProcessor');
const db = require('../../services/database');
const { success, error } = require('../../utils/response');

const getAllUsers = async (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
        COALESCE(g.total_points, 0) AS total_points,
        COALESCE(g.current_level, 1) AS current_level,
        COALESCE(g.current_streak, 0) AS current_streak
      FROM users u
      LEFT JOIN user_gamification g ON g.user_id = u.id
      ORDER BY u.created_at DESC
    `).all();
    return success(res, { users: rows, total: rows.length }, 'Usuarios obtenidos');
  } catch (err) {
    return error(res, 'Error al obtener usuarios', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const row = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
        COALESCE(g.total_points, 0) AS total_points,
        COALESCE(g.current_level, 1) AS current_level,
        COALESCE(g.current_streak, 0) AS current_streak
      FROM users u
      LEFT JOIN user_gamification g ON g.user_id = u.id
      WHERE u.id = ?
    `).get(req.params.id);
    if (!row) return error(res, 'Usuario no encontrado', 404);
    return success(res, { user: row }, 'Usuario obtenido');
  } catch (err) {
    return error(res, 'Error al obtener usuario', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    if (id === req.user.id && role && role !== req.user.role)
      return error(res, 'No puedes cambiar tu propio rol', 403);
    const user = await User.findById(id);
    if (!user) return error(res, 'Usuario no encontrado', 404);
    const fields = [], values = [];
    if (name)  { fields.push('name = ?');  values.push(name.trim()); }
    if (email) { fields.push('email = ?'); values.push(email.toLowerCase().trim()); }
    if (role && ['user', 'admin'].includes(role)) { fields.push('role = ?'); values.push(role); }
    if (!fields.length) return error(res, 'No hay campos para actualizar', 400);
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const updated = await User.findById(id);
    return success(res, { user: updated.toJSON() }, 'Usuario actualizado');
  } catch (err) {
    return error(res, 'Error al actualizar usuario', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return error(res, 'No puedes eliminarte a ti mismo', 403);
    const user = await User.findById(id);
    if (!user) return error(res, 'Usuario no encontrado', 404);
    await User.delete(id);
    return success(res, { deleted: true }, 'Usuario eliminado');
  } catch (err) {
    return error(res, 'Error al eliminar usuario', 500);
  }
};

const getSystemStats = async (req, res) => {
  try {
    const gamStats = GamificationProcessor.getSystemStats();
    const totalDevices  = db.prepare(`SELECT COUNT(*) as count FROM devices`).get();
    const totalEnergy   = db.prepare(`SELECT COUNT(*) as count FROM energy_readings`).get();
    const totalWater    = db.prepare(`SELECT COUNT(*) as count FROM water_readings`).get();
    const totalAlerts   = db.prepare(`SELECT COUNT(*) as count FROM alerts`).get();
    const avgPoints     = db.prepare(`SELECT COALESCE(AVG(total_points),0) as avg FROM user_gamification`).get();
    const activeStreaks = db.prepare(`SELECT COUNT(*) as count FROM user_gamification WHERE current_streak > 0`).get();
    return success(res, { stats: {
      total_users:           gamStats.total_users,
      total_devices:         totalDevices.count,
      total_energy_readings: totalEnergy.count,
      total_water_readings:  totalWater.count,
      total_alerts:          totalAlerts.count,
      total_points_awarded:  gamStats.total_points_awarded,
      avg_points_per_user:   parseFloat(avgPoints.avg.toFixed(2)),
      active_streaks:        activeStreaks.count,
    }}, 'Estadísticas obtenidas');
  } catch (err) {
    return error(res, 'Error al obtener estadísticas', 500);
  }
};

const getServerHealth = async (req, res) => {
  try {
    const total = os.totalmem(), free = os.freemem(), used = total - free;
    let cpuTemp = null;
    try {
      cpuTemp = parseFloat((parseInt(fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8').trim()) / 1000).toFixed(1));
    } catch (_) {}
    return success(res, {
      memory: {
        total_mb:     parseFloat((total / 1024 / 1024).toFixed(1)),
        used_mb:      parseFloat((used  / 1024 / 1024).toFixed(1)),
        free_mb:      parseFloat((free  / 1024 / 1024).toFixed(1)),
        usage_percent: parseFloat(((used / total) * 100).toFixed(1))
      },
      cpu_temp_celsius: cpuTemp,
      uptime_seconds: Math.floor(os.uptime()),
      platform: os.platform(),
      node_version: process.version,
    }, 'Salud del servidor');
  } catch (err) {
    return error(res, 'Error al obtener salud del servidor', 500);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getSystemStats, getServerHealth };
