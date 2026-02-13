#!/bin/bash

echo "======================================"
echo "🔴 PRUEBA SIMULADOR EN VIVO"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/v1"

# Login
echo "1️⃣  Login..."
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testdevices@example.com","password":"Test1234"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✅ Token obtenido"
echo ""

# Estado actual del simulador
echo "2️⃣  Estado actual del simulador..."
curl -s $API_URL/simulator/status \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Estadísticas MQTT
echo "3️⃣  Estadísticas MQTT..."
curl -s $API_URL/mqtt/stats \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Iniciar simulador
echo "4️⃣  Iniciando simulador..."
curl -s -X POST $API_URL/simulator/start \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "⏱️  Esperando 10 segundos para recolectar datos..."
sleep 10

# Ver datos nuevos
echo "5️⃣  Consumo actualizado energía..."
curl -s $API_URL/energy/total \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "6️⃣  Consumo actualizado agua..."
curl -s $API_URL/water/total \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Estadísticas MQTT después
echo "7️⃣  Estadísticas MQTT actualizadas..."
curl -s $API_URL/mqtt/stats \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Detener simulador
echo "8️⃣  Deteniendo simulador..."
curl -s -X POST $API_URL/simulator/stop \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "✅ PRUEBA EN VIVO COMPLETADA"
echo "======================================"
