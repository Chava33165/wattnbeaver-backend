// scripts/migrate-add-apikey.js
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/wattnbeaber.db');

console.log('🔄 Iniciando migración: Agregar columna api_key a tabla devices');

try {
  const db = new Database(DB_PATH);

  // Verificar si la columna ya existe
  const tableInfo = db.prepare("PRAGMA table_info(devices)").all();
  const hasApiKey = tableInfo.some(col => col.name === 'api_key');

  if (hasApiKey) {
    console.log('⚠️  La columna api_key ya existe. Migración no necesaria.');
    db.close();
    process.exit(0);
  }

  // Agregar columna api_key (SQLite no permite UNIQUE en ALTER TABLE)
  console.log('📝 Agregando columna api_key a tabla devices...');
  db.prepare('ALTER TABLE devices ADD COLUMN api_key TEXT').run();

  // Generar api_key para dispositivos existentes
  console.log('🔑 Generando API keys para dispositivos existentes...');
  const devices = db.prepare('SELECT id FROM devices WHERE api_key IS NULL').all();

  const updateStmt = db.prepare('UPDATE devices SET api_key = ? WHERE id = ?');

  let count = 0;
  for (const device of devices) {
    const apiKey = uuidv4();
    updateStmt.run(apiKey, device.id);
    count++;
  }

  console.log(`✅ API keys generadas para ${count} dispositivos`);

  // Crear índice único para api_key
  console.log('📋 Creando índice único para api_key...');
  try {
    db.prepare('CREATE UNIQUE INDEX idx_devices_api_key ON devices(api_key)').run();
    console.log('✅ Índice único creado');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Índice único ya existe');
    } else {
      throw error;
    }
  }

  // Verificar la migración
  const verification = db.prepare("PRAGMA table_info(devices)").all();
  const apiKeyCol = verification.find(col => col.name === 'api_key');

  if (apiKeyCol) {
    console.log('✅ Migración completada exitosamente');
    console.log(`   - Columna: ${apiKeyCol.name}`);
    console.log(`   - Tipo: ${apiKeyCol.type}`);
    console.log(`   - Índice único: Sí`);
  } else {
    console.error('❌ Error: La columna api_key no se creó correctamente');
    process.exit(1);
  }

  db.close();
  console.log('🎉 Migración finalizada con éxito');

} catch (error) {
  console.error('❌ Error durante la migración:', error.message);
  process.exit(1);
}
