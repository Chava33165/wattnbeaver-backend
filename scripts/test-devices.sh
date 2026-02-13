#!/bin/bash

echo "======================================"
echo "🧪 PRUEBAS GESTIÓN DE DISPOSITIVOS"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

# Registrar usuario de prueba
echo "1️⃣  Registrando usuario de prueba..."
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testdevices@example.com",
    "password": "Test1234"
  }')

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Si ya existe, hacer login
if [ -z "$TOKEN" ]; then
  echo "Usuario ya existe, haciendo login..."
  TOKEN=$(curl -s -X POST $API_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testdevices@example.com",
      "password": "Test1234"
    }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo "✅ Token obtenido"
echo ""

# Vincular dispositivo de energía
echo "2️⃣  Vinculando dispositivo de energía..."
DEVICE1=$(curl -s -X POST $API_URL/devices/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sonoff_kitchen",
    "device_name": "Refrigerador Cocina",
    "device_type": "energy",
    "location": "Cocina"
  }')

echo "$DEVICE1" | json_pp
echo ""

# Vincular dispositivo de agua
echo "3️⃣  Vinculando dispositivo de agua..."
DEVICE2=$(curl -s -X POST $API_URL/devices/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sensor_bathroom",
    "device_name": "Sensor Baño Principal",
    "device_type": "water",
    "location": "Baño Principal"
  }')

echo "$DEVICE2" | json_pp
echo ""

# Listar todos los dispositivos
echo "4️⃣  Listando todos los dispositivos..."
curl -s $API_URL/devices \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Filtrar solo energía
echo "5️⃣  Filtrando solo dispositivos de energía..."
curl -s "$API_URL/devices?type=energy" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Estadísticas
echo "6️⃣  Estadísticas de dispositivos..."
curl -s $API_URL/devices/stats \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Actualizar dispositivo
DEVICE_ID=$(echo "$DEVICE1" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$DEVICE_ID" ]; then
  echo "7️⃣  Actualizando nombre del dispositivo..."
  curl -s -X PUT $API_URL/devices/$DEVICE_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "device_name": "Refrigerador Samsung",
      "location": "Cocina Principal"
    }' | json_pp
  echo ""
fi

echo "✅ PRUEBAS COMPLETADAS"
echo "======================================"