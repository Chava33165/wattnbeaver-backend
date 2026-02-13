#!/bin/bash

echo "======================================"
echo "WATTNBEABER - REPORTE DE PRUEBAS"
echo "======================================"
echo ""

BASE_URL="http://wattnbeaber.local:3000/api/v1"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Health
echo -e "${BLUE}TEST 1: Health Check${NC}"
curl -s $BASE_URL/health | jq '.'
echo ""

# Test 2: Login
echo -e "${BLUE}TEST 2: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testdevices@example.com","password":"Test1234"}')

echo "$LOGIN_RESPONSE" | jq '.'

# Extraer token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}ERROR: No se pudo obtener el token${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token obtenido${NC}"
echo ""

# Test 3: Perfil
echo -e "${BLUE}TEST 3: Mi Perfil${NC}"
curl -s $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 4: Dispositivos
echo -e "${BLUE}TEST 4: Mis Dispositivos${NC}"
curl -s $BASE_URL/devices \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 5: Estadísticas de dispositivos
echo -e "${BLUE}TEST 5: Estadísticas${NC}"
curl -s $BASE_URL/devices/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 6: Consumo total energía
echo -e "${BLUE}TEST 6: Consumo Total Energía${NC}"
curl -s $BASE_URL/energy/total \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 7: Consumo total agua
echo -e "${BLUE}TEST 7: Consumo Total Agua${NC}"
curl -s $BASE_URL/water/total \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 8: Gamificación
echo -e "${BLUE}TEST 8: Perfil Gamificación${NC}"
curl -s $BASE_URL/gamification/profile \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 9: Logros
echo -e "${BLUE}TEST 9: Mis Logros${NC}"
curl -s $BASE_URL/gamification/achievements \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 10: Estado del simulador
echo -e "${BLUE}TEST 10: Estado Simulador${NC}"
curl -s $BASE_URL/simulator/status \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 11: Estadísticas MQTT
echo -e "${BLUE}TEST 11: Estadísticas MQTT${NC}"
curl -s $BASE_URL/mqtt/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 12: Base de datos
echo -e "${BLUE}TEST 12: Estadísticas Base de Datos${NC}"
node ~/wattnbeaber/backend/check-db-stats.js
echo ""

echo "======================================"
echo -e "${GREEN}✓ PRUEBAS COMPLETADAS${NC}"
echo "======================================"
