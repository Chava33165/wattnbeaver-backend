const os = require('os');
const fs = require('fs');
const User = require('../../models/User');
const GamificationProcessor = require('../../processors/gamification/GamificationProcessor');
const db = require('../../services/database');
const { success, error } = require('../../utils/response');
const { execSync } = require('child_process');

const getAllUsers = async (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
        COALESCE(g.total_points, 0) AS total_points,
        COALESCE(g.current_level, 1) AS current_level,
        COALESCE(g.current_streak, 0) AS current_streak,
        g.last_activity_date,
        CAST(
          julianday('now', 'localtime') -
          julianday(COALESCE(g.last_activity_date, u.created_at))
        AS INTEGER) AS days_inactive
      FROM users u
      LEFT JOIN user_gamification g ON g.user_id = u.id
      ORDER BY days_inactive DESC
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
        COALESCE(g.current_streak, 0) AS current_streak,
        g.last_activity_date,
        CAST(
          julianday('now', 'localtime') -
          julianday(COALESCE(g.last_activity_date, u.created_at))
        AS INTEGER) AS days_inactive
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

const createAdminUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return error(res, 'Nombre, email y contraseña son requeridos', 400);
    const newUser = await User.create({ name, email, password, role: 'admin' });
    return success(res, { user: newUser.toJSON() }, 'Usuario admin creado exitosamente', 201);
  } catch (err) {
    if (err.message.includes('ya está registrado'))
      return error(res, err.message, 409);
    return error(res, err.message || 'Error al crear usuario admin', 400);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return error(res, 'No puedes eliminarte a ti mismo', 403);
    const user = await User.findById(id);
    if (!user) return error(res, 'Usuario no encontrado', 404);

    const activity = db.prepare(`
      SELECT CAST(
        julianday('now', 'localtime') -
        julianday(COALESCE(g.last_activity_date, u.created_at))
      AS INTEGER) AS days_inactive
      FROM users u
      LEFT JOIN user_gamification g ON g.user_id = u.id
      WHERE u.id = ?
    `).get(id);

    if (activity.days_inactive < 5)
      return error(res, `No se puede eliminar: el usuario lleva ${activity.days_inactive} día(s) de inactividad. Se requieren mínimo 5.`, 403);

    // Cascade delete en transacción (FK constraints activas)
    db.prepare('BEGIN').run();
    try {
      db.prepare(`DELETE FROM notifications     WHERE user_id = ?`).run(id);
      db.prepare(`DELETE FROM user_challenges   WHERE user_id = ?`).run(id);
      db.prepare(`DELETE FROM user_achievements WHERE user_id = ?`).run(id);
      db.prepare(`DELETE FROM user_gamification WHERE user_id = ?`).run(id);
      db.prepare(`DELETE FROM alerts            WHERE user_id = ?`).run(id);
      db.prepare(`DELETE FROM water_readings    WHERE user_id = ?`).run(id);
      db.prepare(`DELETE FROM energy_readings   WHERE user_id = ?`).run(id);
      db.prepare(`DELETE FROM household_members WHERE user_id = ?`).run(id);
      // Eliminar hogares donde el usuario era dueño (y sus miembros restantes)
      const ownedHouseholds = db.prepare(`SELECT id FROM households WHERE owner_id = ?`).all(id);
      for (const h of ownedHouseholds) {
        db.prepare(`DELETE FROM household_members WHERE household_id = ?`).run(h.id);
        db.prepare(`DELETE FROM devices           WHERE household_id = ?`).run(h.id);
        db.prepare(`DELETE FROM households        WHERE id = ?`).run(h.id);
      }
      db.prepare(`DELETE FROM devices WHERE user_id = ?`).run(id);
      db.prepare(`DELETE FROM users   WHERE id = ?`).run(id);
      db.prepare('COMMIT').run();
    } catch (txErr) {
      db.prepare('ROLLBACK').run();
      throw txErr;
    }

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
    const totalMem = os.totalmem(), freeMem = os.freemem(), usedMem = totalMem - freeMem;

    // Temperatura CPU (Raspberry Pi thermal zone o vcgencmd)
    let cpuTemp = null;
    try {
      cpuTemp = parseFloat((parseInt(fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8').trim()) / 1000).toFixed(1));
    } catch (_) {
      try {
        const vcg = execSync('vcgencmd measure_temp 2>/dev/null', { timeout: 2000 }).toString();
        const match = vcg.match(/temp=([\d.]+)/);
        if (match) cpuTemp = parseFloat(match[1]);
      } catch (_) {}
    }

    // Disco — sistema de archivos principal y /boot si existe
    const diskInfo = {};
    for (const mountpoint of ['/', '/boot/firmware', '/boot']) {
      try {
        const s = fs.statfsSync(mountpoint);
        const totalBytes = s.blocks * s.bsize;
        const freeBytes  = s.bfree  * s.bsize;
        const usedBytes  = totalBytes - freeBytes;
        diskInfo[mountpoint] = {
          total_gb:      parseFloat((totalBytes / 1024 ** 3).toFixed(1)),
          used_gb:       parseFloat((usedBytes  / 1024 ** 3).toFixed(1)),
          free_gb:       parseFloat((freeBytes  / 1024 ** 3).toFixed(1)),
          usage_percent: parseFloat(((usedBytes / totalBytes) * 100).toFixed(1)),
        };
      } catch (_) {}
    }

    // CPU — uso promedio del último minuto
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;

    return success(res, {
      memory: {
        total_mb:      parseFloat((totalMem / 1024 ** 2).toFixed(1)),
        used_mb:       parseFloat((usedMem  / 1024 ** 2).toFixed(1)),
        free_mb:       parseFloat((freeMem  / 1024 ** 2).toFixed(1)),
        usage_percent: parseFloat(((usedMem / totalMem) * 100).toFixed(1)),
      },
      cpu: {
        temp_celsius:    cpuTemp,
        cores:           cpuCount,
        model:           os.cpus()[0]?.model || null,
        load_avg_1m:     parseFloat((loadAvg[0]).toFixed(2)),
        load_avg_5m:     parseFloat((loadAvg[1]).toFixed(2)),
        load_avg_15m:    parseFloat((loadAvg[2]).toFixed(2)),
        load_percent_1m: parseFloat(((loadAvg[0] / cpuCount) * 100).toFixed(1)),
      },
      disk: diskInfo,
      uptime_seconds: Math.floor(os.uptime()),
      platform:    os.platform(),
      arch:        os.arch(),
      node_version: process.version,
    }, 'Salud del servidor');
  } catch (err) {
    return error(res, 'Error al obtener salud del servidor', 500);
  }
};

module.exports = { getAllUsers, getUserById, createAdminUser, updateUser, deleteUser, getSystemStats, getServerHealth };
