#!/bin/bash

echo "======================================"
echo "📱 PRUEBAS DISPOSITIVOS Y DATOS"
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

# Mis dispositivos
echo "2️⃣  Mis dispositivos..."
curl -s $API_URL/devices \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Estadísticas de dispositivos
echo "3️⃣  Estadísticas de dispositivos..."
curl -s $API_URL/devices/stats \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Consumo total de energía
echo "4️⃣  Consumo TOTAL de energía..."
curl -s $API_URL/energy/total \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Consumo total de agua
echo "5️⃣  Consumo TOTAL de agua..."
curl -s $API_URL/water/total \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Histórico de energía (últimas 24h)
echo "6️⃣  Histórico energía (24h)..."
curl -s "$API_URL/energy/history?period=day" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

# Histórico de agua (últimas 24h)
echo "7️⃣  Histórico agua (24h)..."
curl -s "$API_URL/water/history?period=day" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo ""

echo "✅ PRUEBAS COMPLETADAS"
echo "======================================"
