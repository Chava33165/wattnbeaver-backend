#!/bin/bash

# WattBeaver - Script de Testing para Endpoints de Ingesta
# Este script prueba los endpoints HTTP para dispositivos ESP32

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
API_URL="https://wattnbeaver-api.wattnbeaver.site/api/v1"

# Variables de configuración (configurar antes de ejecutar)
DEVICE_API_KEY=""        # API Key individual del dispositivo
GLOBAL_API_KEY=""        # API Key global (del archivo .env)
JWT_TOKEN=""             # Token JWT de usuario (para gestión de dispositivos)
DEVICE_UUID=""           # UUID del dispositivo en la BD
DEVICE_ID="sensor_001"   # ID del hardware del dispositivo

# Función de ayuda
show_help() {
  echo -e "${BLUE}=== WattBeaver - Script de Testing ===${NC}\n"
  echo "Uso: ./test-ingest.sh [opción]"
  echo ""
  echo "Opciones:"
  echo "  all                    - Ejecutar todos los tests"
  echo "  water                  - Test de ingesta de agua"
  echo "  energy                 - Test de ingesta de energía"
  echo "  device                 - Test de gestión de dispositivos"
  echo "  rotate                 - Test de rotación de API key"
  echo "  errors                 - Test de manejo de errores"
  echo "  help                   - Mostrar esta ayuda"
  echo ""
  echo "Antes de ejecutar, configurar las siguientes variables en el script:"
  echo "  DEVICE_API_KEY         - API Key individual del dispositivo"
  echo "  GLOBAL_API_KEY         - API Key global (opcional)"
  echo "  JWT_TOKEN              - Token JWT de usuario"
  echo "  DEVICE_UUID            - UUID del dispositivo"
  echo "  DEVICE_ID              - ID del hardware"
  echo ""
}

# Verificar configuración
check_config() {
  if [ -z "$DEVICE_API_KEY" ] && [ -z "$GLOBAL_API_KEY" ]; then
    echo -e "${RED}❌ Error: Debes configurar DEVICE_API_KEY o GLOBAL_API_KEY${NC}"
    echo "Edita el archivo test-ingest.sh y configura las variables."
    exit 1
  fi
}

# Test 1: Ingesta de agua
test_water_ingest() {
  echo -e "${BLUE}=== Test 1: Ingesta de Agua ===${NC}"

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ingest/water" \
    -H "Content-Type: application/json" \
    -H "X-Device-Api-Key: $DEVICE_API_KEY" \
    -d '{
      "device_id": "'"$DEVICE_ID"'",
      "flow": 2.5,
      "total": 100.0
    }')

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP $http_code)${NC}"
    echo "$body" | jq '.'
  else
    echo -e "${RED}❌ Test fallido (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  fi
  echo ""
}

# Test 2: Ingesta de energía
test_energy_ingest() {
  echo -e "${BLUE}=== Test 2: Ingesta de Energía ===${NC}"

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ingest/energy" \
    -H "Content-Type: application/json" \
    -H "X-Device-Api-Key: $DEVICE_API_KEY" \
    -d '{
      "device_id": "'"$DEVICE_ID"'",
      "power": 150.5,
      "voltage": 220.0,
      "current": 0.68,
      "energy": 1250.0
    }')

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP $http_code)${NC}"
    echo "$body" | jq '.'
  else
    echo -e "${RED}❌ Test fallido (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  fi
  echo ""
}

# Test 3: Obtener dispositivo (incluye API key)
test_get_device() {
  echo -e "${BLUE}=== Test 3: Obtener Dispositivo (GET /devices/:id) ===${NC}"

  if [ -z "$JWT_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Saltando test: JWT_TOKEN no configurado${NC}\n"
    return
  fi

  if [ -z "$DEVICE_UUID" ]; then
    echo -e "${YELLOW}⚠️  Saltando test: DEVICE_UUID no configurado${NC}\n"
    return
  fi

  response=$(curl -s -w "\n%{http_code}" "$API_URL/devices/$DEVICE_UUID" \
    -H "Authorization: Bearer $JWT_TOKEN")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP $http_code)${NC}"
    echo "$body" | jq '.data.device | {device_id, device_name, api_key}'
  else
    echo -e "${RED}❌ Test fallido (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  fi
  echo ""
}

# Test 4: Rotar API Key
test_rotate_key() {
  echo -e "${BLUE}=== Test 4: Rotar API Key (POST /devices/:id/rotate-key) ===${NC}"

  if [ -z "$JWT_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Saltando test: JWT_TOKEN no configurado${NC}\n"
    return
  fi

  if [ -z "$DEVICE_UUID" ]; then
    echo -e "${YELLOW}⚠️  Saltando test: DEVICE_UUID no configurado${NC}\n"
    return
  fi

  echo -e "${YELLOW}⚠️  Este test regenerará la API Key del dispositivo${NC}"
  read -p "¿Continuar? (y/n): " confirm
  if [ "$confirm" != "y" ]; then
    echo "Test cancelado"
    echo ""
    return
  fi

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/devices/$DEVICE_UUID/rotate-key" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP $http_code)${NC}"
    new_api_key=$(echo "$body" | jq -r '.data.device.api_key')
    echo "$body" | jq '.'
    echo -e "${YELLOW}🔑 Nueva API Key: $new_api_key${NC}"
    echo -e "${YELLOW}⚠️  Actualiza tu ESP32 con esta nueva clave${NC}"
  else
    echo -e "${RED}❌ Test fallido (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  fi
  echo ""
}

# Test 5: Manejo de errores
test_errors() {
  echo -e "${BLUE}=== Test 5: Manejo de Errores ===${NC}\n"

  # Test 5.1: Sin API Key
  echo -e "${YELLOW}Test 5.1: Ingesta sin API Key (debe retornar 401)${NC}"
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ingest/water" \
    -H "Content-Type: application/json" \
    -d '{"device_id": "'"$DEVICE_ID"'", "flow": 2.5, "total": 100.0}')

  http_code=$(echo "$response" | tail -n1)
  if [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP 401)${NC}"
  else
    echo -e "${RED}❌ Test fallido (esperado 401, obtenido $http_code)${NC}"
  fi
  echo ""

  # Test 5.2: API Key inválida
  echo -e "${YELLOW}Test 5.2: Ingesta con API Key inválida (debe retornar 401)${NC}"
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ingest/water" \
    -H "Content-Type: application/json" \
    -H "X-Device-Api-Key: clave-invalida-123" \
    -d '{"device_id": "'"$DEVICE_ID"'", "flow": 2.5, "total": 100.0}')

  http_code=$(echo "$response" | tail -n1)
  if [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP 401)${NC}"
  else
    echo -e "${RED}❌ Test fallido (esperado 401, obtenido $http_code)${NC}"
  fi
  echo ""

  # Test 5.3: Dispositivo no encontrado
  echo -e "${YELLOW}Test 5.3: Dispositivo inexistente (debe retornar 404)${NC}"
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ingest/water" \
    -H "Content-Type: application/json" \
    -H "X-Device-Api-Key: $DEVICE_API_KEY" \
    -d '{"device_id": "dispositivo_inexistente_999", "flow": 2.5, "total": 100.0}')

  http_code=$(echo "$response" | tail -n1)
  if [ "$http_code" -eq 404 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP 404)${NC}"
  else
    echo -e "${RED}❌ Test fallido (esperado 404, obtenido $http_code)${NC}"
  fi
  echo ""

  # Test 5.4: Datos inválidos (flow negativo)
  echo -e "${YELLOW}Test 5.4: Datos inválidos - flow negativo (debe retornar 400)${NC}"
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ingest/water" \
    -H "Content-Type: application/json" \
    -H "X-Device-Api-Key: $DEVICE_API_KEY" \
    -d '{"device_id": "'"$DEVICE_ID"'", "flow": -5.0, "total": 100.0}')

  http_code=$(echo "$response" | tail -n1)
  if [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP 400)${NC}"
  else
    echo -e "${RED}❌ Test fallido (esperado 400, obtenido $http_code)${NC}"
  fi
  echo ""

  # Test 5.5: Voltage fuera de rango
  echo -e "${YELLOW}Test 5.5: Voltage fuera de rango (debe retornar 400)${NC}"
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ingest/energy" \
    -H "Content-Type: application/json" \
    -H "X-Device-Api-Key: $DEVICE_API_KEY" \
    -d '{"device_id": "'"$DEVICE_ID"'", "voltage": 500, "power": 100}')

  http_code=$(echo "$response" | tail -n1)
  if [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP 400)${NC}"
  else
    echo -e "${RED}❌ Test fallido (esperado 400, obtenido $http_code)${NC}"
  fi
  echo ""
}

# Test 6: Autenticación con clave global (fallback)
test_global_key() {
  echo -e "${BLUE}=== Test 6: Autenticación con Clave Global (Fallback) ===${NC}"

  if [ -z "$GLOBAL_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Saltando test: GLOBAL_API_KEY no configurado${NC}\n"
    return
  fi

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ingest/water" \
    -H "Content-Type: application/json" \
    -H "X-Device-Key: $GLOBAL_API_KEY" \
    -d '{
      "device_id": "'"$DEVICE_ID"'",
      "flow": 3.0,
      "total": 105.0
    }')

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Test exitoso (HTTP $http_code)${NC}"
    echo "$body" | jq '.'
  else
    echo -e "${RED}❌ Test fallido (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  fi
  echo ""
}

# Main
case "$1" in
  water)
    check_config
    test_water_ingest
    ;;
  energy)
    check_config
    test_energy_ingest
    ;;
  device)
    test_get_device
    ;;
  rotate)
    test_rotate_key
    ;;
  errors)
    check_config
    test_errors
    ;;
  global)
    test_global_key
    ;;
  all)
    check_config
    test_water_ingest
    test_energy_ingest
    test_get_device
    test_errors
    test_global_key
    echo -e "${GREEN}=== Todos los tests completados ===${NC}"
    ;;
  help|*)
    show_help
    ;;
esac
