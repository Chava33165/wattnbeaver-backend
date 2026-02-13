#!/bin/bash

echo "======================================"
echo "🎮 SIMULADOR DE LECTURAS IoT"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuración por defecto
DURATION_MINUTES=10
INTERVAL_SECONDS=5
USER_EMAIL="testdevices@example.com"
USER_PASSWORD="Test1234"

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--duration)
            DURATION_MINUTES="$2"
            shift 2
            ;;
        -i|--interval)
            INTERVAL_SECONDS="$2"
            shift 2
            ;;
        -u|--user)
            USER_EMAIL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Uso: $0 [opciones]"
            echo ""
            echo "Opciones:"
            echo "  -d, --duration MINUTOS    Duración en minutos (default: 10)"
            echo "  -i, --interval SEGUNDOS   Intervalo entre lecturas (default: 5)"
            echo "  -u, --user EMAIL          Email del usuario (default: testdevices@example.com)"
            echo "  -h, --help                Mostrar esta ayuda"
            echo ""
            echo "Ejemplos:"
            echo "  $0                        # Simular 10 minutos cada 5 segundos"
            echo "  $0 -d 5 -i 3              # Simular 5 minutos cada 3 segundos"
            echo "  $0 -d 30 -i 10            # Simular 30 minutos cada 10 segundos"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            echo "Usa -h o --help para ver las opciones"
            exit 1
            ;;
    esac
done

# Calcular número de iteraciones
TOTAL_SECONDS=$((DURATION_MINUTES * 60))
ITERATIONS=$((TOTAL_SECONDS / INTERVAL_SECONDS))

echo -e "${BLUE}Configuración:${NC}"
echo "  Usuario: $USER_EMAIL"
echo "  Duración: $DURATION_MINUTES minutos"
echo "  Intervalo: $INTERVAL_SECONDS segundos"
echo "  Total de lecturas: $ITERATIONS por dispositivo"
echo ""

# Login
echo -e "${YELLOW}Iniciando sesión...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Error al iniciar sesión${NC}"
    echo "Respuesta: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Sesión iniciada${NC}"
echo ""

# Obtener dispositivos del usuario
echo -e "${YELLOW}Obteniendo dispositivos...${NC}"
DEVICES_RESPONSE=$(curl -s $API_URL/devices \
  -H "Authorization: Bearer $TOKEN")

DEVICE_COUNT=$(echo "$DEVICES_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -z "$DEVICE_COUNT" ] || [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No hay dispositivos vinculados a este usuario${NC}"
    echo ""
    echo "Para vincular dispositivos, ejecuta:"
    echo "  ~/wattnbeaber/scripts/setup-simulator-devices.sh"
    exit 1
fi

echo -e "${GREEN}✓ $DEVICE_COUNT dispositivos encontrados${NC}"
echo ""

# Iniciar simulador del sistema
echo -e "${YELLOW}Iniciando simulador del sistema...${NC}"
START_RESPONSE=$(curl -s -X POST $API_URL/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"interval\":$((INTERVAL_SECONDS * 1000))}")

if echo "$START_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Simulador iniciado${NC}"
else
    echo -e "${RED}❌ Error al iniciar simulador${NC}"
    echo "$START_RESPONSE"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}🚀 SIMULACIÓN EN PROGRESO${NC}"
echo "======================================"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
echo ""

# Función para detener el simulador al salir
cleanup() {
    echo ""
    echo ""
    echo -e "${YELLOW}Deteniendo simulador...${NC}"
    curl -s -X POST $API_URL/simulator/stop \
      -H "Authorization: Bearer $TOKEN" > /dev/null
    
    echo -e "${GREEN}✓ Simulador detenido${NC}"
    echo ""
    
    # Mostrar estadísticas finales
    echo "======================================"
    echo "📊 ESTADÍSTICAS FINALES"
    echo "======================================"
    
    cd ~/wattnbeaber/backend
    node check-db-stats.js 2>/dev/null
    
    echo ""
    echo -e "${GREEN}✓ Simulación completada${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# Barra de progreso
echo -n "Progreso: ["

# Contador
CURRENT=0
PROGRESS_WIDTH=50

# Loop principal
for i in $(seq 1 $ITERATIONS); do
    # Calcular porcentaje
    PERCENT=$((i * 100 / ITERATIONS))
    
    # Actualizar barra cada 2%
    NEW_PROGRESS=$((PERCENT * PROGRESS_WIDTH / 100))
    if [ $NEW_PROGRESS -gt $CURRENT ]; then
        CURRENT=$NEW_PROGRESS
        echo -n "="
    fi
    
    # Esperar
    sleep $INTERVAL_SECONDS
    
    # Mostrar mensaje cada 10 iteraciones
    if [ $((i % 10)) -eq 0 ]; then
        ELAPSED=$((i * INTERVAL_SECONDS))
        REMAINING=$((TOTAL_SECONDS - ELAPSED))
        echo -ne "] ${PERCENT}% - ${ELAPSED}s transcurridos, ${REMAINING}s restantes\r"
        echo -n "Progreso: ["
        # Redibujar barra
        for j in $(seq 1 $CURRENT); do
            echo -n "="
        done
        for j in $(seq $CURRENT $PROGRESS_WIDTH); do
            echo -n " "
        done
    fi
done

echo -ne "] 100% - Completado!                                    \n"

# El cleanup se ejecutará automáticamente
