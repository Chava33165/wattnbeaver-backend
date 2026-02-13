#!/bin/bash

echo "======================================"
echo "🔧 VINCULANDO DISPOSITIVOS SIMULADOS"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

# Login
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdevices@example.com",
    "password": "Test1234"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "✅ Token obtenido"
echo ""

# Vincular dispositivos de energía del simulador
echo "Vinculando sonoff_01..."
curl -s -X POST $API_URL/devices/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sonoff_01",
    "device_name": "Dispositivo Simulado 1",
    "device_type": "energy",
    "location": "Simulador"
  }' | json_pp

echo ""
echo "Vinculando sonoff_02..."
curl -s -X POST $API_URL/devices/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sonoff_02",
    "device_name": "Dispositivo Simulado 2",
    "device_type": "energy",
    "location": "Simulador"
  }' | json_pp

echo ""

# Vincular sensores de agua del simulador
echo "Vinculando sensor_01..."
curl -s -X POST $API_URL/devices/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sensor_01",
    "device_name": "Sensor Agua Simulado 1",
    "device_type": "water",
    "location": "Simulador"
  }' | json_pp

echo ""
echo "Vinculando sensor_02..."
curl -s -X POST $API_URL/devices/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sensor_02",
    "device_name": "Sensor Agua Simulado 2",
    "device_type": "water",
    "location": "Simulador"
  }' | json_pp

echo ""
echo "✅ Dispositivos vinculados"