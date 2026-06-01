#!/usr/bin/env node
/**
 * monitor-sensores.js — Monitor en tiempo real de sensores de agua y energía
 * Uso: node scripts/monitor-sensores.js [--tipo agua|luz|ambos] [--device ID] [--intervalo ms]
 */

const Database = require('../backend/node_modules/better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../backend/data/wattnbeaber.db');

// ─── Args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag, def) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : def; };

const tipo      = get('--tipo', 'ambos');
const device    = get('--device', null);
const intervalo = parseInt(get('--intervalo', '2000'), 10);

// ─── Colores ─────────────────────────────────────────────────────────────────
const R   = '\x1b[0m';
const B   = '\x1b[1m';
const DIM = '\x1b[2m';
const C   = { // color por tipo
  agua   : '\x1b[36m',   // cyan
  energy : '\x1b[33m',   // amarillo
  verde  : '\x1b[32m',
  rojo   : '\x1b[31m',
  gris   : '\x1b[90m',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleTimeString('es-MX', { hour12: false });
const pad  = (s, n) => String(s ?? '—').padEnd(n);
const padL = (s, n) => String(s ?? '—').padStart(n);
const fmt  = (v, dec = 2) => v === null || v === undefined ? '—' : Number(v).toFixed(dec);
const line = (n = 80) => '─'.repeat(n);
const clr  = () => process.stdout.write('\x1b[2J\x1b[H'); // limpiar pantalla

let db;
try {
  db = new Database(DB_PATH, { readonly: true });
} catch (e) {
  console.error(`No se pudo abrir la base de datos: ${DB_PATH}\n${e.message}`);
  process.exit(1);
}

// ─── Estado ──────────────────────────────────────────────────────────────────
let lastWater  = db.prepare('SELECT MAX(id) as m FROM water_readings').get().m  || 0;
let lastEnergy = db.prepare('SELECT MAX(id) as m FROM energy_readings').get().m || 0;

// Buffer de eventos para mostrar en pantalla (max 30 líneas)
const MAX_EVENTOS = 28;
const eventos = [];

// Contadores de sesión
const stats = {
  agua:    { total: 0, dispositivos: {} },
  energia: { total: 0, dispositivos: {} },
};

// Último valor por dispositivo (para mostrar columna de estado)
const ultimoValor = {};

// ─── Queries ─────────────────────────────────────────────────────────────────
const queryAgua = db.prepare(`
  SELECT w.id, w.device_id, w.flow, w.total, w.timestamp,
         d.device_name, d.location
  FROM water_readings w
  LEFT JOIN devices d ON d.device_id = w.device_id
  WHERE w.id > ?
  ${device ? 'AND w.device_id = ?' : ''}
  ORDER BY w.id ASC
`);

const queryEnergia = db.prepare(`
  SELECT e.id, e.device_id, e.power, e.voltage, e.current, e.energy, e.timestamp,
         d.device_name, d.location
  FROM energy_readings e
  LEFT JOIN devices d ON d.device_id = e.device_id
  WHERE e.id > ?
  ${device ? 'AND e.device_id = ?' : ''}
  ORDER BY e.id ASC
`);

// ─── Renderizado ─────────────────────────────────────────────────────────────
function renderHeader() {
  const totalAgua   = db.prepare('SELECT COUNT(*) as n FROM water_readings').get().n;
  const totalEnergy = db.prepare('SELECT COUNT(*) as n FROM energy_readings').get().n;

  console.log(B + C.verde + '╔══════════════════════════════════════════════════════════════════════════════╗' + R);
  console.log(B + C.verde + '║' + R + B + '          WATTNBEABER — MONITOR EN TIEMPO REAL DE SENSORES                  ' + B + C.verde + '║' + R);
  console.log(B + C.verde + '╚══════════════════════════════════════════════════════════════════════════════╝' + R);
  console.log(
    `  ${DIM}Intervalo: ${intervalo}ms${R}  ` +
    `${C.agua}Agua total: ${B}${totalAgua.toLocaleString()}${R}  ` +
    `${C.energy}Energía total: ${B}${totalEnergy.toLocaleString()}${R}  ` +
    `${DIM}Hora: ${now()}${R}` +
    (device ? `  ${B}Filtro: ${device}${R}` : '')
  );
  console.log(DIM + '  Sesión — ' +
    `agua: ${B}${stats.agua.total}${R}${DIM} registros  ` +
    `energía: ${B}${stats.energia.total}${R}${DIM} registros` + R
  );
  console.log(DIM + line() + R);
}

function renderEstado() {
  const devs = Object.entries(ultimoValor);
  if (!devs.length) return;

  console.log(B + '  DISPOSITIVOS ACTIVOS' + R);
  console.log(DIM + '  ' + pad('DEVICE', 16) + pad('NOMBRE', 18) + pad('TIPO', 8) + pad('ÚLTIMO VALOR', 26) + 'HACE' + R);

  const ahora = Date.now();
  for (const [devId, info] of devs.slice(0, 8)) {
    const hace = Math.round((ahora - info.ts) / 1000);
    const tipoColor = info.tipo === 'agua' ? C.agua : C.energy;
    const frescura = hace < 10 ? C.verde : hace < 60 ? C.energy : C.rojo;
    const valor = info.tipo === 'agua'
      ? `flujo:${fmt(info.flow,2)} L/m  total:${fmt(info.total,2)} L`
      : `${fmt(info.power,1)}W  ${fmt(info.voltage,1)}V  ${fmt(info.current,3)}A`;

    process.stdout.write(
      `  ${tipoColor}${pad(devId, 16)}${R}` +
      `${pad(info.nombre, 18)}` +
      `${tipoColor}${pad(info.tipo, 8)}${R}` +
      `${pad(valor, 26)}` +
      `${frescura}${hace}s${R}\n`
    );
  }
  console.log(DIM + line() + R);
}

function renderEventos() {
  console.log(B + '  REGISTROS EN VIVO' + R);

  if (!eventos.length) {
    console.log(DIM + '  Esperando datos...' + R);
    return;
  }

  // Cabecera dinámica
  const mostrarAgua    = tipo === 'ambos' || tipo === 'agua';
  const mostrarEnergia = tipo === 'ambos' || tipo === 'luz';

  if (mostrarAgua && mostrarEnergia) {
    console.log(DIM +
      '  ' + padL('ID', 8) + '  ' + pad('HORA', 10) + pad('DEVICE', 16) + pad('NOMBRE', 16) +
      pad('TIPO', 8) + pad('VALOR PRINCIPAL', 20) + 'EXTRA' + R
    );
  } else if (mostrarAgua) {
    console.log(DIM +
      '  ' + padL('ID', 8) + '  ' + pad('HORA', 10) + pad('DEVICE', 16) + pad('NOMBRE', 16) +
      padL('FLUJO(L/m)', 12) + padL('TOTAL(L)', 10) + '  TIMESTAMP' + R
    );
  } else {
    console.log(DIM +
      '  ' + padL('ID', 8) + '  ' + pad('HORA', 10) + pad('DEVICE', 16) + pad('NOMBRE', 16) +
      padL('POT(W)', 9) + padL('VOLT(V)', 9) + padL('CORR(A)', 9) + '  TIMESTAMP' + R
    );
  }

  for (const e of eventos) {
    const tipoColor = e.tipo === 'agua' ? C.agua : C.energy;
    let linea = `  ${DIM}${padL(e.id, 8)}${R}  ${DIM}${pad(e.hora, 10)}${R}` +
                `${tipoColor}${pad(e.device_id, 16)}${R}` +
                `${pad(e.nombre, 16)}`;

    if (mostrarAgua && mostrarEnergia) {
      if (e.tipo === 'agua') {
        linea += `${tipoColor}${pad('agua', 8)}${R}${pad('flujo: ' + fmt(e.flow, 2) + ' L/m', 20)}total: ${fmt(e.total, 3)} L`;
      } else {
        linea += `${tipoColor}${pad('energía', 8)}${R}${pad(fmt(e.power, 1) + ' W', 20)}${fmt(e.voltage, 1)}V  ${fmt(e.current, 3)}A`;
      }
    } else if (mostrarAgua) {
      linea += `${tipoColor}${padL(fmt(e.flow, 3), 12)}${R}${padL(fmt(e.total, 3), 10)}  ${DIM}${e.timestamp}${R}`;
    } else {
      linea += `${tipoColor}${padL(fmt(e.power, 1), 9)}${R}${padL(fmt(e.voltage, 1), 9)}${padL(fmt(e.current, 3), 9)}  ${DIM}${e.timestamp}${R}`;
    }

    console.log(linea);
  }
}

function render() {
  clr();
  renderHeader();
  renderEstado();
  renderEventos();
  console.log(DIM + '\n  Ctrl+C para salir' + R);
}

// ─── Poll ─────────────────────────────────────────────────────────────────────
function poll() {
  let huboCambios = false;

  // Agua
  if (tipo === 'ambos' || tipo === 'agua') {
    const filas = device
      ? queryAgua.all(lastWater, device)
      : queryAgua.all(lastWater);

    for (const r of filas) {
      lastWater = r.id;
      stats.agua.total++;
      stats.agua.dispositivos[r.device_id] = (stats.agua.dispositivos[r.device_id] || 0) + 1;

      ultimoValor[r.device_id] = {
        tipo: 'agua', ts: Date.now(),
        nombre: r.device_name || r.device_id,
        flow: r.flow, total: r.total,
      };

      const hora = r.timestamp
        ? new Date(r.timestamp).toLocaleTimeString('es-MX', { hour12: false })
        : now();

      eventos.push({ ...r, tipo: 'agua', hora, nombre: r.device_name || r.device_id });
      huboCambios = true;
    }
  }

  // Energía
  if (tipo === 'ambos' || tipo === 'luz') {
    const filas = device
      ? queryEnergia.all(lastEnergy, device)
      : queryEnergia.all(lastEnergy);

    for (const r of filas) {
      lastEnergy = r.id;
      stats.energia.total++;
      stats.energia.dispositivos[r.device_id] = (stats.energia.dispositivos[r.device_id] || 0) + 1;

      ultimoValor[r.device_id] = {
        tipo: 'energia', ts: Date.now(),
        nombre: r.device_name || r.device_id,
        power: r.power, voltage: r.voltage, current: r.current,
      };

      const hora = r.timestamp
        ? new Date(r.timestamp).toLocaleTimeString('es-MX', { hour12: false })
        : now();

      eventos.push({ ...r, tipo: 'energia', hora, nombre: r.device_name || r.device_id });
      huboCambios = true;
    }
  }

  // Mantener solo los últimos MAX_EVENTOS
  if (eventos.length > MAX_EVENTOS) eventos.splice(0, eventos.length - MAX_EVENTOS);

  // Re-renderizar siempre (actualiza el contador de hace N seg)
  render();
}

// ─── Inicio ───────────────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  clr();
  console.log(B + '\n  Sesión terminada' + R);
  console.log(`  Agua recibida:    ${B}${stats.agua.total}${R} registros`);
  console.log(`  Energía recibida: ${B}${stats.energia.total}${R} registros`);
  console.log();
  db.close();
  process.exit(0);
});

poll();
setInterval(poll, intervalo);
