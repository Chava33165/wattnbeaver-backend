// src/services/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/wattnbeaber.db');
  }

  /**
   * Inicializar conexión a la base de datos
   */
  initialize() {
    try {
      // Crear directorio data si no existe
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Conectar a la base de datos
      this.db = new Database(this.dbPath);
      
      // Configuraciones de optimización
      this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('temp_store = MEMORY');
      
      console.log('✅ Base de datos SQLite inicializada');
      console.log(`📁 Ubicación: ${this.dbPath}`);
      
      // Crear tablas si no existen
      this.createTables();
      
      return this.db;
    } catch (error) {
      console.error('❌ Error al inicializar base de datos:', error);
      throw error;
    }
  }

  /**
   * Crear todas las tablas
   */
  createTables() {
    console.log('📊 Creando estructura de tablas...');

    // ========================================
    // TABLA: users
    // ========================================
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        avatar TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ========================================
    // TABLA: households (hogares)
    // ========================================
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        owner_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );
    `);

    // ========================================
    // TABLA: household_members
    // ========================================
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS household_members (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (household_id) REFERENCES households(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(household_id, user_id)
      );
    `);

    // ========================================
    // TABLA: devices (dispositivos)
    // ========================================
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        household_id TEXT,
        device_id TEXT UNIQUE NOT NULL,
        device_name TEXT NOT NULL,
        device_type TEXT NOT NULL,
        location TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (household_id) REFERENCES households(id)
      );
    `);

    // ========================================
    // TABLA: energy_readings
    // ========================================
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS energy_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        power REAL DEFAULT 0,
        voltage REAL DEFAULT 0,
        current REAL DEFAULT 0,
        energy REAL DEFAULT 0,
        timestamp TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (device_id) REFERENCES devices(device_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // ========================================
    // TABLA: water_readings
    // ========================================
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS water_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        flow REAL DEFAULT 0,
        total REAL DEFAULT 0,
        timestamp TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (device_id) REFERENCES devices(device_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // ========================================
    // TABLA: alerts
    // ========================================
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_id TEXT,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        acknowledged INTEGER DEFAULT 0,
        acknowledged_at TEXT,
        resolved INTEGER DEFAULT 0,
        resolved_at TEXT,
        resolution TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
      );
    `);

    // ========================================
    // GAMIFICACIÓN
    // ========================================

    // TABLA: user_gamification
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_gamification (
        user_id TEXT PRIMARY KEY,
        total_points INTEGER DEFAULT 0,
        current_level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        last_activity_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // TABLA: achievements (logros)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT DEFAULT '#4CAF50',
        points INTEGER DEFAULT 0,
        category TEXT,
        requirement TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // TABLA: user_achievements
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (achievement_id) REFERENCES achievements(id),
        UNIQUE(user_id, achievement_id)
      );
    `);

    // TABLA: challenges (retos)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        target_value REAL NOT NULL,
        reward_points INTEGER DEFAULT 0,
        duration_days INTEGER DEFAULT 7,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // TABLA: user_challenges
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_challenges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        current_value REAL DEFAULT 0,
        target_value REAL NOT NULL,
        status TEXT DEFAULT 'active',
        start_date TEXT DEFAULT (datetime('now')),
        end_date TEXT,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (challenge_id) REFERENCES challenges(id)
      );
    `);

    // TABLA: notifications
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        icon TEXT,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // ========================================
    // ÍNDICES PARA OPTIMIZACIÓN
    // ========================================
    
    // Índices para energy_readings
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_energy_device_timestamp 
      ON energy_readings(device_id, timestamp);
    `);
    
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_energy_user_timestamp 
      ON energy_readings(user_id, timestamp);
    `);

    // Índices para water_readings
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_water_device_timestamp 
      ON water_readings(device_id, timestamp);
    `);
    
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_water_user_timestamp 
      ON water_readings(user_id, timestamp);
    `);

    // Índices para alerts
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_alerts_user 
      ON alerts(user_id, created_at);
    `);

    // Índices para devices
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_devices_user
      ON devices(user_id);
    `);

    // Índices para notifications
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user
      ON notifications(user_id, read, created_at);
    `);

    console.log('✅ Estructura de tablas creada');
  }

  /**
   * Insertar datos iniciales (seeds)
   */
  seedDatabase() {
    console.log('🌱 Verificando datos iniciales...');

    try {
      // Verificar si ya hay logros
      const achievementCount = this.db.prepare('SELECT COUNT(*) as count FROM achievements').get();
      
      if (achievementCount.count === 0) {
        console.log('📝 Insertando logros predefinidos...');
        
        // Insertar logros predefinidos
        const achievements = [
          {
            id: 'ach_first_week',
            name: 'Primera Semana',
            description: 'Completa tu primera semana usando WattBeaber',
            icon: '🏆',
            color: '#FFD700',
            points: 100,
            category: 'milestone',
            requirement: 'days_active:7'
          },
          {
            id: 'ach_save_10',
            name: 'Ahorrador Principiante',
            description: 'Reduce tu consumo 10% en una semana',
            icon: '💰',
            color: '#4CAF50',
            points: 150,
            category: 'saving',
            requirement: 'reduce_consumption:10'
          },
          {
            id: 'ach_save_20',
            name: 'Ahorrador Experto',
            description: 'Reduce tu consumo 20% en una semana',
            icon: '💎',
            color: '#2196F3',
            points: 300,
            category: 'saving',
            requirement: 'reduce_consumption:20'
          },
          {
            id: 'ach_streak_7',
            name: 'Racha de 7 días',
            description: 'Mantén tu consumo bajo objetivo por 7 días seguidos',
            icon: '🔥',
            color: '#FF5722',
            points: 200,
            category: 'streak',
            requirement: 'streak_days:7'
          },
          {
            id: 'ach_streak_30',
            name: 'Racha de 30 días',
            description: 'Mantén tu consumo bajo objetivo por 30 días seguidos',
            icon: '🔥🔥',
            color: '#9C27B0',
            points: 500,
            category: 'streak',
            requirement: 'streak_days:30'
          },
          {
            id: 'ach_no_leak',
            name: 'Sin Fugas',
            description: 'Pasa un mes sin fugas de agua',
            icon: '💧',
            color: '#00BCD4',
            points: 250,
            category: 'water',
            requirement: 'no_leaks:30'
          }
        ];

        const insertAchievement = this.db.prepare(`
          INSERT INTO achievements (id, name, description, icon, color, points, category, requirement)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = this.db.transaction((achievements) => {
          for (const ach of achievements) {
            insertAchievement.run(
              ach.id, ach.name, ach.description, ach.icon, ach.color,
              ach.points, ach.category, ach.requirement
            );
          }
        });

        insertMany(achievements);
        console.log(`   ✅ ${achievements.length} logros insertados`);
      } else {
        console.log(`   ℹ️  ${achievementCount.count} logros ya existen`);
      }

      // Verificar si ya hay retos
      const challengeCount = this.db.prepare('SELECT COUNT(*) as count FROM challenges').get();
      
      if (challengeCount.count === 0) {
        console.log('📝 Insertando retos predefinidos...');
        
        // Insertar retos predefinidos
        const challenges = [
          {
            id: 'chal_reduce_15',
            name: 'Reduce 15% esta semana',
            description: 'Reduce tu consumo energético 15% comparado con la semana pasada',
            type: 'energy_reduction',
            target_value: 15,
            reward_points: 200,
            duration_days: 7
          },
          {
            id: 'chal_water_save',
            name: 'Ahorra 100 litros',
            description: 'Reduce tu consumo de agua en 100 litros esta semana',
            type: 'water_reduction',
            target_value: 100,
            reward_points: 150,
            duration_days: 7
          }
        ];

        const insertChallenge = this.db.prepare(`
          INSERT INTO challenges (id, name, description, type, target_value, reward_points, duration_days)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const insertChallenges = this.db.transaction((challenges) => {
          for (const ch of challenges) {
            insertChallenge.run(
              ch.id, ch.name, ch.description, ch.type,
              ch.target_value, ch.reward_points, ch.duration_days
            );
          }
        });

        insertChallenges(challenges);
        console.log(`   ✅ ${challenges.length} retos insertados`);
      } else {
        console.log(`   ℹ️  ${challengeCount.count} retos ya existen`);
      }

      console.log('✅ Verificación de datos iniciales completada');

    } catch (error) {
      console.error('❌ Error al verificar/insertar datos iniciales:', error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Ejecutar query preparada
   */
  prepare(query) {
    return this.db.prepare(query);
  }

  /**
   * Ejecutar transacción
   */
  transaction(fn) {
    return this.db.transaction(fn);
  }

  /**
   * Cerrar conexión
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('✅ Base de datos cerrada');
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  getStats() {
    const stats = {};
    
    const tables = [
      'users', 'households', 'devices',
      'energy_readings', 'water_readings', 'alerts',
      'achievements', 'challenges', 'user_achievements', 'user_challenges',
      'notifications'
    ];

    tables.forEach(table => {
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      stats[table] = result.count;
    });

    // Tamaño del archivo
    const fileSizeBytes = fs.statSync(this.dbPath).size;
    stats.file_size = `${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`;
    stats.file_path = this.dbPath;

    return stats;
  }

  /**
   * Hacer backup de la base de datos
   */
  backup(backupPath) {
    if (!backupPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = path.join(__dirname, `../../data/backup_${timestamp}.db`);
    }

    this.db.backup(backupPath)
      .then(() => {
        console.log(`✅ Backup creado: ${backupPath}`);
      })
      .catch(err => {
        console.error('❌ Error al crear backup:', err);
      });
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;