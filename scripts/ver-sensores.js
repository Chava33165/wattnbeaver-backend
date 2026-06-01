#!/usr/bin/env node
/**
 * ver-sensores.js — Visor de registros de sensores de agua y luz (energía)
 * Uso: node scripts/ver-sensores.js [opciones]
 *
 * Opciones:
 *   --tipo agua|luz|ambos   Tipo de sensor (default: ambos)
 *   --limite N              Número de registros a mostrar por sensor (default: 10)
 *   --device DEVICE_ID      Filtrar por device_id específico
 *   --desde FECHA           Desde fecha (ej: 2026-05-31 o 2026-05-31T00:00:00Z)
 *   --resumen               Solo mostrar resumen estadístico
 */

const Database = require('../backend/node_modules/better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../backend/data/wattnbeaber.db');

// ─── Parse args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};
const has = (flag) => args.includes(flag);

const tipo   = get('--tipo', 'ambos');    // agua | luz | ambos
const limite = parseInt(get('--limite', '10'), 10);
const device = get('--device', null);
const desde  = get('--desde', null);
const soloResumen = has('--resumen');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const CYAN   = '\x1b[36m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const DIM    = '\x1b[2m';

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const line = (c = '─', n = 80) => c.repeat(n);

function fmt(val, unit = '', dec = 2) {
  if (val === null || val === undefined) return `${DIM}—${RESET}`;
  return `${Number(val).toFixed(dec)} ${unit}`.trim();
}

function header(title, color = CYAN) {
  console.log('\n' + color + BOLD + line() + RESET);
  console.log(color + BOLD + `  ${title}` + RESET);
  console.log(color + BOLD + line() + RESET);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let db;
try {
  db = new Database(DB_PATH, { readonly: true });
} catch (e) {
  console.error(`\nNo se pudo abrir la base de datos en:\n  ${DB_PATH}\n${e.message}`);
  process.exit(1);
}

// ── Dispositivos registrados ──────────────────────────────────────────────────
function mostrarDispositivos() {
  const devs = db.prepare(`
    SELECT d.device_id, d.device_name, d.device_type, d.location, d.status,
           u.name AS username
    FROM devices d
    LEFT JOIN users u ON u.id = d.user_id
    ORDER BY d.device_type, d.device_name
  `).all();

  header('DISPOSITIVOS REGISTRADOS');
  console.log(
    BOLD +
    pad('DEVICE_ID', 16) + pad('NOMBRE', 24) + pad('TIPO', 10) +
    pad('UBICACIÓN', 16) + pad('ESTADO', 10) + 'USUARIO' +
    RESET
  );
  console.log(line('─'));

  for (const d of devs) {
    const tipoColor = d.device_type === 'water' ? BLUE : YELLOW;
    const statusColor = d.status === 'active' ? GREEN : DIM;
    console.log(
      tipoColor + pad(d.device_id, 16) + RESET +
      pad(d.device_name || '—', 24) +
      tipoColor + pad(d.device_type, 10) + RESET +
      pad(d.location || '—', 16) +
      statusColor + pad(d.status, 10) + RESET +
      (d.username || '—')
    );
  }
}

// ── Resumen estadístico ───────────────────────────────────────────────────────
function mostrarResumenAgua() {
  header('RESUMEN — SENSORES DE AGUA', BLUE);

  const stats = db.prepare(`
    SELECT
      device_id,
      COUNT(*)                            AS registros,
      ROUND(AVG(flow), 3)                 AS flujo_prom_L_min,
      ROUND(MAX(flow), 3)                 AS flujo_max_L_min,
      ROUND(MAX(total) - MIN(total), 3)   AS consumo_periodo_L,
      MAX(total)                          AS total_acum_L,
      MIN(timestamp)                      AS primer_reg,
      MAX(timestamp)                      AS ultimo_reg
    FROM water_readings
    ${device ? 'WHERE device_id = ?' : ''}
    ${desde   ? (device ? 'AND' : 'WHERE') + ' timestamp >= ?' : ''}
    GROUP BY device_id
    ORDER BY ultimo_reg DESC
  `).all(...[device, desde].filter(Boolean));

  console.log(
    BOLD +
    pad('DEVICE_ID', 16) + padL('REGISTROS', 10) +
    padL('FL.PROM(L/m)', 13) + padL('FL.MAX(L/m)', 12) +
    padL('CONSUMO(L)', 11) + padL('TOTAL(L)', 10) +
    '  ÚLTIMO REGISTRO' +
    RESET
  );
  console.log(line('─'));

  for (const s of stats) {
    console.log(
      BLUE + pad(s.device_id, 16) + RESET +
      padL(s.registros, 10) + '  ' +
      padL(fmt(s.flujo_prom_L_min), 11) + '  ' +
      padL(fmt(s.flujo_max_L_min), 10) + '  ' +
      padL(fmt(s.consumo_periodo_L), 9) + '  ' +
      padL(fmt(s.total_acum_L), 8) + '  ' +
      s.ultimo_reg
    );
  }
}

function mostrarResumenLuz() {
  header('RESUMEN — SENSORES DE LUZ / ENERGÍA', YELLOW);

  const stats = db.prepare(`
    SELECT
      device_id,
      COUNT(*)                  AS registros,
      ROUND(AVG(power), 2)      AS potencia_prom_W,
      ROUND(MAX(power), 2)      AS potencia_max_W,
      ROUND(AVG(voltage), 2)    AS voltaje_prom_V,
      ROUND(AVG(current), 3)    AS corriente_prom_A,
      ROUND(MAX(energy), 4)     AS energia_max_kWh,
      MIN(timestamp)            AS primer_reg,
      MAX(timestamp)            AS ultimo_reg
    FROM energy_readings
    ${device ? 'WHERE device_id = ?' : ''}
    ${desde   ? (device ? 'AND' : 'WHERE') + ' timestamp >= ?' : ''}
    GROUP BY device_id
    ORDER BY ultimo_reg DESC
  `).all(...[device, desde].filter(Boolean));

  console.log(
    BOLD +
    pad('DEVICE_ID', 16) + padL('REGISTROS', 10) +
    padL('POT.PROM(W)', 12) + padL('POT.MAX(W)', 11) +
    padL('VOLT(V)', 9) + padL('CORR(A)', 9) +
    padL('ENER.kWh', 10) + '  ÚLTIMO REGISTRO' +
    RESET
  );
  console.log(line('─'));

  for (const s of stats) {
    console.log(
      YELLOW + pad(s.device_id, 16) + RESET +
      padL(s.registros, 10) + '  ' +
      padL(fmt(s.potencia_prom_W), 10) + '  ' +
      padL(fmt(s.potencia_max_W), 10) + '  ' +
      padL(fmt(s.voltaje_prom_V), 7) + '  ' +
      padL(fmt(s.corriente_prom_A, '', 3), 7) + '  ' +
      padL(fmt(s.energia_max_kWh, '', 4), 8) + '  ' +
      s.ultimo_reg
    );
  }
}

// ── Registros recientes ───────────────────────────────────────────────────────
function mostrarRegistrosAgua() {
  header(`ÚLTIMOS ${limite} REGISTROS — AGUA`, BLUE);

  const rows = db.prepare(`
    SELECT
      w.id, w.device_id,
      d.device_name, d.location,
      w.flow, w.total, w.timestamp,
      u.name AS username
    FROM water_readings w
    LEFT JOIN devices d ON d.device_id = w.device_id
    LEFT JOIN users u ON u.id = w.user_id
    ${device ? 'WHERE w.device_id = ?' : ''}
    ${desde   ? (device ? 'AND' : 'WHERE') + ' w.timestamp >= ?' : ''}
    ORDER BY w.timestamp DESC
    LIMIT ?
  `).all(...[device, desde].filter(Boolean), limite);

  if (!rows.length) {
    console.log(DIM + '  Sin registros.' + RESET);
    return;
  }

  console.log(
    BOLD +
    padL('ID', 8) + '  ' + pad('DEVICE_ID', 16) + pad('NOMBRE', 20) +
    padL('FLUJO(L/m)', 12) + padL('TOTAL(L)', 10) +
    '  TIMESTAMP' +
    RESET
  );
  console.log(line('─'));

  for (const r of rows) {
    console.log(
      BLUE + padL(r.id, 8) + RESET + '  ' +
      pad(r.device_id, 16) +
      pad(r.device_name || '—', 20) +
      padL(fmt(r.flow, '', 3), 12) +
      padL(fmt(r.total, '', 3), 10) + '  ' +
      r.timestamp
    );
  }
}

function mostrarRegistrosLuz() {
  header(`ÚLTIMOS ${limite} REGISTROS — LUZ / ENERGÍA`, YELLOW);

  const rows = db.prepare(`
    SELECT
      e.id, e.device_id,
      d.device_name, d.location,
      e.power, e.voltage, e.current, e.energy,
      e.timestamp,
      u.name AS username
    FROM energy_readings e
    LEFT JOIN devices d ON d.device_id = e.device_id
    LEFT JOIN users u ON u.id = e.user_id
    ${device ? 'WHERE e.device_id = ?' : ''}
    ${desde   ? (device ? 'AND' : 'WHERE') + ' e.timestamp >= ?' : ''}
    ORDER BY e.timestamp DESC
    LIMIT ?
  `).all(...[device, desde].filter(Boolean), limite);

  if (!rows.length) {
    console.log(DIM + '  Sin registros.' + RESET);
    return;
  }

  console.log(
    BOLD +
    padL('ID', 8) + '  ' + pad('DEVICE_ID', 16) + pad('NOMBRE', 20) +
    padL('POT(W)', 8) + padL('VOLT(V)', 9) + padL('CORR(A)', 9) + padL('kWh', 8) +
    '  TIMESTAMP' +
    RESET
  );
  console.log(line('─'));

  for (const r of rows) {
    console.log(
      YELLOW + padL(r.id, 8) + RESET + '  ' +
      pad(r.device_id, 16) +
      pad(r.device_name || '—', 20) +
      padL(fmt(r.power), 8) +
      padL(fmt(r.voltage), 9) +
      padL(fmt(r.current, '', 3), 9) +
      padL(fmt(r.energy, '', 4), 8) + '  ' +
      r.timestamp
    );
  }
}

// ── Conteos generales ─────────────────────────────────────────────────────────
function mostrarConteos() {
  const totalAgua  = db.prepare('SELECT COUNT(*) as n FROM water_readings').get().n;
  const totalLuz   = db.prepare('SELECT COUNT(*) as n FROM energy_readings').get().n;
  const totalDevs  = db.prepare('SELECT COUNT(*) as n FROM devices').get().n;
  const ultimaAgua = db.prepare('SELECT MAX(timestamp) as t FROM water_readings').get().t;
  const ultimaLuz  = db.prepare('SELECT MAX(timestamp) as t FROM energy_readings').get().t;

  header('ESTADO GENERAL DE LA BASE DE DATOS', GREEN);
  console.log(`  ${GREEN}Dispositivos registrados:${RESET}  ${BOLD}${totalDevs}${RESET}`);
  console.log(`  ${BLUE}Registros de agua:${RESET}         ${BOLD}${totalAgua.toLocaleString()}${RESET}  (último: ${ultimaAgua || '—'})`);
  console.log(`  ${YELLOW}Registros de energía:${RESET}      ${BOLD}${totalLuz.toLocaleString()}${RESET}  (último: ${ultimaLuz || '—'})`);
}

// ─── Ejecutar ─────────────────────────────────────────────────────────────────
console.log(BOLD + CYAN + '\n══════════════════════════════════════════════════════════════════════════════' + RESET);
console.log(BOLD + CYAN + '  WATTNBEABER — VISOR DE SENSORES' + RESET);
console.log(BOLD + CYAN + '══════════════════════════════════════════════════════════════════════════════' + RESET);
console.log(`  DB: ${DIM}${DB_PATH}${RESET}`);
if (device) console.log(`  Filtro device: ${CYAN}${device}${RESET}`);
if (desde)  console.log(`  Desde: ${CYAN}${desde}${RESET}`);

mostrarConteos();
mostrarDispositivos();

const mostrarAgua  = tipo === 'ambos' || tipo === 'agua';
const mostrarEnergia = tipo === 'ambos' || tipo === 'luz';

if (mostrarAgua) {
  mostrarResumenAgua();
  if (!soloResumen) mostrarRegistrosAgua();
}

if (mostrarEnergia) {
  mostrarResumenLuz();
  if (!soloResumen) mostrarRegistrosLuz();
}

console.log('\n' + DIM + line() + RESET + '\n');
db.close();
