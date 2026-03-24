#!/bin/bash

# Script para monitorear lecturas del sensor Sonoff POW en tiempo real
# Uso: ./monitor-energy.sh [user_id]

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Usuario por defecto (Salvador Antonio Pantoja Vera)
USER_ID="${1:-fc3459fb-acd4-4e6f-8760-ebc3041e3855}"
DB_PATH="/home/watt/wattnbeaber/backend/data/wattnbeaber.db"

# Verificar que la base de datos existe
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}Error: Base de datos no encontrada en $DB_PATH${NC}"
    exit 1
fi

echo -e "${BLUE}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║  Monitor de Energía en Tiempo Real - Sonoff POW               ║${NC}"
echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Usuario:${NC} $USER_ID"
echo -e "${YELLOW}Actualizando cada 3 segundos...${NC} (Presiona Ctrl+C para salir)"
echo ""

# Contador de iteraciones
ITERATION=0

while true; do
    ITERATION=$((ITERATION + 1))

    # Limpiar pantalla
    clear

    # Header
    echo -e "${BLUE}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}${BOLD}║  Monitor de Energía en Tiempo Real - Sonoff POW               ║${NC}"
    echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC} | Actualización #${ITERATION}"
    echo ""

    # Obtener dispositivos del usuario
    echo -e "${YELLOW}🔌 DISPOSITIVOS REGISTRADOS:${NC}"
    sqlite3 "$DB_PATH" <<EOF
.mode column
.headers on
.width 15 25 12
SELECT
    d.device_id as 'Device ID',
    d.device_name as 'Nombre',
    d.status as 'Estado'
FROM devices d
WHERE d.user_id = '$USER_ID'
  AND d.device_type = 'energy'
ORDER BY d.created_at DESC;
EOF
    echo ""

    # Obtener resumen
    SUMMARY=$(sqlite3 "$DB_PATH" <<EOF
SELECT
    datetime(MAX(e.timestamp), 'localtime') as ultima,
    COUNT(*) as total_hoy,
    ROUND(AVG(e.power), 2) as potencia_prom,
    ROUND(MAX(e.power), 2) as potencia_max,
    ROUND(AVG(e.voltage), 1) as voltaje_prom,
    COUNT(DISTINCT e.device_id) as num_dispositivos
FROM energy_readings e
WHERE e.user_id = '$USER_ID'
  AND date(e.timestamp) = date('now');
EOF
)

    if [ -n "$SUMMARY" ]; then
        ULTIMA=$(echo "$SUMMARY" | cut -d'|' -f1)
        TOTAL_HOY=$(echo "$SUMMARY" | cut -d'|' -f2)
        POT_PROM=$(echo "$SUMMARY" | cut -d'|' -f3)
        POT_MAX=$(echo "$SUMMARY" | cut -d'|' -f4)
        VOLT_PROM=$(echo "$SUMMARY" | cut -d'|' -f5)
        NUM_DISP=$(echo "$SUMMARY" | cut -d'|' -f6)

        echo -e "${YELLOW}📊 RESUMEN DEL DÍA:${NC}"
        echo -e "   Última lectura:   ${GREEN}$ULTIMA${NC}"
        echo -e "   Total lecturas:   ${GREEN}$TOTAL_HOY${NC}"
        echo -e "   Dispositivos:     ${GREEN}$NUM_DISP${NC}"
        echo -e "   Potencia prom:    ${GREEN}$POT_PROM W${NC}"
        echo -e "   Potencia máxima:  ${GREEN}$POT_MAX W${NC}"
        echo -e "   Voltaje prom:     ${GREEN}$VOLT_PROM V${NC}"
        echo ""
    fi

    # Obtener últimas 10 lecturas
    echo -e "${YELLOW}📋 ÚLTIMAS 10 LECTURAS:${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    sqlite3 "$DB_PATH" <<EOF
.mode column
.headers on
.width 15 19 10 10 10 10
SELECT
    e.device_id as 'Device',
    datetime(e.timestamp, 'localtime') as 'Momento',
    ROUND(e.power, 2) || ' W' as 'Potencia',
    ROUND(e.voltage, 1) || ' V' as 'Voltaje',
    ROUND(e.current, 3) || ' A' as 'Corriente',
    ROUND(e.energy, 3) || ' kWh' as 'Energía'
FROM energy_readings e
WHERE e.user_id = '$USER_ID'
ORDER BY e.timestamp DESC
LIMIT 10;
EOF

    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Verificar estado por dispositivo
    echo -e "${YELLOW}🔍 ESTADO DE SENSORES:${NC}"
    sqlite3 "$DB_PATH" <<EOF
SELECT
    d.device_id || ' (' || d.device_name || ')' as dispositivo,
    CASE
        WHEN MAX(e.timestamp) > datetime('now', '-30 seconds') THEN '✅ ACTIVO'
        WHEN MAX(e.timestamp) > datetime('now', '-5 minutes') THEN '⚠️  INACTIVO (< 5 min)'
        ELSE '🔴 SIN SEÑAL'
    END as estado,
    COUNT(*) as lecturas_30s,
    datetime(MAX(e.timestamp), 'localtime') as ultima_lectura
FROM devices d
LEFT JOIN energy_readings e ON d.device_id = e.device_id
    AND e.user_id = '$USER_ID'
    AND e.timestamp > datetime('now', '-30 seconds')
WHERE d.user_id = '$USER_ID'
  AND d.device_type = 'energy'
GROUP BY d.device_id, d.device_name
ORDER BY ultima_lectura DESC;
EOF
    echo ""

    # Verificar si hay lecturas recientes (últimos 30 segundos)
    RECENT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM energy_readings WHERE user_id = '$USER_ID' AND timestamp > datetime('now', '-30 seconds');")

    if [ "$RECENT" -gt 0 ]; then
        echo -e "${GREEN}✅ Sistema ACTIVO${NC} - Recibiendo datos ($RECENT lecturas en últimos 30s)"
    else
        echo -e "${RED}⚠️  Sistema INACTIVO${NC} - Sin lecturas en los últimos 30 segundos"
    fi

    echo ""
    echo -e "${YELLOW}Próxima actualización en 3 segundos...${NC} (Ctrl+C para salir)"

    sleep 3
done
