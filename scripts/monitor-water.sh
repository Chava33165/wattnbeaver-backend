#!/bin/bash

# Script para monitorear lecturas del sensor YF-201 en tiempo real
# Uso: ./monitor-water.sh [user_id]

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
echo -e "${BLUE}${BOLD}║  Monitor de Agua en Tiempo Real - YF-201                      ║${NC}"
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
    echo -e "${BLUE}${BOLD}║  Monitor de Agua en Tiempo Real - YF-201                      ║${NC}"
    echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC} | Actualización #${ITERATION}"
    echo ""

    # Obtener resumen
    SUMMARY=$(sqlite3 "$DB_PATH" <<EOF
SELECT
    datetime(MAX(timestamp), 'localtime') as ultima,
    COUNT(*) as total_hoy,
    ROUND(AVG(flow), 2) as flujo_prom
FROM water_readings
WHERE user_id = '$USER_ID'
  AND date(timestamp) = date('now');
EOF
)

    if [ -n "$SUMMARY" ]; then
        ULTIMA=$(echo "$SUMMARY" | cut -d'|' -f1)
        TOTAL_HOY=$(echo "$SUMMARY" | cut -d'|' -f2)
        FLUJO_PROM=$(echo "$SUMMARY" | cut -d'|' -f3)

        echo -e "${YELLOW}📊 RESUMEN:${NC}"
        echo -e "   Última lectura:  ${GREEN}$ULTIMA${NC}"
        echo -e "   Total hoy:       ${GREEN}$TOTAL_HOY${NC} lecturas"
        echo -e "   Flujo promedio:  ${GREEN}$FLUJO_PROM${NC} L/min"
        echo ""
    fi

    # Obtener últimas 10 lecturas
    echo -e "${YELLOW}📋 ÚLTIMAS 10 LECTURAS:${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    sqlite3 "$DB_PATH" <<EOF
.mode column
.headers on
.width 19 12 12
SELECT
    datetime(timestamp, 'localtime') as 'Momento',
    ROUND(flow, 3) || ' L/min' as 'Flujo',
    ROUND(total, 3) || ' L' as 'Total Acumulado'
FROM water_readings
WHERE user_id = '$USER_ID'
ORDER BY timestamp DESC
LIMIT 10;
EOF

    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Verificar si hay lecturas recientes (últimos 30 segundos)
    RECENT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM water_readings WHERE user_id = '$USER_ID' AND timestamp > datetime('now', '-30 seconds');")

    if [ "$RECENT" -gt 0 ]; then
        echo -e "${GREEN}✅ Sensor ACTIVO${NC} - Recibiendo datos ($RECENT lecturas en últimos 30s)"
    else
        echo -e "${RED}⚠️  Sin datos recientes${NC} - Última lectura hace más de 30 segundos"
    fi

    echo ""
    echo -e "${YELLOW}Próxima actualización en 3 segundos...${NC} (Ctrl+C para salir)"

    sleep 3
done
